const { LOAD, USER, CUSTOMER_LEVEL, FISCAL, VEHICLE, FLEET } = require("../../../constants/models");
const { findOneByUuid } = require("../../../helpers");
const { BadRequestError } = require("../../../helpers/errors");

const { createCoreService } = require("@strapi/strapi").factories;

const FIRST_LOAD_DISCOUNT = 1;

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

    async assignDiscount(data) {
        const customer = await findOneByUuid( data.customer, USER );

        data.customer = customer.id;

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

        if ( totalPersonalLiters <= 0 ) {
            data.discount = FIRST_LOAD_DISCOUNT;
        } else {
            const { discount } = await strapi.query(CUSTOMER_LEVEL).findOne({
                where : {
                    min : {
                        $lt : totalPersonalLiters,
                    },
                    max : {
                        $gte : totalPersonalLiters,
                    },
                },
            });
    
            data.discount = discount;
        }
    },

    async parseFleet(data) {
        const requestedFleet = typeof data.fleet === "string" ? data.fleet.trim() : "";

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
                    fields : ["id"],
                },
            },
        });

        if (!fleet) {
            throw new BadRequestError("Fleet not found for customer.", {
                key : "load.fleetNotFound",
            });
        }

        const isCustomerInFleet = Array.isArray(fleet.users) && fleet.users.some((user) => user.id === data.customer);

        if (!isCustomerInFleet) {
            throw new BadRequestError("Customer is not part of this fleet.", {
                key : "load.fleetNotAllowed",
            });
        }

        data.fleet = fleet.id;
    },
}));
