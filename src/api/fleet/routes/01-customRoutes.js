module.exports = {
    routes : [
        {
            method : "GET",
            path : "/customer/fleets/:id",
            handler : "fleet.findOne_Customer",
        },
    ],
};
