const { LOAD, USER, CUSTOMER_LEVEL } = require("../../../constants/models");
const { findOneByUuid } = require("../../../helpers");

const { createCoreService } = require("@strapi/strapi").factories;

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

    async assignDiscount(data) {
        const customer = await findOneByUuid( data.customer, USER );

        data.customer = customer.id;

        const totalLoads = await strapi.db.connection("loads")
            .join("loads_customer_links", "loads.id", "loads_customer_links.load_id")
            .where("loads_customer_links.user_id", customer.id)
            .sum("quantity as total")
            .first();

        if ( !totalLoads?.total ) {
            data.discount = 0;
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
}));
