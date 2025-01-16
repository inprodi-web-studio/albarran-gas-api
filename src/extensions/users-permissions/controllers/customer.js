const { USER, FISCAL } = require("../../../constants/models");
const { findOneByUuid, findMany } = require("../../../helpers");
const { NotFoundError, ConflictError } = require("../../../helpers/errors");
const { validateUpdateProfile, validateAddFiscal } = require("../validation");

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

    plugin.controllers.user["findFiscals_Customer"] = async ( ctx ) => {
        const customer = ctx.state.user;

        const fiscals = await findMany( FISCAL, {
            fields : ["uuid", "legalName", "rfc", "cp", "regime"],
        }, {
            user : customer.id,
        });

        return fiscals;
    };

    plugin.controllers.user["addFiscal_Customer"] = async ( ctx ) => {
        const data = ctx.request.body;
        const customer = ctx.state.user;

        await validateAddFiscal(data);

        const conflictingFiscal = await strapi.query(FISCAL).count({
            where : {
                user : customer.id,
                rfc      : data.rfc,
            },
        });

        if ( conflictingFiscal > 0 ) {
            throw new ConflictError( "Fiscal already registered.", {
                key : "fiscal.duplicatedFiscal",
                path : ctx.request.path,
            });
        }

        const newFiscal = await strapi.entityService.create( FISCAL, {
            data : {
                ...data,
                user : customer.id
            },
            fields : ["uuid", "legalName", "rfc", "cp", "regime"],
        });

        return newFiscal;
    };

    plugin.controllers.user["deleteFiscal_Customer"] = async ( ctx ) => {
        const { uuid } = ctx.params;

        const fiscal = await findOneByUuid( uuid, FISCAL, {
            fields : ["uuid", "legalName", "rfc", "cp", "regime"],
        });

        const deletedFiscal = await strapi.entityService.delete( FISCAL, fiscal.id );

        return deletedFiscal;
    };
}