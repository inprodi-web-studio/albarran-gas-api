const generateSeeds = require("../../../seeds");

module.exports = {
    async generateSeeds(ctx) {
        await generateSeeds(strapi);

        return "SEEDS GENERATED SUCCESSFULLY!";
    },
};