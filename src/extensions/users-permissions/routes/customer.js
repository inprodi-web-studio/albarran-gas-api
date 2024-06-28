module.exports = ( plugin ) => {
    plugin.routes["content-api"].routes.push({
        method  : "PUT",
        path    : "/customer/profile",
        handler : "user.updateProfile_Customer",
        config  : {
            prefix : "",
        },
    });

    plugin.routes["content-api"].routes.push({
        method  : "GET",
        path    : "/dispatcher/customers/:uuid",
        handler : "user.findCustomer_Dispatcher",
        config  : {
            prefix : "",
        },
    });
}