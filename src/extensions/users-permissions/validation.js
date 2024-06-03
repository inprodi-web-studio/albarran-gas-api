const { yup, validateYupSchema } = require("../../helpers/validators");

const loginSchema = yup.object().shape({
    email    : yup.string().email("Email must be a valid email").required("Email is required"),
    password : yup.string().required("Password is required"), 
}).noUnknown().strict();

const registerSchema = yup.object().shape({
    name            : yup.string().required("Name is required"),
    lastName        : yup.string().required("Last name is required"),
    email           : yup.string().email("Email must be a valid email").required("Email is required"),
    phone           : yup.string().required("Phone is required"),
    gender          : yup.string().oneOf(["male", "female", "undefined"]).required("Gender is required"),
    birthdate       : yup.string().required("Birthdate is required").matches( /^\d{4}-\d{2}-\d{2}$/, "Birthdate must be a valid date" ),
    password        : yup.string().required("Password is required"),
    passwordConfirm : yup.string().oneOf([yup.ref("password")], "Passwords must match").required("Password confirmation is required"),
});

const validateCodeSchema = yup.object().shape({
    event : yup.string().oneOf(["register", "reset"]).required("Event is required"),
    code  : yup.string().min(4, "Code must be at least 4 characters long").max(4, "Code must be at most 4 characters long").required("Code is required"),
});

const forgotPasswordSchema = yup.object().shape({
    email : yup.string().email("Email must be a valid email").required("Email is required"),
});

const resetPasswordSchema = yup.object().shape({
    password        : yup.string().required("Password is required"),
    passwordConfirm : yup.string().oneOf([yup.ref("password")], "Passwords must match").required("Password confirmation is required"),
});

const updateProfileSchema = yup.object().shape({
    name            : yup.string().required("Name is required"),
    lastName        : yup.string().required("Last name is required"),
    gender          : yup.string().oneOf(["male", "female", "undefined"]).required("Gender is required"),
    birthdate       : yup.string().required("Birthdate is required").matches( /^\d{4}-\d{2}-\d{2}$/, "Birthdate must be a valid date" ),
})

module.exports = {
    validateLogin          : validateYupSchema( loginSchema ),
    validateRegister       : validateYupSchema( registerSchema ),
    validateValidateCode   : validateYupSchema( validateCodeSchema ),
    validateForgotPassword : validateYupSchema( forgotPasswordSchema ),
    validateResetPassword  : validateYupSchema( resetPasswordSchema ),
    validateUpdateProfile  : validateYupSchema( updateProfileSchema ),
};