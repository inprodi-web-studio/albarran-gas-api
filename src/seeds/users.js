const {
    USER,
} = require("../constants/models");
const { faker } = require("@faker-js/faker");

const generateUsers = async (strapi) => {
    console.log("Generating users...");

    // -------------------------------------------- CUSTOMERS -------------------------------------------------

    const { id : CUSTOMER_ROLE } = await strapi.query("plugin::users-permissions.role").findOne({
       where : {
           name : "customer",
       },
    });

    const mainCustomer = await strapi.query( USER ).findOne({
        where : {
            email : "customer@inprodi.com.mx",
        },
    });

    if ( !mainCustomer?.id ) {
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
                type      : "customer",
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
                type      : "customer",
            },
        });
    });


    // -------------------------------------------- DISPATCHERS -------------------------------------------------


    const { id : DISPATCHER_ROLE } = await strapi.query("plugin::users-permissions.role").findOne({
        where : {
            name : "dispatcher",
        },
     });

    const mainDispatcher = await strapi.query( USER ).findOne({
        where : {
            email : "dispatcher@inprodi.com.mx",
        },
    });

    if ( !mainDispatcher?.id ) {
        await strapi.entityService.create( USER, {
            data : {
                username  : "dispatcher@inprodi.com.mx",
                email     : "dispatcher@inprodi.com.mx",
                name      : "Inprodi",
                lastName  : "Dispatcher",
                password  : "Asdf123456",
                type      : "dispatcher",
                confirmed : true,
                blocked   : false,
                role      : DISPATCHER_ROLE,
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
                name      : faker.person.firstName(),
                lastName  : faker.person.lastName(),
                type      : "dispatcher",
                confirmed : faker.helpers.arrayElement([true, false]),
                blocked   : faker.helpers.arrayElement([true, false]),
                role      : DISPATCHER_ROLE,
            },
        });
    });
};

module.exports = generateUsers;