const { USER }             = require("../../../constants/models");
const verificationEmail    = require("../../../templates/verificationEmail");
const resetPasswordEmail   = require("../../../templates/resetPasswordEmail");
const { validatePassword } = require("../../../helpers");

const {
    ConflictError,
    BadRequestError,
} = require("../../../helpers/errors");

module.exports = (plugin) => {
    plugin.services.validateUserContext = async (password, user) => {
        const ctx = strapi.requestContext.get();

        await validatePassword( password, user.password );

        if ( !user.confirmed ) {
            throw new BadRequestError( "User has not confirmed their email address.", {
                key : "auth.notConfirmed",
                path : ctx.request.path,
            });
        }

        if ( user.blocked ) {
            throw new BadRequestError( "User is blocked.", {
                key : "auth.blocked",
                path : ctx.request.path,
            });
        }
    };

    plugin.services.checkForDuplicates = async (email) => {
        const ctx = strapi.requestContext.get();

        const conflictingUsers = await strapi.query(USER).count({
            where : {
                email,
            },
        });

        if ( conflictingUsers > 0 ) {
            throw new ConflictError( "Email already registered.", {
                key : "auth.duplicatedEmail",
                path : ctx.request.path,
            });
        }
    };

    plugin.services.sendCodeEmail = async (email, code, event) => {
        let emailConfig = event === "register" ? {
            subject : "Confirma tu Cuenta",
            text    : "",
            html    : verificationEmail,
        } : event === "reset" ? {
            subject : "Restablece tu Contraseña",
            text    : "",
            html    : resetPasswordEmail,
        } : null;

        await strapi.plugins["email"].services.email.sendTemplatedEmail(
            {
                to : email,
            },
            emailConfig,
            {
                code : code,
            },
        );
    };

    plugin.services.validateCode = async ({ event, code }, customer) => {
        const ctx = strapi.requestContext.get();

        const currentCode = event === "reset" ? customer.resetPasswordToken : customer.confirmationToken;

        if ( currentCode !== code ) {
            throw new BadRequestError("Wrong code", { key : "auth.wrongCode", path : ctx.request.url });
        }
    };
};