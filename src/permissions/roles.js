const { USER, BOMB, LOAD, BANNER, VEHICLE, FLEET, PROMOTION, ADMIN_REPORT, ADMIN_PROMOTION, ADMIN_BANNER } = require("../constants/models");

const roles = {
    public : {
        permissions : {
            [USER] : {
                auth : ["login_Customer", "login_Dispatcher", "login_Admin", "register_Customer", "validateCode_Customer", "forgotPassword_Customer"],
            },
        },
        meta : {
            type        : "public",
            description : "public",
        },
    },
    customer : {
        permissions : {
            [USER] : {
                auth : ["resetPassword_Customer"],
                user : ["updateProfile_Customer"],
            },
            [LOAD] : ["getLoads_Customer"],
            [BANNER] : ["findMany_Customer"],
            [PROMOTION] : ["find"],
            [VEHICLE] : ["find", "create", "delete", "uploadInsuranceCover", "setDefault"],
            [FLEET] : ["find", "create", "delete", "findOne_Customer", "join_Customer"],
        },
        meta : {
            type        : "customer",
            description : "customer",
        },
    },
    dispatcher : {
        permissions : {
            [USER] : {
                auth : ["setBombs_Dispatcher", "logout_Dispatcher", "logout_DispatcherWithReport"],
                user : ["findCustomer_Dispatcher"],
            },
            [BOMB] : ["find"],
            [LOAD] : ["getLoads", "assignLoad", "getCurrentShiftReport"],
            [PROMOTION] : ["resolveForDispatcher"],
        },
        meta : {
            type        : "dispatcher",
            description : "dispatcher",
        },
    },
    "super-admin" : {
        permissions : {
            [USER] : [],
        },
        meta : {
            type        : "super-admin",
            description : "super-admin",
        },
    },
    admin : {
        permissions : {
            [ADMIN_REPORT] : ["getOptions", "getLoads", "getDiscounts", "getInvoices", "getCustomers", "getShiftReports", "downloadShiftReportPdf"],
            [ADMIN_PROMOTION] : ["find", "findOne", "create", "update", "delete"],
            [ADMIN_BANNER] : ["find", "create", "update", "delete"],
        },
        meta : {
            type        : "admin",
            description : "admin",
        },
    },
};

module.exports = roles;
