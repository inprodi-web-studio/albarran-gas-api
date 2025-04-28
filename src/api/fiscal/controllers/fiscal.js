const { FISCAL } = require("../../../constants/models");
const { BadRequestError } = require("../../../helpers/errors");

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(FISCAL, ({strapi}) => ({
    async create(ctx) {
        const data = ctx.request.body;

        const { user } = ctx.state;

        const existing = await strapi.entityService.findMany(FISCAL, {
            filters: {
                rfc: data.rfc,
                user: user.id,
            },
            limit: 1,
        });

        if (existing && existing.length > 0) {
            throw new BadRequestError("Duplicated rfc", {
                key: "fiscal.duplicatedRfc",
                path: ctx.request.path,
            });
        }

        const fiscal = await strapi.entityService.create(FISCAL, { data });

        return fiscal;
    },
}));
