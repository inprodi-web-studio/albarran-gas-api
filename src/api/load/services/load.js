const { LOAD, USER, CUSTOMER_LEVEL, FLEET_LEVEL, FISCAL, VEHICLE, FLEET, PROMOTION } = require("../../../constants/models");
const { findOneByUuid } = require("../../../helpers");
const { BadRequestError } = require("../../../helpers/errors");

const { createCoreService } = require("@strapi/strapi").factories;

const FIRST_LOAD_DISCOUNT = 1;

const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
        return fallback;
    }

    return parsed;
};

module.exports = createCoreService(LOAD, ({ strapi }) => ({
    async getStats( customerId ) {
        const personalLoads = await strapi.db.query(LOAD).findMany({
            where : {
                customer : customerId,
                fleet : null,
            },
            select : ["quantity", "discount"],
        });

        const totalPersonalLiters = personalLoads.reduce((total, item) => {
            return total + Number(item.quantity ?? 0);
        }, 0);

        const totalDiscount = personalLoads.reduce((total, item) => {
            return total + (Number(item.discount ?? 0) * Number(item.quantity ?? 0));
        }, 0);

        let level;

        if ( totalPersonalLiters > 0 ) {
            level = await strapi.query(CUSTOMER_LEVEL).findOne({
                where : {
                    min : {
                        $lt : totalPersonalLiters,
                    },
                    max : {
                        $gte : totalPersonalLiters,
                    },
                },
                select : ["uuid", "name", "discount", "min", "max"],
            });
        } else {
            level = await strapi.query( CUSTOMER_LEVEL ).findOne({
                where : {
                    min : 0,
                },
                select : ["uuid", "name", "discount", "min", "max"],
            });
        }

        return {
            total : parseFloat( totalPersonalLiters.toFixed(2) ) || 0,
            discount : parseFloat( totalDiscount?.toFixed(2) ) || 0,
            level,
        };
    },

    async parseCustomer(data) {
        const split = data.customer.split("|");
        const customerUuid = split[0];
        const fiscalQrValue = split[1] || "none";
        const requestedVehicle = typeof data.vehicle === "string" ? data.vehicle.trim() : "";
        const vehicleQrValue = requestedVehicle.length > 0 ? requestedVehicle : (split[2] || "none");
        const requestedFleet = typeof data.fleet === "string" ? data.fleet.trim() : "";
        const fleetQrValue = split[3] || "none";
        const fleetValue = requestedFleet.length > 0 ? requestedFleet : fleetQrValue;

        data.customer = customerUuid;
        data.fleet = fleetValue === "none" ? null : fleetValue;

        if ( fiscalQrValue === "none" ) {
            data.fiscal = null;
        } else {
            const rfc = fiscalQrValue;

            const fiscal = await strapi.query(FISCAL).findOne({
                where : {
                    rfc,
                    user : {
                        uuid : customerUuid,
                    }
                },
            });

            if ( !fiscal ) {
                throw new BadRequestError("Fiscal not found for customer.", {
                    key : "load.fiscalNotFound",
                });
            }

            data.fiscal = fiscal.id;
        }

        if ( vehicleQrValue === "none" ) {
            data.vehicle = null;
        } else {
            const vehicle = await strapi.query(VEHICLE).findOne({
                where : {
                    uuid : vehicleQrValue,
                    user : {
                        uuid : customerUuid,
                    },
                },
            });

            if ( !vehicle ) {
                throw new BadRequestError("Vehicle not found for customer.", {
                    key : "load.vehicleNotFound",
                });
            }

            data.vehicle = vehicle.id;
        }

    },

    async assignDiscount(data, promotionContext = null) {
        const customer = await findOneByUuid( data.customer, USER );

        data.customer = customer.id;

        let baseDiscount = FIRST_LOAD_DISCOUNT;

        if (data.fleet) {
            const fleetLoads = await strapi.db.query(LOAD).findMany({
                where : {
                    fleet : data.fleet,
                },
                select : ["quantity"],
            });

            const totalFleetLiters = fleetLoads.reduce((total, item) => {
                return total + Number(item.quantity ?? 0);
            }, 0);

            let fleetLevel;

            if (totalFleetLiters > 0) {
                fleetLevel = await strapi.query(FLEET_LEVEL).findOne({
                    where : {
                        min : {
                            $lt : totalFleetLiters,
                        },
                        max : {
                            $gte : totalFleetLiters,
                        },
                    },
                });
            } else {
                fleetLevel = await strapi.query(FLEET_LEVEL).findOne({
                    where : {
                        min : 0,
                    },
                });
            }

            baseDiscount = toNumber(fleetLevel?.discount, FIRST_LOAD_DISCOUNT);
        } else {
            const personalLoads = await strapi.db.query(LOAD).findMany({
                where : {
                    customer : customer.id,
                    fleet : null,
                },
                select : ["quantity"],
            });

            const totalPersonalLiters = personalLoads.reduce((total, item) => {
                return total + Number(item.quantity ?? 0);
            }, 0);

            if ( totalPersonalLiters > 0 ) {
                const level = await strapi.query(CUSTOMER_LEVEL).findOne({
                    where : {
                        min : {
                            $lt : totalPersonalLiters,
                        },
                        max : {
                            $gte : totalPersonalLiters,
                        },
                    },
                });

                baseDiscount = toNumber(level?.discount, FIRST_LOAD_DISCOUNT);
            }
        }

        if ( promotionContext?.customer ) {
            const promotionResolution = await strapi.service(PROMOTION).resolveForDispatcher({
                customer : promotionContext.customer,
                vehicle : promotionContext.vehicle ?? null,
                fleet : promotionContext.fleet ?? null,
                quantity : data.quantity,
            });

            if (promotionResolution?.applies) {
                const rewardSummary = promotionResolution.promotion?.rewardSummary || {};
                const promotionDiscountPerLiter = toNumber(
                    rewardSummary.effectiveDiscountPerLiter,
                    toNumber(rewardSummary.discountPerLiter, 0)
                );

                data.discount = promotionDiscountPerLiter;
                return;
            }
        }

        data.discount = baseDiscount;
    },

    async parseFleet(data) {
        const requestedFleet = typeof data.fleet === "string" ? data.fleet.trim() : "";
        const requestedCustomer = typeof data.customer === "string" ? data.customer.trim() : data.customer;

        if (!requestedFleet) {
            data.fleet = null;
            return;
        }

        const fleet = await strapi.query(FLEET).findOne({
            where : {
                uuid : requestedFleet,
            },
            populate : {
                users : {
                    fields : ["id", "uuid"],
                },
            },
        });

        if (!fleet) {
            throw new BadRequestError("Fleet not found for customer.", {
                key : "load.fleetNotFound",
            });
        }

        const normalizedCustomerId = Number(requestedCustomer);
        const hasNumericCustomerId = Number.isFinite(normalizedCustomerId);
        const isCustomerInFleet = Array.isArray(fleet.users) && fleet.users.some((user) => {
            const userUuid = typeof user.uuid === "string" ? user.uuid.trim() : "";
            const userId = Number(user.id);

            if (requestedCustomer && userUuid === requestedCustomer) {
                return true;
            }

            if (hasNumericCustomerId && Number.isFinite(userId) && userId === normalizedCustomerId) {
                return true;
            }

            return false;
        });

        if (!isCustomerInFleet) {
            throw new BadRequestError("Customer is not part of this fleet.", {
                key : "load.fleetNotAllowed",
            });
        }

        data.fleet = fleet.id;
    },
}));
