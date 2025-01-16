const dbConfig = require("../../../../config/customDatabase");
const knex = require("knex");

const dbDictionary = {
    bohemio : knex(dbConfig.bohemio),
};

const branchDictionary = {
    bohemio : {
        address : "Calzada Independencia Nte. 2236, Colonia Monumental, 44320 Guadalajara, Jal.",
        phone : "3336097490",
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