const Joi = require("joi");

const phoneNumberDTO = Joi.object({
  phoneNumber: Joi.string()
    .regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/)
    .required(),
});

const createAccountDTO = Joi.object({
  fullname: Joi.string(),
  phoneNumber: Joi.string().regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/),
  password: Joi.string().min(6),
  email: Joi.string().email(),
});
module.exports = { createAccountDTO, phoneNumberDTO };
