module.exports = {
    routes : [
        {
            method : "GET",
            path : "/dispatcher/loads/:bombId",
            handler : "load.getLoads",
        },
    ],
};