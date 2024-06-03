const {
    ROLE,
    USER,
} = require("../constants/models");
const generateRoles = require("./roles");
const generateUsers = require("./users");

const generateSeeds = async (strapi) => {
    console.log("Seed data has started...");

    console.log("Deleting old data...");

    const contentTypes = [
        USER,
        ROLE,
    ];

    for (const contentType of contentTypes) {
        console.log(`Deleting ${contentType}...`);

        const mainUser = contentType === USER 
          ? await strapi.query(USER).findOne({ where: { email: "customer@inprodi.com.mx" } })
          : null;
    
          await strapi.query(contentType).deleteMany({
            where: {
                id: {
                    $not: mainUser?.id || null
                },
            },
        });
    }

    console.log("Old data has been deleted!");

    console.log("Generating new data...");
    await generateRoles(strapi);
    await generateUsers(strapi);
}

module.exports = generateSeeds;