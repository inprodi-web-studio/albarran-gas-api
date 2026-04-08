const { yup, validateYupSchema } = require("../../helpers/validators");

const resolvePromotionSchema = yup.object().shape({
    customer : yup.string().required(),
    vehicle : yup.string().nullable(),
    fleet : yup.string().nullable(),
    quantity : yup.number().min(0).nullable(),
}).noUnknown().strict();

module.exports = {
    validateResolvePromotion : validateYupSchema(resolvePromotionSchema),
};
