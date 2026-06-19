"use strict";

const { PROMOTION } = require("../../../constants/models");
const { ForbiddenError, NotFoundError, UnprocessableContentError } = require("../../../helpers/errors");

const DEFAULT_LIMIT = 15;
const MAX_LIMIT = 100;
const DEFAULT_TIMEZONE = "America/Mexico_City";

const CONDITION_TYPES = new Set(["weekday", "birthday", "specific_date", "liters_range"]);
const REWARD_TYPES = new Set(["discount_per_liter", "liters_multiplier", "fixed_discount"]);
const WEEKDAYS = new Set(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]);

const promotionPopulate = {
  conditions: {
    fields: ["type", "weekday", "specificDate", "minLiters", "maxLiters", "notes"],
  },
  rewards: {
    fields: ["type", "value", "maxValue", "notes"],
  },
};

const promotionSelect = [
  "id",
  "uuid",
  "title",
  "description",
  "isActive",
  "startsAt",
  "endsAt",
  "timezone",
  "priority",
  "stackable",
  "createdAt",
  "updatedAt",
];

const firstValue = (value) => Array.isArray(value) ? value[0] : value;

const assertAdmin = (ctx) => {
  if (ctx.state.user?.type !== "admin") {
    throw new ForbiddenError("Only admins can access this resource.", {
      key: "auth.adminOnly",
      path: ctx.request.path,
    });
  }
};

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(String(value).replace(",", "."));

  return Number.isFinite(parsed) ? parsed : null;
};

const parseBoolean = (value, fallback) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return fallback;
};

const isDateOnly = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

const getToday = () => new Date().toISOString().slice(0, 10);

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
    offset: (page - 1) * limit,
  };
};

const parseSort = (value) => {
  const allowedFields = ["title", "startsAt", "endsAt", "priority", "updatedAt", "createdAt", "isActive"];
  const rawValue = String(firstValue(value) || "updatedAt:desc");
  const [rawField, rawDirection = "desc"] = rawValue.split(":");
  const field = allowedFields.includes(rawField) ? rawField : "updatedAt";
  const direction = rawDirection === "asc" ? "asc" : "desc";

  return {
    [field]: direction,
  };
};

const getStatus = (promotion) => {
  const today = getToday();

  if (!promotion.isActive) {
    return "inactive";
  }

  if (promotion.startsAt && promotion.startsAt > today) {
    return "scheduled";
  }

  if (promotion.endsAt && promotion.endsAt < today) {
    return "expired";
  }

  return "active";
};

const buildStatusFilter = (status) => {
  const today = getToday();

  switch (status) {
    case "active":
      return {
        isActive: true,
        startsAt: {
          $lte: today,
        },
        $or: [
          {
            endsAt: {
              $null: true,
            },
          },
          {
            endsAt: {
              $gte: today,
            },
          },
        ],
      };
    case "inactive":
      return {
        isActive: false,
      };
    case "scheduled":
      return {
        isActive: true,
        startsAt: {
          $gt: today,
        },
      };
    case "expired":
      return {
        isActive: true,
        endsAt: {
          $lt: today,
        },
      };
    default:
      return {};
  }
};

const buildFilters = (query = {}) => {
  const search = String(firstValue(query.search) || "").trim();
  const status = String(firstValue(query.status) || "");
  const from = String(firstValue(query.from) || "");
  const to = String(firstValue(query.to) || "");
  const filters = {
    ...buildStatusFilter(status),
  };

  if (search) {
    const searchFilter = {
      $or: [
        {
          title: {
            $containsi: search,
          },
        },
        {
          description: {
            $containsi: search,
          },
        },
      ],
    };

    if (filters.$or) {
      filters.$and = [
        {
          $or: filters.$or,
        },
        searchFilter,
      ];
      delete filters.$or;
    } else {
      filters.$or = searchFilter.$or;
    }
  }

  if (from || to) {
    filters.startsAt = {
      ...(typeof filters.startsAt === "object" && filters.startsAt ? filters.startsAt : {}),
      ...(isDateOnly(from) && { $gte: from }),
      ...(isDateOnly(to) && { $lte: to }),
    };
  }

  return filters;
};

const formatCondition = (condition = {}) => ({
  type: condition.type,
  weekday: condition.weekday || null,
  specificDate: condition.specificDate || null,
  minLiters: condition.minLiters === null || condition.minLiters === undefined ? null : Number(condition.minLiters),
  maxLiters: condition.maxLiters === null || condition.maxLiters === undefined ? null : Number(condition.maxLiters),
  notes: condition.notes || "",
});

const formatReward = (reward = {}) => ({
  type: reward.type,
  value: reward.value === null || reward.value === undefined ? null : Number(reward.value),
  maxValue: reward.maxValue === null || reward.maxValue === undefined ? null : Number(reward.maxValue),
  notes: reward.notes || "",
});

const formatPromotion = (promotion) => ({
  uuid: promotion.uuid,
  title: promotion.title,
  description: promotion.description || "",
  isActive: Boolean(promotion.isActive),
  startsAt: promotion.startsAt,
  endsAt: promotion.endsAt || null,
  timezone: promotion.timezone || DEFAULT_TIMEZONE,
  priority: Number(promotion.priority ?? 100),
  stackable: Boolean(promotion.stackable),
  conditions: Array.isArray(promotion.conditions) ? promotion.conditions.map(formatCondition) : [],
  rewards: Array.isArray(promotion.rewards) ? promotion.rewards.map(formatReward) : [],
  status: getStatus(promotion),
  createdAt: promotion.createdAt,
  updatedAt: promotion.updatedAt,
});

const validatePromotionPayload = (payload = {}, { partial = false } = {}) => {
  const errors = [];
  const data = {};

  if (!partial || payload.title !== undefined) {
    const title = typeof payload.title === "string" ? payload.title.trim() : "";

    if (!title) {
      errors.push("El título es requerido.");
    } else {
      data.title = title;
    }
  }

  if (!partial || payload.startsAt !== undefined) {
    if (!isDateOnly(payload.startsAt)) {
      errors.push("La fecha de inicio debe tener formato YYYY-MM-DD.");
    } else {
      data.startsAt = payload.startsAt;
    }
  }

  if (payload.endsAt !== undefined) {
    if (payload.endsAt === null || payload.endsAt === "") {
      data.endsAt = null;
    } else if (!isDateOnly(payload.endsAt)) {
      errors.push("La fecha de fin debe tener formato YYYY-MM-DD.");
    } else {
      data.endsAt = payload.endsAt;
    }
  }

  const startsAt = data.startsAt || payload.startsAt;
  const endsAt = data.endsAt === undefined ? payload.endsAt : data.endsAt;
  if (startsAt && endsAt && isDateOnly(startsAt) && isDateOnly(endsAt) && endsAt < startsAt) {
    errors.push("La fecha de fin no puede ser menor a la fecha de inicio.");
  }

  if (payload.description !== undefined) {
    data.description = typeof payload.description === "string" ? payload.description.trim() : "";
  } else if (!partial) {
    data.description = "";
  }

  if (payload.isActive !== undefined || !partial) {
    data.isActive = parseBoolean(payload.isActive, true);
  }

  if (payload.timezone !== undefined || !partial) {
    const timezone = typeof payload.timezone === "string" && payload.timezone.trim()
      ? payload.timezone.trim()
      : DEFAULT_TIMEZONE;

    try {
      Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
      data.timezone = timezone;
    } catch (error) {
      errors.push("La zona horaria no es válida.");
    }
  }

  if (payload.priority !== undefined || !partial) {
    const priority = toNumber(payload.priority ?? 100);

    if (priority === null) {
      errors.push("La prioridad debe ser un número.");
    } else {
      data.priority = Math.trunc(priority);
    }
  }

  if (payload.stackable !== undefined || !partial) {
    data.stackable = parseBoolean(payload.stackable, false);
  }

  if (!partial || payload.conditions !== undefined) {
    const conditions = Array.isArray(payload.conditions) ? payload.conditions : [];

    if (!conditions.length) {
      errors.push("Agrega al menos una condición.");
    }

    data.conditions = conditions.map((condition, index) => {
      const type = condition?.type;
      const item = {
        type,
        notes: typeof condition?.notes === "string" ? condition.notes.trim() : "",
      };

      if (!CONDITION_TYPES.has(type)) {
        errors.push(`La condición ${index + 1} tiene un tipo inválido.`);
        return item;
      }

      if (type === "weekday") {
        if (!WEEKDAYS.has(condition.weekday)) {
          errors.push(`La condición ${index + 1} requiere un día de la semana.`);
        }
        item.weekday = condition.weekday || null;
      }

      if (type === "specific_date") {
        if (!isDateOnly(condition.specificDate)) {
          errors.push(`La condición ${index + 1} requiere una fecha específica.`);
        }
        item.specificDate = condition.specificDate || null;
      }

      if (type === "liters_range") {
        const minLiters = toNumber(condition.minLiters);
        const maxLiters = toNumber(condition.maxLiters);

        if (minLiters === null && maxLiters === null) {
          errors.push(`La condición ${index + 1} requiere litros mínimos o máximos.`);
        }

        if (minLiters !== null && maxLiters !== null && minLiters > maxLiters) {
          errors.push(`La condición ${index + 1} tiene un rango de litros inválido.`);
        }

        item.minLiters = minLiters;
        item.maxLiters = maxLiters;
      }

      return item;
    });
  }

  if (!partial || payload.rewards !== undefined) {
    const rewards = Array.isArray(payload.rewards) ? payload.rewards : [];

    if (!rewards.length) {
      errors.push("Agrega al menos una recompensa.");
    }

    data.rewards = rewards.map((reward, index) => {
      const type = reward?.type;
      const value = toNumber(reward?.value);
      const maxValue = toNumber(reward?.maxValue);

      if (!REWARD_TYPES.has(type)) {
        errors.push(`La recompensa ${index + 1} tiene un tipo inválido.`);
      }

      if (value === null || value <= 0) {
        errors.push(`La recompensa ${index + 1} requiere un valor mayor a cero.`);
      }

      if (maxValue !== null && maxValue < 0) {
        errors.push(`La recompensa ${index + 1} tiene un tope inválido.`);
      }

      return {
        type,
        value,
        maxValue,
        notes: typeof reward?.notes === "string" ? reward.notes.trim() : "",
      };
    });
  }

  if (errors.length) {
    throw new UnprocessableContentError(errors);
  }

  return data;
};

const findPromotionByUuid = async (uuid) => {
  const promotion = await strapi.db.query(PROMOTION).findOne({
    where: {
      uuid,
    },
    select: promotionSelect,
    populate: promotionPopulate,
  });

  if (!promotion) {
    throw new NotFoundError("Promotion not found.", {
      key: "promotion.notFound",
      path: "uuid",
    });
  }

  return promotion;
};

module.exports = {
  async find(ctx) {
    assertAdmin(ctx);

    const filters = buildFilters(ctx.query || {});
    const pagination = getPagination(ctx.query || {});
    const [totalDocs, promotions] = await Promise.all([
      strapi.db.query(PROMOTION).count({
        where: filters,
      }),
      strapi.db.query(PROMOTION).findMany({
        where: filters,
        select: promotionSelect,
        populate: promotionPopulate,
        orderBy: parseSort(ctx.query?.sort),
        offset: pagination.offset,
        limit: pagination.limit,
      }),
    ]);

    return {
      data: promotions.map(formatPromotion),
      meta: {
        totalDocs,
        limit: pagination.limit,
        page: pagination.page,
        totalPages: Math.max(Math.ceil(totalDocs / pagination.limit), 1),
      },
    };
  },

  async findOne(ctx) {
    assertAdmin(ctx);

    const uuid = ctx.params.uuid;
    const promotion = await findPromotionByUuid(uuid);

    return formatPromotion(promotion);
  },

  async create(ctx) {
    assertAdmin(ctx);

    const data = validatePromotionPayload(ctx.request.body || {});
    const promotion = await strapi.entityService.create(PROMOTION, {
      data,
      fields: promotionSelect,
      populate: promotionPopulate,
    });

    return formatPromotion(promotion);
  },

  async update(ctx) {
    assertAdmin(ctx);

    const existingPromotion = await findPromotionByUuid(ctx.params.uuid);
    const data = validatePromotionPayload(ctx.request.body || {}, { partial: true });
    const promotion = await strapi.entityService.update(PROMOTION, existingPromotion.id, {
      data,
      fields: promotionSelect,
      populate: promotionPopulate,
    });

    return formatPromotion(promotion);
  },

  async delete(ctx) {
    assertAdmin(ctx);

    const existingPromotion = await findPromotionByUuid(ctx.params.uuid);
    const promotion = await strapi.entityService.update(PROMOTION, existingPromotion.id, {
      data: {
        isActive: false,
      },
      fields: promotionSelect,
      populate: promotionPopulate,
    });

    return formatPromotion(promotion);
  },
};
