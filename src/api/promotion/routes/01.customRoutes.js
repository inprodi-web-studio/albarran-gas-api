module.exports = {
    routes : [
        {
            method : "POST",
            path : "/dispatcher/promotions/resolve",
            handler : "promotion.resolveForDispatcher",
        },
    ],
};
