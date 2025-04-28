const dbConfig = require("../../../../config/customDatabase");
const knex = require("knex");

const dbDictionary = {
    bohemio : knex(dbConfig.bohemio),
    navarrol : knex(dbConfig.navarrol),
    lopez : knex(dbConfig.lopez),
    arenal : knex(dbConfig.arenal),
    alamo : knex(dbConfig.alamo),
};

const branchDictionary = {
    bohemio : {
        address : "Calzada Independencia Nte. 2236, Colonia Monumental, 44320 Guadalajara, Jal.",
        phone : "3336097490",
    },
    navarrol : {
        address : "Calz. Independencia Norte 357, Col. El Retiro, 44280 Guadalajara, Jal.",
        phone : "3324642871",
    },
    lopez : {
        address : "Av. López Mateos 760, Ladrón de Guevara, 44650 Guadalajara, Jal.",
        phone : "3336158800",
    },
    arenal : {
        address : "Av. Lázaro Cárdenas 455, El Arenal, 45350 Guadalajara, Jal.",
        phone : "3747408375",
    },
    alamo : {
        address : "Av. R. Michel 3029, Colonia Álamo, 45590 Taquepaque, Jal.",
        phone : "3333433353",
    },
};

module.exports = {
    async findOne(ctx) {
        const { branch } = ctx.params;

        const connect = dbDictionary[branch];

        try {
            const premiumPrice = await connect("Precios")
                .select("pre")
                .where("codprd", 1)
                .orderBy("logfch", "desc")
                .first();

            const magnaPrice = await connect("Precios")
                .select("pre")
                .where("codprd", 2)
                .orderBy("logfch", "desc")
                .first();

                return {
                    premium : premiumPrice?.pre ?? 0,
                    magna   : magnaPrice?.pre ?? 0,
                    info    : branchDictionary[branch],
                };
        } catch (error) {
            ctx.throw(500, error);
        }

        return branch;
    },
};