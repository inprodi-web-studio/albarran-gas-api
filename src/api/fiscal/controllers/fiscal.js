const { FISCAL } = require('../../../constants/models');

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController(FISCAL, ({strapi}) => ({
    async create(ctx) {
        const data = ctx.request.body;

        const fiscal = await strapi.entityService.create( FISCAL, { data });

        return fiscal;
    },
}));
