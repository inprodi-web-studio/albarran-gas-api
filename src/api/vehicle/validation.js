const { yup, validateYupSchema } = require("../../helpers/validators");

const createVehicleSchema = yup.object().shape({
    brand : yup.string().required("Brand is required"),
    model : yup.string().required("Model is required"),
    version : yup.string().required("Version is required"),
    year : yup.number().integer().min(1900).max(2100).required("Year is required"),
    color : yup.string().required("Color is required"),
    plates : yup.string().required("Plates are required"),
    insurancePolicy : yup.string().nullable(),
    insuranceExpiration : yup.string().nullable().matches(
        /^\d{4}-\d{2}-\d{2}$/,
        {
            message : "Insurance expiration must be a valid date",
            excludeEmptyString : true,
        }
    ),
    insuranceCompany : yup.string().nullable().when("insurancePolicy", {
        is : (insurancePolicy) => typeof insurancePolicy === "string" && insurancePolicy.length > 0,
        then : (schema) => schema.required("Insurance company is required when insurance policy is provided"),
        otherwise : (schema) => schema.nullable(),
    }),
    insuranceCoverPhoto : yup.mixed().nullable().when("insurancePolicy", {
        is : (insurancePolicy) => typeof insurancePolicy === "string" && insurancePolicy.length > 0,
        then : (schema) => schema.required("Insurance cover photo is required when insurance policy is provided"),
        otherwise : (schema) => schema.nullable(),
    }),
}).noUnknown().strict();

module.exports = {
    validateCreateVehicle : validateYupSchema(createVehicleSchema),
    validateUpdateVehicle : validateYupSchema(createVehicleSchema),
};
