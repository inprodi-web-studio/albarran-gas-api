const { FISCAL } = require("../../../constants/models");
const { findMany, findOneByUuid } = require("../../../helpers");
const { BadRequestError } = require("../../../helpers/errors");

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(FISCAL, ({ strapi }) => ({
    async find(ctx) {
        const user = ctx.state.user;

        const fiscals = await findMany( FISCAL, {
            fields: ["uuid", "rfc", "legalName", "cp", "regime"],
        }, {
            user: user.id,
        });

        return fiscals;
    },

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

        const fiscal = await strapi.entityService.create( FISCAL, {
            data : {
                ...data,
                user: user.id,
            },
        });

        return fiscal;
    },

    async delete(ctx) {
        const { id } = ctx.params;

        const fiscal = await strapi.query(FISCAL).findOne({
            where: {
                uuid : id,
            },
        });

        const deletedFiscal = await strapi.entityService.delete(FISCAL, fiscal.id);

        return deletedFiscal;
    }
}));
