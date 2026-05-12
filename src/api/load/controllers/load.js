"use strict";

const { LOAD, DISPATCHER_SHIFT } = require("../../../constants/models");

const dbConfig = require("../../../../config/customDatabase");
const { validateAssignLoad } = require("../validation");
const { findMany } = require("../../../helpers");

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

const loadFields = {
  fields: [
    "uuid",
    "product",
    "price",
    "quantity",
    "total",
    "discount",
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
            "lognew"
          )
          .where("nrobom", bombId)
          .orderBy("lognew", "desc")
          .first()
          .timeout(60000);

        if (lastLoad) {
          const conflictLoad = await strapi.query(LOAD).findOne({
            where: {
              quantity: lastLoad?.can,
              price: lastLoad?.pre,
              total: lastLoad?.mto,
              date: lastLoad?.datetime_combined.toISOString(),
            },
          });

          if (conflictLoad) {
            return null;
          }
        }

        return lastLoad;
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
          "lognew"
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
    const promotionContext = {
      customer: data.customer,
      vehicle: data.vehicle,
      fleet: data.fleet,
    };

    await validateAssignLoad(data);

    await strapi.service(LOAD).parseCustomer(data);

    await strapi.service(LOAD).parseFleet(data);

    await strapi.service(LOAD).assignDiscount(data, promotionContext);

    data.total = calculateNetTotal(data);

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

    const newLoad = await strapi.entityService.create(LOAD, {
      data: {
        ...data,
        branch: user.branch,
        dispatcher: user.id,
        shift: activeShift.id,
      },
      ...loadFields,
    });

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
