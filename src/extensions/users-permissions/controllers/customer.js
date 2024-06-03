const { USER } = require("../../../constants/models");
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
}