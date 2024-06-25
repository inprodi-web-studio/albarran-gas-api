module.exports = {
    routes : [
        {
            method : "GET",
            path : "/dispatcher/loads/:bombId",
            handler : "load.getLoads",
        },
        {
            method : "POST",
            path : "/dispatcher/loads",
            handler : "load.assignLoad",
        },
    ],
};