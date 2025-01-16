const {
    validateLogin,
    validateRegister,
    validateValidateCode,
    validateForgotPassword,
    validateResetPassword,
    validateSetBombs,
    validateDispatcherLogin,
} = require("../validation");

const {
    USER,
    BOMB,
} = require("../../../constants/models");

const {
    findOneByAny,
    generateToken,
    findOneByUuid,
    generateRandomCode,
} = require("../../../helpers");
const { BadRequestError, NotFoundError } = require("../../../helpers/errors");

module.exports = (plugin) => {
    plugin.controllers.auth["login_Customer"] = async (ctx) => {
        const data = ctx.request.body;

        await validateLogin(data);
        
        const {
            email,
            password,
        } = data;

        const customer = await findOneByAny(email, USER, "email");

        if ( customer.type !== "customer" ) {
            throw new NotFoundError( "Customer not found", {
                key : "auth.customerNotFound",
                path : ctx.request.path,
            });
        }

        await plugin.services.validateUserContext(password, customer);

        const TOKEN = generateToken({
            id : customer.id,
        });

        return {
            token     : TOKEN,
            uuid      : customer.uuid,
            name      : customer.name,
            lastName  : customer.lastName,
            email     : customer.email,
            phone     : customer.phone,
            gender    : customer.gender,
            birthdate : customer.birthdate,
        };
    };

    plugin.controllers.auth["register_Customer"] = async (ctx) => {
        const data = ctx.request.body;

        await validateRegister(data);

        const {
            email,
        } = data;

        await plugin.services.checkForDuplicates(email);

        const { id : CUSTOMER_ROLE } = await strapi.query("plugin::users-permissions.role").findOne({
            where : {
                name : "customer",
            },
        });

        const code = generateRandomCode(4);

        const newCustomer = await strapi.entityService.create( USER, {
            data : {
                ...data,
                username          : email,
                role              : CUSTOMER_ROLE,
                confirmed         : false,
                blocked           : false,
                provider          : "local",
                confirmationToken : code,
                type              : "customer",
            },
        });

        await plugin.services.sendCodeEmail(email, code, "register");

        return {
            uuid     : newCustomer.uuid,
            name     : newCustomer.name,
            lastName : newCustomer.lastName,
        };
    };

    plugin.controllers.auth["validateCode_Customer"] = async (ctx) => {
        const data = ctx.request.body;

        const { uuid } = ctx.params || {};

        await validateValidateCode( data );

        const { event } = data;

        const customer = await findOneByUuid( uuid, USER );

        if ( event === "register" && customer.confirmed ) {
            throw new BadRequestError("User already confirmed", {
                key : "auth.alreadyConfirmed",
                path : ctx.request.path,
            });
        }

        await plugin.services.validateCode( data, customer );

        await strapi.entityService.update( USER, customer.id, {
            data : {
                confirmationToken  : null,
                resetPasswordToken : null,
                ...( event === "register" && {
                    confirmed : true
                }),
            }
        });

        const TOKEN = generateToken({
            id : customer.id,
        });

        return {
            token     : TOKEN,
            uuid      : customer.uuid,
            name      : customer.name,
            lastName  : customer.lastName,
            email     : customer.email,
            phone     : customer.phone,
            gender    : customer.gender,
            birthdate : customer.birthdate,
        };
    };

    plugin.controllers.auth["forgotPassword_Customer"] = async (ctx) => {
        const data = ctx.request.body;

        await validateForgotPassword( data );

        const { email } = data;

        const customer = await findOneByAny( email, USER, "email" );

        if ( !customer.confirmed ) {
            throw new BadRequestError( "Customer has not confirmed his email address.", {
                key : "auth.notConfirmed",
                path : ctx.request.path,
            });
        }

        if ( customer.blocked ) {
            throw new BadRequestError( "Customer has been blocked.", {
                key : "auth.blocked",
                path : ctx.request.path,
            });
        }

        const code = generateRandomCode(4);

        await strapi.entityService.update( USER, customer.id, {
            data : {
                resetPasswordToken : code,
            },
        });

        await plugin.services.sendCodeEmail( email, code, "reset" );

        return {
            uuid : customer.uuid,
        };
    };

    plugin.controllers.auth["resetPassword_Customer"] = async (ctx) => {
        const data     = ctx.request.body;
        const customer = ctx.state.user;

        await validateResetPassword( data );

        const { password } = data;

        await strapi.entityService.update( USER, customer.id, {
            data : {
                password           : password,
                resetPasswordToken : null,
            },
        });

        return {
            message : "ok",
        };
    };

    plugin.controllers.auth["login_Dispatcher"] = async (ctx) => {
        const data = ctx.request.body;

        await validateDispatcherLogin(data);
        
        const {
            email,
            password,
            branch,
        } = data;

        const dispatcher = await findOneByAny(email, USER, "email");

        if ( dispatcher.type !== "dispatcher" ) {
            throw new NotFoundError( "Dispatcher not found", {
                key : "auth.dispatcherNotFound",
                path : ctx.request.path,
            });
        }

        await plugin.services.validateUserContext(password, dispatcher);

        const TOKEN = generateToken({
            id : dispatcher.id,
        });

        await strapi.entityService.update( USER, dispatcher.id, {
            data : {
                branch : branch,
            },
        });

        return {
            token     : TOKEN,
            uuid      : dispatcher.uuid,
            name      : dispatcher.name,
            lastName  : dispatcher.lastName,
            email     : dispatcher.email,
            branch    : branch,
        };
    };

    plugin.controllers.auth["setBombs_Dispatcher"] = async (ctx) => {
        const data = ctx.request.body;
        const dispatcher = ctx.state.user;
        const { branch } = dispatcher;
    
        await validateSetBombs(data);
    
        const { bombs } = data;
    
        const conflictSessions = [];

        for (let i = 0; i < bombs.length; i++) {
            const bomb = bombs[i];
    
            const conflictSession = await strapi.query(BOMB).findOne({
                where: {
                    bomb: bomb,
                    branch: branch
                },
            });
    
            if ( conflictSession ) {
                conflictSessions.push({
                    bomdId: bomb,
                    path: ctx.request.path
                });
            }
        }
    
        if ( conflictSessions.length > 0 ) {
            throw new BadRequestError("There are bombs that are already in use in the selection", {
                key: "auth.bombAlreadyInUse",
                conflicts: conflictSessions
            });
        }
    
        const createPromises = bombs.map(( bomb ) =>
            strapi.entityService.create( BOMB, {
                data: {
                    bomb       : bomb,
                    dispatcher : dispatcher.id,
                    branch     : branch,
                },
            })
        );
    
        await Promise.all( createPromises );

        return {
            status : "success",
            message : bombs.length + " bombs assigned",
        };
    };    
};