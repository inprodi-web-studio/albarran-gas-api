module.exports = ( plugin ) => {
    plugin.routes["content-api"].routes.push({
        method  : "POST",
        path    : "/customer/auth/login",
        handler : "auth.login_Customer",
        config  : {
            prefix : "",
        },
    });

    plugin.routes["content-api"].routes.push({
        method  : "POST",
        path    : "/customer/auth/register",
        handler : "auth.register_Customer",
        config  : {
            prefix : "",
        },
    });

    plugin.routes["content-api"].routes.push({
        method  : "POST",
        path    : "/customer/auth/validate-code/:uuid",
        handler : "auth.validateCode_Customer",
        config  : {
            prefix : "",
        },
    });

    plugin.routes["content-api"].routes.push({
        method  : "POST",
        path    : "/customer/auth/forgot-password",
        handler : "auth.forgotPassword_Customer",
        config  : {
            prefix : "",
        },
    });

    plugin.routes["content-api"].routes.push({
        method  : "PATCH",
        path    : "/customer/auth/reset-password",
        handler : "auth.resetPassword_Customer",
        config  : {
            prefix : "",
        },
    });

    plugin.routes["content-api"].routes.push({
        method  : "POST",
        path    : "/dispatcher/auth/login",
        handler : "auth.login_Dispatcher",
        config  : {
            prefix : "",
        },
    });

    plugin.routes["content-api"].routes.push({
        method  : "PATCH",
        path    : "/dispatcher/auth/set-bombs",
        handler : "auth.setBombs_Dispatcher",
        config  : {
            prefix : "",
        },
    });
}