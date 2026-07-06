const { FISCAL } = require("../../../constants/models");
const { findMany } = require("../../../helpers");
const { BadRequestError, NotFoundError } = require("../../../helpers/errors");

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

    async update(ctx) {
        const { id } = ctx.params;
        const data = ctx.request.body;
        const { user } = ctx.state;

        const fiscal = await strapi.query(FISCAL).findOne({
            where: {
                uuid : id,
                user : user.id,
            },
        });

        if (!fiscal) {
            throw new NotFoundError("Fiscal not found.", {
                key: "fiscal.notFound",
                path: ctx.request.path,
            });
        }

        const existing = await strapi.entityService.findMany(FISCAL, {
            filters: {
                rfc: data.rfc,
                user: user.id,
                id: {
                    $ne: fiscal.id,
                },
            },
            limit: 1,
        });

        if (existing && existing.length > 0) {
            throw new BadRequestError("Duplicated rfc", {
                key: "fiscal.duplicatedRfc",
                path: ctx.request.path,
            });
        }

        const updatedFiscal = await strapi.entityService.update( FISCAL, fiscal.id, {
            data,
        });

        return updatedFiscal;
    },

    async delete(ctx) {
        const { id } = ctx.params;
        const { user } = ctx.state;

        const fiscal = await strapi.query(FISCAL).findOne({
            where: {
                uuid : id,
                user : user.id,
            },
        });

        if (!fiscal) {
            throw new NotFoundError("Fiscal not found.", {
                key: "fiscal.notFound",
                path: ctx.request.path,
            });
        }

        const deletedFiscal = await strapi.entityService.delete(FISCAL, fiscal.id);

        return deletedFiscal;
    }
}));
