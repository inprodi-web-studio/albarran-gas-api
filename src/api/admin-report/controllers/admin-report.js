"use strict";

const {
  LOAD,
  USER,
  DISPATCHER_SHIFT,
} = require("../../../constants/models");
const branches = require("../../../constants/branches");
const { ForbiddenError, NotFoundError } = require("../../../helpers/errors");
const {
  buildShiftReportFileName,
  buildShiftReportPdf,
  findShiftWithDispatcherByUuid,
  formatShiftReport,
  getShiftLoads,
} = require("../../../helpers/shiftReport");

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed;
};

const roundMoney = (value) => parseFloat(toNumber(value).toFixed(2));

const firstValue = (value) => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

const normalizeDateBoundary = (value, boundary) => {
  const rawValue = firstValue(value);

  if (!rawValue) {
    return null;
  }

  const asString = String(rawValue);
  const normalizedValue = /^\d{4}-\d{2}-\d{2}$/.test(asString)
    ? `${asString}T${boundary === "end" ? "23:59:59.999" : "00:00:00.000"}Z`
    : asString;
  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
};

const getPagination = (query = {}) => {
  const parsedPage = Number(firstValue(query.page));
  const parsedLimit = Number(firstValue(query.limit));
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
    ? Math.min(Math.floor(parsedLimit), MAX_LIMIT)
    : DEFAULT_LIMIT;

  return {
    page,
    limit,
    start: (page - 1) * limit,
  };
};

const parseSort = (value, allowedFields, fallback) => {
  const rawValue = String(firstValue(value) || fallback);
  const [rawField, rawDirection = "desc"] = rawValue.split(":");
  const field = allowedFields.includes(rawField) ? rawField : fallback.split(":")[0];
  const direction = rawDirection === "asc" ? "asc" : "desc";

  return `${field}:${direction}`;
};

const getDateKey = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  return date.toISOString().slice(0, 10);
};

const formatPersonName = (person) => {
  if (!person) {
    return "-";
  }

  return [person.name, person.lastName].filter(Boolean).join(" ").trim() || person.email || "-";
};

const assertAdmin = (ctx) => {
  if (ctx.state.user?.type !== "admin") {
    throw new ForbiddenError("Only admins can access this resource.", {
      key: "auth.adminOnly",
      path: ctx.request.path,
    });
  }
};

const buildDateFilter = (query, field) => {
  const from = normalizeDateBoundary(query.from, "start");
  const to = normalizeDateBoundary(query.to, "end");

  if (!from && !to) {
    return {};
  }

  return {
    [field]: {
      ...(from && { $gte: from }),
      ...(to && { $lte: to }),
    },
  };
};

const buildLoadFilters = (query = {}, extraFilters = {}) => {
  const filters = {
    ...buildDateFilter(query, "date"),
    ...extraFilters,
  };
  const customer = firstValue(query.customer);
  const dispatcher = firstValue(query.dispatcher);
  const branch = firstValue(query.branch);
  const shift = firstValue(query.shift);

  if (customer) {
    filters.customer = {
      uuid: {
        $eq: customer,
      },
    };
  }

  if (dispatcher) {
    filters.dispatcher = {
      uuid: {
        $eq: dispatcher,
      },
    };
  }

  if (branch) {
    filters.branch = {
      $eq: branch,
    };
  }

  if (shift) {
    filters.shift = {
      uuid: {
        $eq: shift,
      },
    };
  }

  return filters;
};

const loadPopulate = {
  customer: {
    fields: ["uuid", "name", "lastName", "email"],
  },
  dispatcher: {
    fields: ["uuid", "name", "lastName", "email"],
  },
  shift: {
    fields: ["uuid", "branch", "startedAt", "endedAt", "status"],
  },
  fiscal: {
    fields: ["uuid", "legalName", "rfc", "cp", "regime"],
  },
  vehicle: {
    fields: ["uuid", "brand", "model", "plates"],
  },
  fleet: {
    fields: ["uuid", "name", "code"],
  },
};

const loadFields = [
  "uuid",
  "product",
  "price",
  "quantity",
  "total",
  "discount",
  "promotionUuid",
  "promotionTitle",
  "date",
  "branch",
];

const formatLoadRow = (load) => {
  const quantity = toNumber(load.quantity);
  const price = toNumber(load.price);
  const subtotal = quantity * price;
  const discountPerLiter = toNumber(load.discount);
  const discountTotal = quantity * discountPerLiter;
  const total = toNumber(load.total, subtotal - discountTotal);
  const branchInfo = branches[load.branch] || {};

  return {
    uuid: load.uuid,
    date: load.date,
    product: load.product || "-",
    quantity: roundMoney(quantity),
    price: roundMoney(price),
    subtotal: roundMoney(subtotal),
    discount: roundMoney(discountPerLiter),
    discountTotal: roundMoney(discountTotal),
    total: roundMoney(total),
    promotionUuid: load.promotionUuid || null,
    promotionTitle: load.promotionTitle || null,
    branch: {
      value: load.branch || null,
      label: branchInfo.label || load.branch || "-",
      address: branchInfo.address || null,
    },
    customer: load.customer
      ? {
          uuid: load.customer.uuid,
          name: formatPersonName(load.customer),
          email: load.customer.email || null,
        }
      : null,
    dispatcher: load.dispatcher
      ? {
          uuid: load.dispatcher.uuid,
          name: formatPersonName(load.dispatcher),
          email: load.dispatcher.email || null,
        }
      : null,
    shift: load.shift
      ? {
          uuid: load.shift.uuid,
          branch: load.shift.branch,
          startedAt: load.shift.startedAt,
          endedAt: load.shift.endedAt,
          status: load.shift.status,
        }
      : null,
    fiscal: load.fiscal
      ? {
          uuid: load.fiscal.uuid,
          legalName: load.fiscal.legalName,
          rfc: load.fiscal.rfc,
          cp: load.fiscal.cp,
          regime: load.fiscal.regime,
        }
      : null,
    vehicle: load.vehicle
      ? {
          uuid: load.vehicle.uuid,
          brand: load.vehicle.brand,
          model: load.vehicle.model,
          plates: load.vehicle.plates,
        }
      : null,
    fleet: load.fleet
      ? {
          uuid: load.fleet.uuid,
          name: load.fleet.name,
          code: load.fleet.code,
        }
      : null,
  };
};

const buildLoadSummary = (rows) => {
  const totals = rows.reduce(
    (accumulator, row) => {
      accumulator.loadsCount += 1;
      accumulator.totalLiters += row.quantity;
      accumulator.subtotal += row.subtotal;
      accumulator.discountTotal += row.discountTotal;
      accumulator.total += row.total;
      accumulator.invoiceRequests += row.fiscal ? 1 : 0;
      return accumulator;
    },
    {
      loadsCount: 0,
      totalLiters: 0,
      subtotal: 0,
      discountTotal: 0,
      total: 0,
      invoiceRequests: 0,
    }
  );

  return {
    loadsCount: totals.loadsCount,
    totalLiters: roundMoney(totals.totalLiters),
    subtotal: roundMoney(totals.subtotal),
    discountTotal: roundMoney(totals.discountTotal),
    total: roundMoney(totals.total),
    invoiceRequests: totals.invoiceRequests,
  };
};

const buildLoadChart = (rows) => {
  const grouped = rows.reduce((accumulator, row) => {
    const date = getDateKey(row.date);

    if (!accumulator[date]) {
      accumulator[date] = {
        date,
        cargas: 0,
        litros: 0,
        descuento: 0,
        total: 0,
      };
    }

    accumulator[date].cargas += 1;
    accumulator[date].litros += row.quantity;
    accumulator[date].descuento += row.discountTotal;
    accumulator[date].total += row.total;

    return accumulator;
  }, {});

  return Object.values(grouped)
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((item) => ({
      ...item,
      litros: roundMoney(item.litros),
      descuento: roundMoney(item.descuento),
      total: roundMoney(item.total),
    }));
};

const buildPaginatedResponse = ({ rows, page, limit, start, summary, chart }) => ({
  data: rows.slice(start, start + limit),
  meta: {
    totalDocs: rows.length,
    limit,
    page,
    totalPages: Math.ceil(rows.length / limit) || 1,
  },
  summary,
  chart,
});

const findReportLoads = async ({ query, extraFilters = {} }) => {
  const filters = buildLoadFilters(query, extraFilters);
  const sort = parseSort(query.sort, ["date", "total", "quantity", "discount", "branch", "product"], "date:desc");
  const loads = await strapi.entityService.findMany(LOAD, {
    fields: loadFields,
    populate: loadPopulate,
    filters,
    sort: [sort],
  });

  return loads.map(formatLoadRow);
};

const buildShiftFilters = (query = {}) => {
  const filters = {};
  const date = firstValue(query.date);
  const dispatcher = firstValue(query.dispatcher);
  const status = firstValue(query.status);

  if (date) {
    const from = normalizeDateBoundary(date, "start");
    const to = normalizeDateBoundary(date, "end");

    if (from || to) {
      filters.startedAt = {
        ...(from && { $gte: from }),
        ...(to && { $lte: to }),
      };
    }
  }

  if (dispatcher) {
    filters.dispatcher = {
      uuid: {
        $eq: dispatcher,
      },
    };
  }

  if (status) {
    filters.status = {
      $eq: status,
    };
  }

  return filters;
};

const buildShiftReportSummary = (rows) => {
  const totals = rows.reduce((accumulator, row) => {
    accumulator.shiftsCount += 1;
    accumulator.loadsCount += row.totals.loadsCount;
    accumulator.totalLiters += row.totals.quantity;
    accumulator.subtotal += row.totals.subtotal;
    accumulator.discountTotal += row.totals.discountTotal;
    accumulator.total += row.totals.total;
    return accumulator;
  }, {
    shiftsCount: 0,
    loadsCount: 0,
    totalLiters: 0,
    subtotal: 0,
    discountTotal: 0,
    total: 0,
  });

  return {
    shiftsCount: totals.shiftsCount,
    loadsCount: totals.loadsCount,
    totalLiters: roundMoney(totals.totalLiters),
    subtotal: roundMoney(totals.subtotal),
    discountTotal: roundMoney(totals.discountTotal),
    total: roundMoney(totals.total),
  };
};

module.exports = {
  async getOptions(ctx) {
    assertAdmin(ctx);

    const [customers, dispatchers, shifts] = await Promise.all([
      strapi.entityService.findMany(USER, {
        fields: ["uuid", "name", "lastName", "email"],
        filters: {
          type: "customer",
        },
        sort: ["name:asc", "lastName:asc"],
      }),
      strapi.entityService.findMany(USER, {
        fields: ["uuid", "name", "lastName", "email"],
        filters: {
          type: "dispatcher",
        },
        sort: ["name:asc", "lastName:asc"],
      }),
      strapi.entityService.findMany(DISPATCHER_SHIFT, {
        fields: ["uuid", "branch", "startedAt", "endedAt", "status"],
        populate: {
          dispatcher: {
            fields: ["uuid", "name", "lastName", "email"],
          },
        },
        sort: ["startedAt:desc"],
        limit: 500,
      }),
    ]);

    return {
      branches: Object.entries(branches).map(([value, item]) => ({
        value,
        label: item.label,
        address: item.address,
      })),
      customers: customers.map((customer) => ({
        value: customer.uuid,
        label: formatPersonName(customer),
        email: customer.email,
      })),
      dispatchers: dispatchers.map((dispatcher) => ({
        value: dispatcher.uuid,
        label: formatPersonName(dispatcher),
        email: dispatcher.email,
      })),
      shifts: shifts.map((shift) => ({
        value: shift.uuid,
        label: `${formatPersonName(shift.dispatcher)} · ${branches[shift.branch]?.label || shift.branch || "-"} · ${getDateKey(shift.startedAt)}`,
        branch: shift.branch,
        startedAt: shift.startedAt,
        endedAt: shift.endedAt,
        status: shift.status,
        dispatcher: shift.dispatcher
          ? {
              uuid: shift.dispatcher.uuid,
              name: formatPersonName(shift.dispatcher),
            }
          : null,
      })),
    };
  },

  async getLoads(ctx) {
    assertAdmin(ctx);

    const pagination = getPagination(ctx.query);
    const rows = await findReportLoads({
      query: ctx.query,
    });

    return buildPaginatedResponse({
      rows,
      ...pagination,
      summary: buildLoadSummary(rows),
      chart: buildLoadChart(rows),
    });
  },

  async getDiscounts(ctx) {
    assertAdmin(ctx);

    const pagination = getPagination(ctx.query);
    const rows = await findReportLoads({
      query: ctx.query,
      extraFilters: {
        discount: {
          $gt: 0,
        },
      },
    });

    return buildPaginatedResponse({
      rows,
      ...pagination,
      summary: buildLoadSummary(rows),
      chart: buildLoadChart(rows),
    });
  },

  async getInvoices(ctx) {
    assertAdmin(ctx);

    const pagination = getPagination(ctx.query);
    const rows = (await findReportLoads({
      query: ctx.query,
    })).filter((row) => row.fiscal);

    return buildPaginatedResponse({
      rows,
      ...pagination,
      summary: buildLoadSummary(rows),
      chart: buildLoadChart(rows),
    });
  },

  async getCustomers(ctx) {
    assertAdmin(ctx);

    const pagination = getPagination(ctx.query);
    const sort = parseSort(ctx.query.sort, ["createdAt", "name", "lastName", "email"], "createdAt:desc");
    const customers = await strapi.entityService.findMany(USER, {
      fields: ["uuid", "name", "lastName", "email", "phone", "createdAt", "confirmed", "blocked"],
      filters: {
        type: "customer",
        ...buildDateFilter(ctx.query, "createdAt"),
      },
      sort: [sort],
    });
    const rows = customers.map((customer) => ({
      uuid: customer.uuid,
      createdAt: customer.createdAt,
      name: formatPersonName(customer),
      email: customer.email,
      phone: customer.phone || "-",
      confirmed: Boolean(customer.confirmed),
      blocked: Boolean(customer.blocked),
    }));
    const chartMap = rows.reduce((accumulator, row) => {
      const date = getDateKey(row.createdAt);

      accumulator[date] = accumulator[date] || {
        date,
        clientes: 0,
      };
      accumulator[date].clientes += 1;

      return accumulator;
    }, {});

    return buildPaginatedResponse({
      rows,
      ...pagination,
      summary: {
        customersCount: rows.length,
        confirmedCount: rows.filter((row) => row.confirmed).length,
        blockedCount: rows.filter((row) => row.blocked).length,
      },
      chart: Object.values(chartMap).sort((left, right) => left.date.localeCompare(right.date)),
    });
  },

  async getShiftReports(ctx) {
    assertAdmin(ctx);

    const pagination = getPagination(ctx.query);
    const sort = parseSort(ctx.query.sort, ["startedAt", "endedAt", "status", "branch"], "startedAt:desc");
    const shifts = await strapi.entityService.findMany(DISPATCHER_SHIFT, {
      fields: ["id", "uuid", "branch", "startedAt", "endedAt", "status"],
      filters: buildShiftFilters(ctx.query),
      populate: {
        dispatcher: {
          fields: ["uuid", "name", "lastName", "email"],
        },
      },
      sort: [sort],
    });
    const rows = await Promise.all(shifts.map(formatShiftReport));

    return buildPaginatedResponse({
      rows,
      ...pagination,
      summary: buildShiftReportSummary(rows),
      chart: [],
    });
  },

  async downloadShiftReportPdf(ctx) {
    assertAdmin(ctx);

    const shift = await findShiftWithDispatcherByUuid(ctx.params.uuid);

    if (!shift) {
      throw new NotFoundError("Shift not found.", {
        key: "shift.notFound",
        path: "uuid",
      });
    }

    const loads = await getShiftLoads(shift.id);
    const pdfBuffer = await buildShiftReportPdf({
      dispatcher: shift.dispatcher || {},
      shift,
      loads,
    });
    const fileName = buildShiftReportFileName({
      dispatcher: shift.dispatcher || {},
      shift,
    });

    ctx.status = 200;
    ctx.set("Content-Type", "application/pdf");
    ctx.set("Content-Disposition", `attachment; filename="${fileName}"`);
    ctx.set("Content-Length", String(pdfBuffer.length));
    ctx.body = pdfBuffer;
  },
};
