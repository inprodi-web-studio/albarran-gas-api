module.exports = ( plugin ) => {
    plugin.routes["content-api"].routes.push({
        method  : "PUT",
        path    : "/customer/profile",
        handler : "user.updateProfile_Customer",
        config  : {
            prefix : "",
        },
    });
}