const { BOMB } = require("../../../constants/models");

const { createCoreController } = require("@strapi/strapi").factories;

const dbConfig = require("../../../../config/customDatabase");
const knex = require("knex")(dbConfig);

module.exports = createCoreController( BOMB, ({ strapi }) => ({
    async find(ctx) {
        try {
            const bombs = await knex("Bombas")
                .select(
                    "nroman as bomb"
                )
                .orderBy("nro");

            const currentBombs = await strapi.query(BOMB).findMany();

            let availableBombs = [];

            for ( const bomb of bombs ) {
                const conflictBomb = currentBombs.filter( ( item ) => item.dispensary === bomb.dispensary && item.bomb === bomb.bomb );

                availableBombs.push({
                    ...bomb,
                    available : conflictBomb.length === 0,
                });
            }

            return availableBombs;
        } catch (error) {
            ctx.throw(500, error);
        }
    },
}));
