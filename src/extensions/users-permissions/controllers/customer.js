const { USER } = require("../../../constants/models");
const { findOneByUuid } = require("../../../helpers");
const { BadRequestError, NotFoundError } = require("../../../helpers/errors");
const { validateUpdateProfile } = require("../validation");

module.exports = (plugin) => {
    plugin.controllers.user["updateProfile_Customer"] = async ( ctx ) => {
        const data     = ctx.request.body;
        const customer = ctx.state.user;

        await validateUpdateProfile(data);

        const updatedCustomer = await strapi.entityService.update( USER, customer.id, {
            data,
        });

        return {
            uuid      : updatedCustomer.uuid,
            name      : updatedCustomer.name,
            lastName  : updatedCustomer.lastName,
            email     : updatedCustomer.email,
            phone     : updatedCustomer.phone,
            gender    : updatedCustomer.gender,
            birthdate : updatedCustomer.birthdate,
        };
    };

    plugin.controllers.user["findCustomer_Dispatcher"] = async ( ctx ) => {
        const { uuid } = ctx.params;

        const user = await findOneByUuid( uuid, USER, {
            fields : ["uuid", "name", "lastName", "email", "type"]
        });

        if ( user.type !== "customer" ) {
            throw new NotFoundError( "Customer not found", {
                key : "customer.notFound",
                path : ctx.request.url,
            });
        }

        return user;
    };
}