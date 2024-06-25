const { yup, validateYupSchema } = require("../../helpers/validators");

const assignLoadSchema = yup.object().shape({
    customer : yup.string().uuid().required(),
    product  : yup.string().oneOf(["magna", "premium"]).required(),
    quantity : yup.number().min(0).required(),
    price : yup.number().min(0).required(),
    total : yup.number().min(0).required(),
}).noUnknown().strict();


module.exports = {
    validateAssignLoad : validateYupSchema(assignLoadSchema),
};