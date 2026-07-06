module.exports = {
    routes : [
        {
            method : "GET",
            path : "/customer/loads",
            handler : "load.getLoads_Customer",
        },
        {
            method : "GET",
            path : "/customer/loads/pending-summary",
            handler : "load.getPendingSummary_Customer",
        },
        {
            method : "POST",
            path : "/customer/loads/:uuid/summary-seen",
            handler : "load.markSummarySeen_Customer",
        },
        {
            method : "GET",
            path : "/dispatcher/loads/shift/current",
            handler : "load.getCurrentShiftReport",
        },
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
