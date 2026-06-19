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
    DISPATCHER_SHIFT,
} = require("../../../constants/models");

const {
    findOneByAny,
    generateToken,
    findOneByUuid,
    generateRandomCode,
} = require("../../../helpers");
const { BadRequestError, NotFoundError } = require("../../../helpers/errors");
const {
    buildShiftReportFileName,
    buildShiftReportPdf,
    getShiftLoads,
} = require("../../../helpers/shiftReport");

const closeActiveDispatcherShifts = async (dispatcherId, endedAt = new Date()) => {
    const activeShifts = await strapi.db.query(DISPATCHER_SHIFT).findMany({
        where : {
            dispatcher : dispatcherId,
            endedAt : null,
        },
        select : ["id"],
    });

    if (!activeShifts.length) {
        return;
    }

    await Promise.all(
        activeShifts.map((shift) =>
            strapi.entityService.update(DISPATCHER_SHIFT, shift.id, {
                data : {
                    endedAt,
                    status : "closed",
                },
            })
        )
    );
};

const startDispatcherShift = async ({ dispatcherId, branch, startedAt = new Date() }) => {
    await closeActiveDispatcherShifts(dispatcherId, startedAt);

    return strapi.entityService.create(DISPATCHER_SHIFT, {
        data : {
            dispatcher : dispatcherId,
            branch,
            startedAt,
            status : "active",
        },
    });
};

const getActiveShift = async (dispatcherId) =>
    strapi.db.query(DISPATCHER_SHIFT).findOne({
        where : {
            dispatcher : dispatcherId,
            endedAt : null,
        },
        orderBy : {
            startedAt : "desc",
        },
        select : ["id", "uuid", "branch", "startedAt", "endedAt", "status"],
    });

const closeDispatcherShiftById = async ({ shiftId, endedAt = new Date() }) =>
    strapi.entityService.update(DISPATCHER_SHIFT, shiftId, {
        data : {
            endedAt,
            status : "closed",
        },
        fields : ["id", "uuid", "branch", "startedAt", "endedAt", "status"],
    });

const clearDispatcherBombs = async (dispatcherId) => {
    const bombs = await strapi.query(BOMB).findMany({
        where : {
            dispatcher : dispatcherId,
        },
    });

    for (let i = 0; i < bombs.length; i++) {
        await strapi.entityService.delete(BOMB, bombs[i].id);
    }
};

const clearDispatcherBranch = async (dispatcherId) =>
    strapi.entityService.update(USER, dispatcherId, {
        data : {
            branch : null,
        },
    });

const performDispatcherLogout = async ({ dispatcher, endedAt = new Date() }) => {
    await clearDispatcherBombs(dispatcher.id);
    await clearDispatcherBranch(dispatcher.id);
    await closeActiveDispatcherShifts(dispatcher.id, endedAt);
};

module.exports = (plugin) => {
    plugin.controllers.auth["login_Customer"] = async (ctx) => {
        const data = ctx.request.body;

        await validateLogin(data);
        
        const {
            email,
            password,
        } = data;

        const customer = await findOneByAny(email, USER, "email", {
            populate : {
                loads : {
                    count : true,
                }
            }
        });

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

        const shift = await startDispatcherShift({
            dispatcherId : dispatcher.id,
            branch,
        });

        return {
            token     : TOKEN,
            uuid      : dispatcher.uuid,
            name      : dispatcher.name,
            lastName  : dispatcher.lastName,
            email     : dispatcher.email,
            branch    : branch,
            shift : {
                uuid : shift.uuid,
                startedAt : shift.startedAt,
            },
        };
    };

    plugin.controllers.auth["login_Admin"] = async (ctx) => {
        const data = ctx.request.body;

        await validateLogin(data);

        const {
            email,
            password,
        } = data;

        const admin = await findOneByAny(email, USER, "email");

        if (admin.type !== "admin") {
            throw new NotFoundError("Admin not found", {
                key : "auth.adminNotFound",
                path : ctx.request.path,
            });
        }

        await plugin.services.validateUserContext(password, admin);

        const TOKEN = generateToken({
            id : admin.id,
        });

        return {
            token    : TOKEN,
            uuid     : admin.uuid,
            name     : admin.name,
            lastName : admin.lastName,
            email    : admin.email,
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

    plugin.controllers.auth["logout_Dispatcher"] = async (ctx) => {
        const dispatcher = ctx.state.user;
        const endedAt = new Date();
        await performDispatcherLogout({ dispatcher, endedAt });

        return {
            message : "success",
            shiftEndedAt : endedAt.toISOString(),
        };
    };

    plugin.controllers.auth["logout_DispatcherWithReport"] = async (ctx) => {
        const dispatcher = ctx.state.user;
        const activeShift = await getActiveShift(dispatcher.id);

        if (!activeShift) {
            throw new BadRequestError("There is no active shift to close.", {
                key : "auth.shiftNotFound",
                path : ctx.request.path,
            });
        }

        const endedAt = new Date();
        const closedShift = await closeDispatcherShiftById({
            shiftId : activeShift.id,
            endedAt,
        });
        const loads = await getShiftLoads(activeShift.id);

        const pdfBuffer = await buildShiftReportPdf({
            dispatcher,
            shift : closedShift,
            loads,
        });

        await clearDispatcherBombs(dispatcher.id);
        await clearDispatcherBranch(dispatcher.id);

        const fileName = buildShiftReportFileName({
            dispatcher,
            shift : closedShift,
        });

        ctx.status = 200;
        ctx.set("Content-Type", "application/pdf");
        ctx.set("Content-Disposition", `attachment; filename="${fileName}"`);
        ctx.set("Content-Length", String(pdfBuffer.length));
        ctx.body = pdfBuffer;
    };
};
