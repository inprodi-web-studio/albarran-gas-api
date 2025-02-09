"use strict";

const { LOAD } = require("../../../constants/models");

const dbConfig = require("../../../../config/customDatabase");
const { validateAssignLoad } = require("../validation");
const { findMany } = require("../../../helpers");
const knex = require("knex")(dbConfig.bohemio);

const { createCoreController } = require("@strapi/strapi").factories;

const loadFields = {
    fields : ["uuid", "product", "price", "quantity", "total", "discount", "date"],
    populate : {
        customer : {
            fields : ["uuid", "name", "lastName"],
        },
    },
};

module.exports = createCoreController( LOAD, ({ strapi }) => ({
    async getLoads_Customer(ctx) {
        const { id } = ctx.state.user;

        const loads = await findMany( LOAD, loadFields, {
            customer : id,
        });

        const stats = await strapi.service( LOAD ).getStats( id );

        loads.stats = stats;

        return loads;
    },

    async getLoads(ctx) {
        const { bombId } = ctx.params;
        const { last }   = ctx.query;
        
        try {
            if ( last ) {
                const lastLoad = await knex("Despachos")
                    .select(
                        "can",
                        "pre",
                        "codprd",
                        "mto",
                        knex.raw("DATEADD(day, fchtrn - 2, '1900-01-01') AS converted_date"),
                        knex.raw("RIGHT('0' + CAST(hratrn / 100 AS VARCHAR(2)), 2) + ':' + RIGHT('0' + CAST(hratrn % 100 AS VARCHAR(2)), 2) AS converted_time"),
                        knex.raw("CAST(DATEADD(day, fchtrn - 2, '1900-01-01') AS DATETIME) + CAST(RIGHT('0' + CAST(hratrn / 100 AS VARCHAR(2)), 2) + ':' + RIGHT('0' + CAST(hratrn % 100 AS VARCHAR(2)), 2) AS DATETIME) AS datetime_combined"),
                        "lognew"
                    )
                    .where("nrobom", bombId)
                    .orderBy("lognew", "desc")
                    .first();

                if ( lastLoad ) {
                    const conflictLoad = await strapi.query(LOAD).findOne({
                        where : {
                            quantity : lastLoad?.can,
                            price : lastLoad?.pre,
                            total : lastLoad?.mto,
                            date : lastLoad?.datetime_combined.toISOString(),
                        },
                    });

                    if ( conflictLoad ) {
                        return null;
                    }
                }

                return lastLoad;
            }

            const loads = await knex("Despachos")
                .select(
                    "can",
                    "pre",
                    "codprd",
                    "mto",
                    knex.raw("DATEADD(day, fchtrn - 2, '1900-01-01') AS converted_date"),
                    knex.raw("RIGHT('0' + CAST(hratrn / 100 AS VARCHAR(2)), 2) + ':' + RIGHT('0' + CAST(hratrn % 100 AS VARCHAR(2)), 2) AS converted_time"),
                    knex.raw("CAST(DATEADD(day, fchtrn - 2, '1900-01-01') AS DATETIME) + CAST(RIGHT('0' + CAST(hratrn / 100 AS VARCHAR(2)), 2) + ':' + RIGHT('0' + CAST(hratrn % 100 AS VARCHAR(2)), 2) AS DATETIME) AS datetime_combined"),
                    "lognew"
                )
                // TODO: Definir el número de bomba y posición en el despacho
                .where("nrobom", bombId)
                .orderBy("lognew", "desc")
                .limit(30);

            return loads;

        } catch (error) {
            ctx.throw(500, error);
        }
    },

    async assignLoad(ctx) {
        const data = ctx.request.body;

        await validateAssignLoad(data);

        await strapi.service(LOAD).assignDiscount(data);

        const newLoad = await strapi.entityService.create( LOAD, {
            data,
            ...loadFields,
        });

        return newLoad;
    },
}));
