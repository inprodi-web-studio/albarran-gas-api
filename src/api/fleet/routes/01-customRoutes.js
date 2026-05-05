module.exports = {
    routes : [
        {
            method : "POST",
            path : "/customer/fleets/join",
            handler : "fleet.join_Customer",
        },
        {
            method : "GET",
            path : "/customer/fleets/:id",
            handler : "fleet.findOne_Customer",
        },
    ],
};
