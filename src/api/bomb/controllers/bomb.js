const { BOMB } = require("../../../constants/models");

const { createCoreController } = require("@strapi/strapi").factories;

const dbConfig = require("../../../../config/customDatabase");
const knex = require("knex");

const dbDictionary = {
    bohemio : knex(dbConfig.bohemio),
};

module.exports = createCoreController( BOMB, ({ strapi }) => ({
    async find(ctx) {
        const { user } = ctx.state;
        const { branch } = user;

        const connect = dbDictionary[branch];

        try {
            const bombs = await connect("Bombas")
                .select(
                    "nroman as bomb"
                )
                .orderBy("nro");

            const currentBombs = await strapi.query(BOMB).findMany();

            let availableBombs = [];

            for ( const bomb of bombs ) {
                const conflictBomb = currentBombs.filter( ( item ) => item.dispensary === bomb.dispensary && item.bomb === bomb.bomb && item.branch === branch );

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
