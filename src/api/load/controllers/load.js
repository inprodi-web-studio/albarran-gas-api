"use strict";

const { LOAD } = require("../../../constants/models");

const dbConfig = require("../../../../config/customDatabase");
const knex = require("knex")(dbConfig);

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController( LOAD, ({ strapi }) => ({
    async getLoads(ctx) {
        const { bombId } = ctx.params;
        const { last }   = ctx.query;
        
        try {
            if ( last ) {
                const lastLoad = await knex("Despachos")
                .select(
                    "can",
                    "pre",
                    "mto",
                    knex.raw("DATEADD(day, fchtrn - 2, '1900-01-01') AS converted_date"),
                    knex.raw("RIGHT('0' + CAST(hratrn / 100 AS VARCHAR), 2) + ':' + RIGHT('0' + CAST(hratrn % 100 AS VARCHAR), 2) AS converted_time"),
                    knex.raw("CAST(DATEADD(day, fchtrn - 2, '1900-01-01') AS DATETIME) + CAST(RIGHT('0' + CAST(hratrn / 100 AS VARCHAR), 2) + ':' + RIGHT('0' + CAST(hratrn % 100 AS VARCHAR), 2) AS DATETIME) AS datetime_combined"),
                    "lognew"
                )
                .where("nrobom", bombId)
                .orderBy("datetime_combined", "desc")
                .first();

                return lastLoad;
            }

            const loads = await knex("Despachos")
            .select(
                "can",
                "pre",
                "mto",
                knex.raw("DATEADD(day, fchtrn - 2, '1900-01-01') AS converted_date"),
                knex.raw("RIGHT('0' + CAST(hratrn / 100 AS VARCHAR), 2) + ':' + RIGHT('0' + CAST(hratrn % 100 AS VARCHAR), 2) AS converted_time"),
                knex.raw("CAST(DATEADD(day, fchtrn - 2, '1900-01-01') AS DATETIME) + CAST(RIGHT('0' + CAST(hratrn / 100 AS VARCHAR), 2) + ':' + RIGHT('0' + CAST(hratrn % 100 AS VARCHAR), 2) AS DATETIME) AS datetime_combined"),
                "lognew"
            )
            .where("nrobom", bombId)
            .orderBy("datetime_combined", "desc")
            .limit(30);

            return loads;

        } catch (error) {
            ctx.throw(500, error);
        }
    },
}));
