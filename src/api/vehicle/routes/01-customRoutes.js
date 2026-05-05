module.exports = {
    routes : [
        {
            method : "POST",
            path : "/customer/vehicles/insurance-cover",
            handler : "vehicle.uploadInsuranceCover",
        },
        {
            method : "PUT",
            path : "/customer/vehicles/:id/default",
            handler : "vehicle.setDefault",
        },
    ],
};
