const { USER, BOMB, LOAD, BANNER, VEHICLE, FLEET } = require("../constants/models");

const roles = {
    public : {
        permissions : {
            [USER] : {
                auth : ["login_Customer", "login_Dispatcher", "register_Customer", "validateCode_Customer", "forgotPassword_Customer"],
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
            [VEHICLE] : ["find", "create", "delete", "uploadInsuranceCover"],
            [FLEET] : ["find", "create", "delete", "findOne_Customer"],
        },
        meta : {
            type        : "customer",
            description : "customer",
        },
    },
    dispatcher : {
        permissions : {
            [USER] : {
                auth : ["setBombs_Dispatcher"],
                user : ["findCustomer_Dispatcher"],
            },
            [BOMB] : ["find"],
            [LOAD] : ["getLoads", "assignLoad"],
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
};

module.exports = roles;
