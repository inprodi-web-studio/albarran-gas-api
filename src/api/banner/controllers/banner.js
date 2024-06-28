const { BANNER } = require("../../../constants/models");
const { findMany } = require("../../../helpers");

const { createCoreController } = require("@strapi/strapi").factories;

const bannerFields = {
    fields : ["uuid"],
    populate : {
        image : {
            fields : ["url", "name"],
        }
    },
};

module.exports = createCoreController( BANNER, ({ strapi }) => ({
    async findMany_Customer(ctx) {
        const banners = findMany( BANNER, bannerFields );

        return banners;
    },
}));
