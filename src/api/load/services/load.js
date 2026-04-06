const { LOAD, USER, CUSTOMER_LEVEL, FISCAL, VEHICLE, FLEET } = require("../../../constants/models");
const { findOneByUuid } = require("../../../helpers");
const { BadRequestError } = require("../../../helpers/errors");

const { createCoreService } = require("@strapi/strapi").factories;

const FIRST_LOAD_DISCOUNT = 1;

module.exports = createCoreService(LOAD, ({ strapi }) => ({
    async getStats( customerId ) {
        const totalLoads = await strapi.db.connection("loads")
            .join("loads_customer_links", "loads.id", "loads_customer_links.load_id")
            .where("loads_customer_links.user_id", customerId)
            .sum("quantity as total")
            .first();

        const loads = await strapi.db.connection("loads")
            .join("loads_customer_links", "loads.id", "loads_customer_links.load_id")
            .where("loads_customer_links.user_id", customerId)
            .select("discount", "quantity");

        const totalDiscount = loads.reduce((total, item) => {
            return total + (item.discount * item.quantity);
        }, 0);

        let level;

        if ( totalLoads?.total ) {
            level = await strapi.query(CUSTOMER_LEVEL).findOne({
                where : {
                    min : {
                        $lt : totalLoads?.total,
                    },
                    max : {
                        $gte : totalLoads?.total,
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
            total : parseFloat( totalLoads?.total?.toFixed(2) ) || 0,
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

        data.customer = customerUuid;

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
            return;
        }

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

    },

    async assignDiscount(data) {
        const customer = await findOneByUuid( data.customer, USER );

        data.customer = customer.id;

        const totalLoads = await strapi.db.connection("loads")
            .join("loads_customer_links", "loads.id", "loads_customer_links.load_id")
            .where("loads_customer_links.user_id", customer.id)
            .sum("quantity as total")
            .first();

        if ( !totalLoads?.total ) {
            data.discount = FIRST_LOAD_DISCOUNT;
        } else {
            const { discount } = await strapi.query(CUSTOMER_LEVEL).findOne({
                where : {
                    min : {
                        $lt : totalLoads?.total,
                    },
                    max : {
                        $gte : totalLoads?.total,
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
