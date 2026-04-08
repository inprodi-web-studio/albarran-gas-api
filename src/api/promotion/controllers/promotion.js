"use strict";

/**
 * promotion controller
 */

const { PROMOTION } = require("../../../constants/models");
const { findMany } = require("../../../helpers");
const { createCoreController } = require("@strapi/strapi").factories;
const { validateResolvePromotion } = require("../validation");

const DEFAULT_TIMEZONE = "America/Mexico_City";

const promotionFields = {
    fields : [
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
    ],
    populate : {
        conditions : {
            fields : ["type", "weekday", "specificDate", "minLiters", "maxLiters", "notes"],
        },
        rewards : {
            fields : ["type", "value", "maxValue", "notes"],
        },
    },
};

const parseTimezone = (timezone) => {
    if ( typeof timezone !== "string" || !timezone.trim() ) {
        return DEFAULT_TIMEZONE;
    }

    try {
        Intl.DateTimeFormat("en-US", { timeZone : timezone }).format(new Date());
        return timezone;
    } catch (error) {
        return DEFAULT_TIMEZONE;
    }
};

const getCurrentDateInTimezone = (timezone) => {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone : timezone,
        year : "numeric",
        month : "2-digit",
        day : "2-digit",
    }).format(new Date());
};

module.exports = createCoreController(PROMOTION, ({ strapi }) => ({
    async find(ctx) {
        const timezone = parseTimezone(ctx.query?.timezone);
        const today = getCurrentDateInTimezone(timezone);

        const promotions = await findMany(PROMOTION, promotionFields, {
            isActive : true,
            startsAt : {
                $lte : today,
            },
            $or : [
                {
                    endsAt : {
                        $null : true,
                    },
                },
                {
                    endsAt : {
                        $gte : today,
                    },
                },
            ],
        });

        return promotions;
    },

    async resolveForDispatcher(ctx) {
        const data = ctx.request.body || {};

        await validateResolvePromotion(data);

        const promotion = await strapi.service(PROMOTION).resolveForDispatcher(data);

        return promotion;
    },
}));
