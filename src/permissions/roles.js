const { USER, BOMB, LOAD } = require("../constants/models");

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
            },
            [BOMB] : ["find"],
            [LOAD] : ["getLoads"],
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
