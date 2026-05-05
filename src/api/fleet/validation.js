const { yup, validateYupSchema } = require("../../helpers/validators");

const createFleetSchema = yup.object().shape({
    name : yup.string().required(),
}).noUnknown().strict();

const joinFleetSchema = yup.object().shape({
    code : yup.string().required().matches(/^\d{10}$/),
}).noUnknown().strict();

module.exports = {
    validateCreateFleet : validateYupSchema(createFleetSchema),
    validateJoinFleet : validateYupSchema(joinFleetSchema),
};
