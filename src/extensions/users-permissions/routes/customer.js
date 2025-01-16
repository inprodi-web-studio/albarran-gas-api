module.exports = ( plugin ) => {
    plugin.routes["content-api"].routes.push({
        method  : "GET",
        path    : "/dispatcher/customers/:uuid",
        handler : "user.findCustomer_Dispatcher",
        config  : {
            prefix : "",
        },
    });

    plugin.routes["content-api"].routes.push({
        method  : "GET",
        path    : "/customer/fiscals",
        handler : "user.findFiscals_Customer",
        config  : {
            prefix : "",
        },
    });

    plugin.routes["content-api"].routes.push({
        method  : "POST",
        path    : "/customer/fiscals",
        handler : "user.addFiscal_Customer",
        config  : {
            prefix : "",
        },
    });

    plugin.routes["content-api"].routes.push({
        method  : "PUT",
        path    : "/customer/profile",
        handler : "user.updateProfile_Customer",
        config  : {
            prefix : "",
        },
    });

    plugin.routes["content-api"].routes.push({
        method  : "DELETE",
        path    : "/customer/fiscals/:uuid",
        handler : "user.deleteFiscal_Customer",
        config  : {
            prefix : "",
        },
    });
}