const {
    USER,
} = require("../constants/models");
const { faker } = require("@faker-js/faker");

const generateUsers = async (strapi) => {
    console.log("Generating users...");

    const { id : CUSTOMER_ROLE } = await strapi.query("plugin::users-permissions.role").findOne({
       where : {
           name : "customer",
       },
    });

    const mainUser = await strapi.query( USER ).findOne({
        where : {
            email : "customer@inprodi.com.mx",
        },
    });

    if ( !mainUser?.id ) {
        await strapi.entityService.create( USER, {
            data : {
                username  : "customer@inprodi.com.mx",
                email     : "customer@inprodi.com.mx",
                password  : "Asdf123456",
                confirmed : true,
                blocked   : false,
                role      : CUSTOMER_ROLE,
                name      : "Inprodi",
                lastName  : "Customer",
                phone     : "3399999999",
                gender    : "male",
                birthdate : "2000-01-01",
            },
        });
    }

    Array.from({ length : 4 }).forEach( async () => {
        const email = faker.internet.email().toLowerCase();

        await strapi.entityService.create( USER, {
            data : {
                username  : email,
                email     : email,
                password  : "Asdf123456",
                confirmed : faker.helpers.arrayElement([true, false]),
                blocked   : faker.helpers.arrayElement([true, false]),
                role      : CUSTOMER_ROLE,
                name      : faker.person.firstName(),
                lastName  : faker.person.lastName(),
                phone     : faker.phone.number(),
                gender    : faker.helpers.arrayElement(["male", "female", "undefined"]),
                birthdate : "2000-01-01",
            },
        });
    });
};

module.exports = generateUsers;