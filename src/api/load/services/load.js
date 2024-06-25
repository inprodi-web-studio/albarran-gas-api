const { LOAD, USER, CUSTOMER_LEVEL } = require("../../../constants/models");
const { findOneByUuid } = require("../../../helpers");

const { createCoreService } = require("@strapi/strapi").factories;

module.exports = createCoreService(LOAD, ({ strapi }) => ({
    async assignDiscount(data) {
        const customer = await findOneByUuid( data.customer, USER );

        data.customer = customer.id;

        const totalLoads = await strapi.db.connection("loads")
            .join("loads_customer_links", "loads.id", "loads_customer_links.load_id")
            .where("loads_customer_links.user_id", customer.id)
            .sum("quantity as total")
            .first();

        const { discount } = await strapi.query(CUSTOMER_LEVEL).findOne({
            where : {
                min : {
                    $lt : totalLoads.total,
                },
                max : {
                    $gte : totalLoads.total,
                },
            },
        });

        data.discount = discount;
    },
}));
