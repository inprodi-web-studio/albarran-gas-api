module.exports = {
    routes : [
        {
            method : "GET",
            path : "/customer/banners",
            handler : "banner.findMany_Customer",
        },
    ],
};