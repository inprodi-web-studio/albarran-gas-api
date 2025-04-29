const dbConfig = require("../../config/customDatabase");
const knex = require("knex");

const dbDictionary = {
    bohemio : knex(dbConfig.bohemio),
    navarrol : knex(dbConfig.navarrol),
    lopez : knex(dbConfig.lopez),
    arenal : knex(dbConfig.arenal),
    alamo : knex(dbConfig.alamo),
};

module.exports = dbDictionary;