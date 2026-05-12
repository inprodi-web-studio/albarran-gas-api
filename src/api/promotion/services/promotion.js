"use strict";

/**
 * promotion service
 */

const { createCoreService } = require("@strapi/strapi").factories;
const { PROMOTION, USER, FISCAL, VEHICLE, FLEET } = require("../../../constants/models");
const { BadRequestError, NotFoundError } = require("../../../helpers/errors");

const DEFAULT_TIMEZONE = "America/Mexico_City";
const VALID_WEEKDAYS = new Set([
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
]);

const sanitizeQrSegment = (value) => {
    if ( typeof value !== "string" ) {
        return null;
    }

    const sanitized = value.trim();

    if (!sanitized || sanitized.toLowerCase() === "none") {
        return null;
    }

    return sanitized;
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

const getDateContextInTimezone = (timezone) => {
    const date = new Intl.DateTimeFormat("en-CA", {
        timeZone : timezone,
        year : "numeric",
        month : "2-digit",
        day : "2-digit",
    }).format(new Date());

    const weekday = new Intl.DateTimeFormat("en-US", {
        timeZone : timezone,
        weekday : "long",
    }).format(new Date()).toLowerCase();

    const dateParts = date.split("-").map((item) => Number(item));

    return {
        date,
        weekday,
        month : dateParts[1],
        day : dateParts[2],
    };
};

const parseDateOnly = (value) => {
    if ( typeof value !== "string" ) {
        return null;
    }

    const trimmed = value.trim();

    if (!trimmed) {
        return null;
    }

    const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);

    if (match?.[1]) {
        return match[1];
    }

    return null;
};

const parseBirthMonthDay = (birthdate) => {
    const parsedDate = parseDateOnly(birthdate);

    if (!parsedDate) {
        return null;
    }

    const [, month, day] = parsedDate.split("-").map((item) => Number(item));

    if (!month || !day) {
        return null;
    }

    return {
        month,
        day,
    };
};

const toNumber = (value) => {
    if ( typeof value === "string" ) {
        const trimmed = value.trim();

        if (!trimmed) {
            return null;
        }

        const normalized = trimmed.replace(",", ".");
        const parsedString = Number(normalized);

        if (Number.isFinite(parsedString)) {
            return parsedString;
        }
    }

    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
        return null;
    }

    return parsed;
};

const parseScanContext = (payload = {}) => {
    const rawCustomer = typeof payload.customer === "string" ? payload.customer.trim() : "";

    if (!rawCustomer) {
        throw new BadRequestError("Customer QR value is required.", {
            key : "promotion.customerRequired",
        });
    }

    const split = rawCustomer.split("|");
    const customerUuid = sanitizeQrSegment(split[0]);

    if (!customerUuid) {
        throw new BadRequestError("Customer QR value is invalid.", {
            key : "promotion.customerInvalid",
        });
    }

    const fiscalRfc = sanitizeQrSegment(split[1]);

    const requestedVehicle = sanitizeQrSegment(payload.vehicle);
    const vehicleFromQr = sanitizeQrSegment(split[2]);
    const vehicleUuid = requestedVehicle || vehicleFromQr || null;

    const requestedFleet = sanitizeQrSegment(payload.fleet);
    const fleetFromQr = sanitizeQrSegment(split[3]);
    const fleetUuid = requestedFleet || fleetFromQr || null;

    const quantity = payload.quantity === null || payload.quantity === undefined
        ? null
        : toNumber(payload.quantity);

    if ( payload.quantity !== null && payload.quantity !== undefined && quantity === null ) {
        throw new BadRequestError("Quantity must be a valid number.", {
            key : "promotion.quantityInvalid",
        });
    }

    return {
        customerUuid,
        fiscalRfc,
        vehicleUuid,
        fleetUuid,
        quantity,
    };
};

const isDateInPromotionWindow = (promotionDate, startsAt, endsAt) => {
    if (!startsAt || promotionDate < startsAt) {
        return false;
    }

    if (!endsAt) {
        return true;
    }

    return promotionDate <= endsAt;
};

const conditionMatches = (condition = {}, context) => {
    const type = condition?.type;
    const { dateContext, customerBirthdate, quantity } = context;

    switch (type) {
        case "weekday": {
            const weekday = typeof condition.weekday === "string" ? condition.weekday.toLowerCase() : "";

            if (!VALID_WEEKDAYS.has(weekday)) {
                return false;
            }

            return weekday === dateContext.weekday;
        }

        case "birthday": {
            if (!customerBirthdate) {
                return false;
            }

            return customerBirthdate.month === dateContext.month && customerBirthdate.day === dateContext.day;
        }

        case "specific_date": {
            const specificDate = parseDateOnly(condition.specificDate);

            if (!specificDate) {
                return false;
            }

            return specificDate === dateContext.date;
        }

        case "liters_range": {
            if (quantity === null || quantity === undefined) {
                return false;
            }

            const minLiters = condition.minLiters === null || condition.minLiters === undefined
                ? null
                : toNumber(condition.minLiters);
            const maxLiters = condition.maxLiters === null || condition.maxLiters === undefined
                ? null
                : toNumber(condition.maxLiters);

            if ( minLiters !== null && quantity < minLiters ) {
                return false;
            }

            if ( maxLiters !== null && quantity > maxLiters ) {
                return false;
            }

            return true;
        }

        default:
            return false;
    }
};

const evaluatePromotionDiscount = (promotion, quantity) => {
    const rewards = Array.isArray(promotion?.rewards) ? promotion.rewards : [];

    let discountPerLiter = 0;
    let fixedDiscount = 0;
    let litersMultiplier = 1;
    let estimatedDiscount = 0;

    for ( const reward of rewards ) {
        const value = toNumber(reward?.value) ?? 0;
        const maxValue = toNumber(reward?.maxValue);

        switch (reward?.type) {
            case "discount_per_liter": {
                discountPerLiter += value;

                if ( quantity === null || quantity === undefined ) {
                    estimatedDiscount += value;
                } else {
                    let discountValue = value * quantity;

                    if ( maxValue !== null && maxValue !== undefined && maxValue > 0 ) {
                        discountValue = Math.min(discountValue, maxValue);
                    }

                    estimatedDiscount += discountValue;
                }

                break;
            }

            case "fixed_discount": {
                fixedDiscount += value;

                let discountValue = value;

                if ( maxValue !== null && maxValue !== undefined && maxValue > 0 ) {
                    discountValue = Math.min(discountValue, maxValue);
                }

                estimatedDiscount += discountValue;

                break;
            }

            case "liters_multiplier": {
                const multiplier = value > 0 ? value : 1;
                litersMultiplier = Math.max(litersMultiplier, multiplier);
                break;
            }

            default:
                break;
        }
    }

    const parsedQuantity = toNumber(quantity);
    const effectiveDiscountPerLiter = parsedQuantity > 0
        ? estimatedDiscount / parsedQuantity
        : discountPerLiter;

    return {
        estimatedDiscount : Number(estimatedDiscount.toFixed(4)),
        discountPerLiter : Number(discountPerLiter.toFixed(4)),
        fixedDiscount : Number(fixedDiscount.toFixed(4)),
        litersMultiplier : Number(litersMultiplier.toFixed(4)),
        effectiveDiscountPerLiter : Number(effectiveDiscountPerLiter.toFixed(6)),
    };
};

const compareCandidates = (left, right) => {
    const estimatedDiscountDiff = right.rewardSummary.estimatedDiscount - left.rewardSummary.estimatedDiscount;

    if (estimatedDiscountDiff !== 0) {
        return estimatedDiscountDiff;
    }

    const discountPerLiterDiff = right.rewardSummary.discountPerLiter - left.rewardSummary.discountPerLiter;

    if (discountPerLiterDiff !== 0) {
        return discountPerLiterDiff;
    }

    const leftPriority = Number.isFinite(Number(left.promotion?.priority))
        ? Number(left.promotion.priority)
        : Number.MAX_SAFE_INTEGER;
    const rightPriority = Number.isFinite(Number(right.promotion?.priority))
        ? Number(right.promotion.priority)
        : Number.MAX_SAFE_INTEGER;

    if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
    }

    const leftCreatedAt = left.promotion?.createdAt ? new Date(left.promotion.createdAt).getTime() : 0;
    const rightCreatedAt = right.promotion?.createdAt ? new Date(right.promotion.createdAt).getTime() : 0;

    return rightCreatedAt - leftCreatedAt;
};

module.exports = createCoreService(PROMOTION, ({ strapi }) => ({
    async resolveForDispatcher(payload = {}) {
        const scanContext = parseScanContext(payload);

        const customer = await strapi.query(USER).findOne({
            where : {
                uuid : scanContext.customerUuid,
            },
            select : ["id", "uuid", "birthdate", "name", "lastName"],
        });

        if (!customer) {
            throw new NotFoundError("Customer not found.", {
                key : "promotion.customerNotFound",
            });
        }

        if (scanContext.fiscalRfc) {
            const fiscal = await strapi.query(FISCAL).findOne({
                where : {
                    rfc : scanContext.fiscalRfc,
                    user : {
                        id : customer.id,
                    },
                },
                select : ["id"],
            });

            if (!fiscal) {
                throw new BadRequestError("Fiscal not found for customer.", {
                    key : "promotion.fiscalNotFound",
                });
            }
        }

        if (scanContext.vehicleUuid) {
            const vehicle = await strapi.query(VEHICLE).findOne({
                where : {
                    uuid : scanContext.vehicleUuid,
                    user : {
                        id : customer.id,
                    },
                },
                select : ["id"],
            });

            if (!vehicle) {
                throw new BadRequestError("Vehicle not found for customer.", {
                    key : "promotion.vehicleNotFound",
                });
            }
        }

        if (scanContext.fleetUuid) {
            const fleet = await strapi.query(FLEET).findOne({
                where : {
                    uuid : scanContext.fleetUuid,
                },
                populate : {
                    users : {
                        fields : ["id"],
                    },
                },
                select : ["id", "uuid"],
            });

            if (!fleet) {
                throw new BadRequestError("Fleet not found for customer.", {
                    key : "promotion.fleetNotFound",
                });
            }

            const isCustomerInFleet = Array.isArray(fleet.users) && fleet.users.some((user) => user.id === customer.id);

            if (!isCustomerInFleet) {
                throw new BadRequestError("Customer is not part of this fleet.", {
                    key : "promotion.fleetNotAllowed",
                });
            }
        }

        const promotions = await strapi.entityService.findMany(PROMOTION, {
            fields : [
                "id",
                "uuid",
                "title",
                "description",
                "startsAt",
                "endsAt",
                "timezone",
                "priority",
                "stackable",
                "createdAt",
            ],
            populate : {
                conditions : {
                    fields : ["type", "weekday", "specificDate", "minLiters", "maxLiters", "notes"],
                },
                rewards : {
                    fields : ["type", "value", "maxValue", "notes"],
                },
            },
            filters : {
                isActive : true,
            },
            sort : ["priority:asc", "createdAt:desc"],
        });

        const customerBirthdate = parseBirthMonthDay(customer.birthdate);

        const candidates = [];

        for ( const promotion of promotions ) {
            const timezone = parseTimezone(promotion.timezone);
            const dateContext = getDateContextInTimezone(timezone);

            if (!isDateInPromotionWindow(dateContext.date, promotion.startsAt, promotion.endsAt)) {
                continue;
            }

            const conditions = Array.isArray(promotion.conditions) ? promotion.conditions : [];

            const allConditionsMatched = conditions.length > 0 && conditions.every((condition) => conditionMatches(condition, {
                dateContext,
                customerBirthdate,
                quantity : scanContext.quantity,
            }));

            if (!allConditionsMatched) {
                continue;
            }

            const rewardSummary = evaluatePromotionDiscount(promotion, scanContext.quantity);

            if (rewardSummary.estimatedDiscount <= 0 && rewardSummary.discountPerLiter <= 0 && rewardSummary.fixedDiscount <= 0) {
                continue;
            }

            candidates.push({
                promotion,
                rewardSummary,
                timezone,
            });
        }

        if (candidates.length === 0) {
            return {
                applies : false,
                promotion : null,
                evaluatedAt : new Date().toISOString(),
                quantity : scanContext.quantity,
            };
        }

        const bestCandidate = [...candidates].sort(compareCandidates)[0];

        return {
            applies : true,
            evaluatedAt : new Date().toISOString(),
            quantity : scanContext.quantity,
            promotion : {
                uuid : bestCandidate.promotion.uuid,
                title : bestCandidate.promotion.title,
                description : bestCandidate.promotion.description,
                startsAt : bestCandidate.promotion.startsAt,
                endsAt : bestCandidate.promotion.endsAt,
                priority : bestCandidate.promotion.priority,
                stackable : bestCandidate.promotion.stackable,
                timezone : bestCandidate.timezone,
                conditions : bestCandidate.promotion.conditions,
                rewards : bestCandidate.promotion.rewards,
                rewardSummary : bestCandidate.rewardSummary,
            },
        };
    },
}));
