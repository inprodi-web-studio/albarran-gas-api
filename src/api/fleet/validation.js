const { yup, validateYupSchema } = require("../../helpers/validators");

const createFleetSchema = yup.object().shape({
    name : yup.string().required(),
}).noUnknown().strict();

module.exports = {
    validateCreateFleet : validateYupSchema(createFleetSchema),
};
