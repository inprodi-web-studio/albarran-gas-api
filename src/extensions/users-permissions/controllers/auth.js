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
    LOAD,
} = require("../../../constants/models");
const PDFDocument = require("pdfkit");

const {
    findOneByAny,
    generateToken,
    findOneByUuid,
    generateRandomCode,
} = require("../../../helpers");
const { BadRequestError, NotFoundError } = require("../../../helpers/errors");

const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
        return fallback;
    }

    return parsed;
};

const formatDateTime = (value) => {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return "-";
    }

    const pad = (number) => String(number).padStart(2, "0");

    return `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
};

const formatMoney = (value) => `$${toNumber(value).toFixed(2)}`;

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

const getShiftLoads = async (shiftId) => {
    const loads = await strapi.db.query(LOAD).findMany({
        where : {
            shift : shiftId,
        },
        select : ["date", "quantity", "price", "discount", "total"],
        orderBy : {
            date : "asc",
        },
    });

    return loads.map((item) => {
        const quantity = toNumber(item.quantity);
        const price = toNumber(item.price);
        const discount = toNumber(item.discount);
        const subtotal = quantity * price;
        const discountTotal = discount * quantity;
        const total = toNumber(item.total, subtotal - discountTotal);

        return {
            date : item.date,
            quantity,
            price,
            subtotal,
            discount,
            discountTotal,
            total,
        };
    });
};

const buildShiftReportPdf = async ({
    dispatcher,
    shift,
    loads,
}) => {
    const doc = new PDFDocument({
        size : "A4",
        margin : 36,
    });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));

    const done = new Promise((resolve) => {
        doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    doc.fontSize(14).text("Corte de Despachos por Turno", { align : "left" });
    doc.moveDown(0.4);
    doc.fontSize(10).text(`Despachador: ${dispatcher.name} ${dispatcher.lastName}`);
    doc.text(`Sucursal: ${shift.branch || "-"}`);
    doc.text(`Inicio de turno: ${formatDateTime(shift.startedAt)}`);
    doc.text(`Fin de turno: ${formatDateTime(shift.endedAt)}`);
    doc.moveDown(0.6);

    const columns = [
        { key : "date", title : "Hora del despacho", width : 90, align : "left" },
        { key : "quantity", title : "Litros", width : 60, align : "right" },
        { key : "price", title : "Precio", width : 58, align : "right" },
        { key : "subtotal", title : "Subtotal", width : 66, align : "right" },
        { key : "discount", title : "Descuento/litro", width : 82, align : "right" },
        { key : "discountTotal", title : "Descuento total", width : 78, align : "right" },
        { key : "total", title : "Total", width : 58, align : "right" },
    ];

    const startX = doc.page.margins.left;
    const headerY = doc.y;

    let cursorX = startX;
    doc.fontSize(9).font("Helvetica-Bold");
    columns.forEach((column) => {
        doc.text(column.title, cursorX, headerY, {
            width : column.width,
            align : column.align,
        });
        cursorX += column.width;
    });

    let rowY = headerY + 16;
    doc.moveTo(startX, rowY - 4).lineTo(startX + columns.reduce((total, column) => total + column.width, 0), rowY - 4).stroke();

    doc.font("Helvetica");
    loads.forEach((row) => {
        if (rowY > doc.page.height - doc.page.margins.bottom - 40) {
            doc.addPage();
            rowY = doc.page.margins.top;
            cursorX = startX;
            doc.fontSize(9).font("Helvetica-Bold");
            columns.forEach((column) => {
                doc.text(column.title, cursorX, rowY, {
                    width : column.width,
                    align : column.align,
                });
                cursorX += column.width;
            });
            rowY += 16;
            doc.moveTo(startX, rowY - 4).lineTo(startX + columns.reduce((total, column) => total + column.width, 0), rowY - 4).stroke();
            doc.font("Helvetica");
        }

        const normalizedRow = {
            date : formatDateTime(row.date),
            quantity : row.quantity.toFixed(2),
            price : formatMoney(row.price),
            subtotal : formatMoney(row.subtotal),
            discount : formatMoney(row.discount),
            discountTotal : formatMoney(row.discountTotal),
            total : formatMoney(row.total),
        };

        cursorX = startX;
        columns.forEach((column) => {
            doc.text(normalizedRow[column.key], cursorX, rowY, {
                width : column.width,
                align : column.align,
            });
            cursorX += column.width;
        });

        rowY += 15;
    });

    const totals = loads.reduce((accumulator, row) => {
        accumulator.quantity += row.quantity;
        accumulator.subtotal += row.subtotal;
        accumulator.discountTotal += row.discountTotal;
        accumulator.total += row.total;
        return accumulator;
    }, {
        quantity : 0,
        subtotal : 0,
        discountTotal : 0,
        total : 0,
    });

    rowY += 4;
    doc.moveTo(startX, rowY).lineTo(startX + columns.reduce((total, column) => total + column.width, 0), rowY).stroke();
    rowY += 6;
    doc.font("Helvetica-Bold").fontSize(10);
    doc.text(
        `Totales -> Litros: ${totals.quantity.toFixed(2)} | Subtotal: ${formatMoney(totals.subtotal)} | Descuento total: ${formatMoney(totals.discountTotal)} | Total: ${formatMoney(totals.total)}`,
        startX,
        rowY
    );

    doc.end();

    return done;
};

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

        const safeName = `${dispatcher.name || "despachador"}_${dispatcher.lastName || ""}`
            .trim()
            .replace(/\s+/g, "_")
            .replace(/[^a-zA-Z0-9_]/g, "")
            .toLowerCase();
        const fileName = `corte_turno_${safeName || "despachador"}_${endedAt.toISOString().slice(0, 19).replace(/[:T]/g, "-")}.pdf`;

        ctx.status = 200;
        ctx.set("Content-Type", "application/pdf");
        ctx.set("Content-Disposition", `attachment; filename="${fileName}"`);
        ctx.set("Content-Length", String(pdfBuffer.length));
        ctx.body = pdfBuffer;
    };
};
