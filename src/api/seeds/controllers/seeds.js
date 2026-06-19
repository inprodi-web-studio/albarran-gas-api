const generateSeeds = require("../../../seeds");
const generateAdminDemoSeeds = require("../../../seeds/adminDemo");

module.exports = {
    async generateSeeds(ctx) {
        await generateSeeds(strapi);

        return "SEEDS GENERATED SUCCESSFULLY!";
    },
    async generateAdminDemoSeeds(ctx) {
        return generateAdminDemoSeeds(strapi);
    },
};
