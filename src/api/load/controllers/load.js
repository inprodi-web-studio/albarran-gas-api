"use strict";

const { LOAD, DISPATCHER_SHIFT } = require("../../../constants/models");

const dbConfig = require("../../../../config/customDatabase");
const { validateAssignLoad } = require("../validation");
const { findMany } = require("../../../helpers");
const { ConflictError } = require("../../../helpers/errors");

const { createCoreController } = require("@strapi/strapi").factories;

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed;
};

const calculateNetTotal = (data = {}) => {
  const quantity = toNumber(data.quantity, 0);
  const price = toNumber(data.price, 0);
  const grossTotal = toNumber(data.total, quantity * price);
  const discountPerLiter = toNumber(data.discount, 0);
  const discountTotal = quantity * discountPerLiter;
  const netTotal = Math.max(grossTotal - discountTotal, 0);

  return parseFloat(netTotal.toFixed(2));
};

const normalizeExternalValue = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = value.toString().trim();

  if (!normalized || normalized === "null") {
    return null;
  }

  return normalized;
};

const normalizeExternalDate = (value) => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return normalizeExternalValue(value);
};

const buildExternalLoadKey = ({ branch, externalBombId, externalLoadId }) => {
  const normalizedBranch = normalizeExternalValue(branch);
  const normalizedBombId = normalizeExternalValue(externalBombId);
  const normalizedLoadId = normalizeExternalValue(externalLoadId);

  if (!normalizedBranch || !normalizedBombId || !normalizedLoadId) {
    return null;
  }

  return `${normalizedBranch}:${normalizedBombId}:${normalizedLoadId}`;
};

const isUniqueConstraintError = (error) => {
  const message = `${error?.message ?? ""} ${error?.details?.message ?? ""}`;

  return /unique|duplicate|constraint|ER_DUP_ENTRY/i.test(message);
};

const findAssignedLoad = async (
  strapi,
  { branch, externalLoadKey, externalLoadId, externalBombId, quantity, price, date }
) => {
  const normalizedBranch = normalizeExternalValue(branch);
  const normalizedLoadKey = normalizeExternalValue(externalLoadKey);
  const normalizedLoadId = normalizeExternalValue(externalLoadId);
  const normalizedBombId = normalizeExternalValue(externalBombId);
  const normalizedDate = normalizeExternalDate(date);

  if (!normalizedBranch) {
    return null;
  }

  if (normalizedLoadKey) {
    const assignedLoad = await strapi.db.query(LOAD).findOne({
      where: {
        branch: normalizedBranch,
        externalLoadKey: normalizedLoadKey,
      },
      select: ["uuid"],
    });

    if (assignedLoad) {
      return assignedLoad;
    }
  }

  if (normalizedLoadId) {
    const assignedLoad = await strapi.db.query(LOAD).findOne({
      where: {
        branch: normalizedBranch,
        externalLoadId: normalizedLoadId,
        ...(normalizedBombId && { externalBombId: normalizedBombId }),
      },
      select: ["uuid"],
    });

    if (assignedLoad) {
      return assignedLoad;
    }
  }

  if (normalizedDate) {
    return strapi.db.query(LOAD).findOne({
      where: {
        branch: normalizedBranch,
        date: normalizedDate,
        quantity: toNumber(quantity, 0),
        price: toNumber(price, 0),
      },
      select: ["uuid"],
    });
  }

  return null;
};

const addAssignmentStatus = async (strapi, load, { branch, bombId }) => {
  if (!load) {
    return load;
  }

  const externalLoadId = normalizeExternalValue(load.lognew);
  const externalBombId = normalizeExternalValue(load.nrobom ?? bombId);
  const externalLoadKey = buildExternalLoadKey({
    branch,
    externalBombId,
    externalLoadId,
  });
  const assignedLoad = await findAssignedLoad(strapi, {
    branch,
    externalLoadKey,
    externalLoadId,
    externalBombId,
    quantity: load.can,
    price: load.pre,
    date: load.datetime_combined,
  });

  return {
    ...load,
    nrobom: Number(externalBombId ?? bombId),
    assigned: Boolean(assignedLoad),
    assignedLoadUuid: assignedLoad?.uuid ?? null,
  };
};

const loadFields = {
  fields: [
    "uuid",
    "product",
    "price",
    "quantity",
    "total",
    "discount",
    "promotionUuid",
    "promotionTitle",
    "externalLoadKey",
    "externalLoadId",
    "externalBombId",
    "customerSummarySeenAt",
    "customerSummaryPending",
    "date",
    "branch",
  ],
  populate: {
    customer: {
      fields: ["uuid", "name", "lastName"],
    },
    vehicle: {
      fields: ["uuid", "brand", "model", "plates"],
    },
    fleet: {
      fields: ["uuid", "name", "code"],
    },
  },
};

module.exports = createCoreController(LOAD, ({ strapi }) => ({
  async getLoads_Customer(ctx) {
    const { id } = ctx.state.user;

    const loads = await findMany(LOAD, loadFields, {
      customer: id,
    });

    const stats = await strapi.service(LOAD).getStats(id);

    loads.stats = stats;

    return loads;
  },

  async getPendingSummary_Customer(ctx) {
    const { id } = ctx.state.user;

    const load = await strapi.db.query(LOAD).findOne({
      where: {
        customer: id,
        customerSummaryPending: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: loadFields.fields,
      populate: loadFields.populate,
    });

    return load || null;
  },

  async markSummarySeen_Customer(ctx) {
    const { id } = ctx.state.user;
    const { uuid } = ctx.params;

    const load = await strapi.db.query(LOAD).findOne({
      where: {
        customer: id,
        uuid,
      },
      select: ["id", "uuid"],
    });

    if (!load) {
      ctx.notFound("Load not found.");
      return;
    }

    return strapi.entityService.update(LOAD, load.id, {
      data: {
        customerSummarySeenAt: new Date(),
        customerSummaryPending: false,
      },
      fields: ["uuid", "customerSummarySeenAt", "customerSummaryPending"],
    });
  },

  async getLoads(ctx) {
    const { bombId } = ctx.params;
    const { last } = ctx.query;
    const { branch } = ctx.state.user;

    if (!dbConfig[branch]) {
      ctx.throw(400, `No existe configuración para la sucursal: ${branch}`);
      return;
    }

    const knex = require("knex")(dbConfig[branch]);

    try {
      if (last) {
        const lastLoad = await knex("Despachos")
          .select(
            "can",
            "pre",
            "codprd",
            "mto",
            knex.raw(
              "DATEADD(day, fchtrn - 2, '1900-01-01') AS converted_date"
            ),
            knex.raw(
              "RIGHT('0' + CAST(hratrn / 100 AS VARCHAR(2)), 2) + ':' + RIGHT('0' + CAST(hratrn % 100 AS VARCHAR(2)), 2) AS converted_time"
            ),
            knex.raw(
              "CAST(DATEADD(day, fchtrn - 2, '1900-01-01') AS DATETIME) + CAST(RIGHT('0' + CAST(hratrn / 100 AS VARCHAR(2)), 2) + ':' + RIGHT('0' + CAST(hratrn % 100 AS VARCHAR(2)), 2) AS DATETIME) AS datetime_combined"
            ),
            "lognew",
            "nrobom"
          )
          .where("nrobom", bombId)
          .orderBy("lognew", "desc")
          .first()
          .timeout(60000);

        return addAssignmentStatus(strapi, lastLoad, { branch, bombId });
      }

      const loads = await knex("Despachos")
        .select(
          "can",
          "pre",
          "codprd",
          "mto",
          knex.raw("DATEADD(day, fchtrn - 2, '1900-01-01') AS converted_date"),
          knex.raw(
            "RIGHT('0' + CAST(hratrn / 100 AS VARCHAR(2)), 2) + ':' + RIGHT('0' + CAST(hratrn % 100 AS VARCHAR(2)), 2) AS converted_time"
          ),
          knex.raw(
            "CAST(DATEADD(day, fchtrn - 2, '1900-01-01') AS DATETIME) + CAST(RIGHT('0' + CAST(hratrn / 100 AS VARCHAR(2)), 2) + ':' + RIGHT('0' + CAST(hratrn % 100 AS VARCHAR(2)), 2) AS DATETIME) AS datetime_combined"
          ),
          "lognew",
          "nrobom"
        )
        .where("nrobom", bombId)
        .orderBy("lognew", "desc")
        .limit(30)
        .timeout(60000);

      return loads;
    } catch (error) {
      ctx.throw(500, error);
    } finally {
      if (knex) {
        await knex.destroy();
      }
    }
  },

  async assignLoad(ctx) {
    const data = ctx.request.body;
    const user = ctx.state.user;
    const now = new Date();
    const externalLoadId = normalizeExternalValue(data.externalLoadId);
    const externalBombId = normalizeExternalValue(data.externalBombId);
    const externalLoadKey = buildExternalLoadKey({
      branch: user.branch,
      externalBombId,
      externalLoadId,
    });
    const promotionContext = {
      customer: data.customer,
      vehicle: data.vehicle,
      fleet: data.fleet,
    };

    await validateAssignLoad(data);

    const assignedLoad = await findAssignedLoad(strapi, {
      branch: user.branch,
      externalLoadKey,
      externalLoadId,
      externalBombId,
      quantity: data.quantity,
      price: data.price,
      date: data.date,
    });

    if (assignedLoad) {
      throw new ConflictError("Load already assigned.", {
        key: "load.alreadyAssigned",
      });
    }

    await strapi.service(LOAD).parseCustomer(data);

    await strapi.service(LOAD).parseFleet(data);

    await strapi.service(LOAD).assignDiscount(data, promotionContext);

    data.total = calculateNetTotal(data);
    data.externalLoadId = externalLoadId;
    data.externalBombId = externalBombId;
    data.externalLoadKey = externalLoadKey;
    data.customerSummaryPending = true;

    let activeShift = await strapi.db.query(DISPATCHER_SHIFT).findOne({
      where: {
        dispatcher: user.id,
        endedAt: null,
      },
      orderBy: {
        startedAt: "desc",
      },
      select: ["id"],
    });

    if (!activeShift) {
      activeShift = await strapi.entityService.create(DISPATCHER_SHIFT, {
        data: {
          dispatcher: user.id,
          branch: user.branch,
          startedAt: now,
          status: "active",
        },
        fields: ["id"],
      });
    }

    let newLoad;

    try {
      newLoad = await strapi.entityService.create(LOAD, {
        data: {
          ...data,
          branch: user.branch,
          dispatcher: user.id,
          shift: activeShift.id,
        },
        ...loadFields,
      });
    } catch (error) {
      if (externalLoadKey && isUniqueConstraintError(error)) {
        throw new ConflictError("Load already assigned.", {
          key: "load.alreadyAssigned",
        });
      }

      throw error;
    }

    return newLoad;
  },

  async getCurrentShiftReport(ctx) {
    const user = ctx.state.user;

    const activeShift = await strapi.db.query(DISPATCHER_SHIFT).findOne({
      where: {
        dispatcher: user.id,
        endedAt: null,
      },
      orderBy: {
        startedAt: "desc",
      },
      select: ["id", "uuid", "branch", "startedAt", "endedAt", "status"],
    });

    if (!activeShift) {
      return {
        shift: null,
        loads: [],
        totals: {
          loadsCount: 0,
          totalLiters: 0,
          subtotal: 0,
          discountTotal: 0,
          total: 0,
        },
      };
    }

    const loads = await strapi.db.query(LOAD).findMany({
      where: {
        shift: activeShift.id,
      },
      orderBy: {
        date: "desc",
      },
      select: ["uuid", "date", "quantity", "price", "discount", "total"],
    });

    const formattedLoads = loads.map((item) => {
      const quantity = toNumber(item.quantity);
      const price = toNumber(item.price);
      const discount = toNumber(item.discount);
      const subtotal = quantity * price;
      const discountTotal = quantity * discount;
      const total = toNumber(item.total, subtotal - discountTotal);

      return {
        uuid: item.uuid,
        date: item.date,
        quantity: parseFloat(quantity.toFixed(2)),
        price: parseFloat(price.toFixed(2)),
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount: parseFloat(discount.toFixed(2)),
        discountTotal: parseFloat(discountTotal.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
      };
    });

    const totals = formattedLoads.reduce(
      (accumulator, item) => {
        accumulator.loadsCount += 1;
        accumulator.totalLiters += item.quantity;
        accumulator.subtotal += item.subtotal;
        accumulator.discountTotal += item.discountTotal;
        accumulator.total += item.total;
        return accumulator;
      },
      {
        loadsCount: 0,
        totalLiters: 0,
        subtotal: 0,
        discountTotal: 0,
        total: 0,
      }
    );

    return {
      shift: {
        uuid: activeShift.uuid,
        branch: activeShift.branch,
        startedAt: activeShift.startedAt,
        endedAt: activeShift.endedAt,
        status: activeShift.status,
      },
      loads: formattedLoads,
      totals: {
        loadsCount: totals.loadsCount,
        totalLiters: parseFloat(totals.totalLiters.toFixed(2)),
        subtotal: parseFloat(totals.subtotal.toFixed(2)),
        discountTotal: parseFloat(totals.discountTotal.toFixed(2)),
        total: parseFloat(totals.total.toFixed(2)),
      },
    };
  },
}));
