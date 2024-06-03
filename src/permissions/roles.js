const { USER } = require("../constants/models");

const roles = {
    public : {
        permissions : {
            [USER] : {
                auth : ["login_Customer", "register_Customer", "validateCode_Customer", "forgotPassword_Customer"],
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
