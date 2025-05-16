// validation/userSchemas.js
const Joi = require('joi');

const registerSchema = Joi.object({
  username     : Joi.string().alphanum().min(3).max(30).required(),
  password     : Joi.string()
                    .pattern(/^[\w!@#$%^&*()-+=]{3,100}$/)   // allow specials & longer
                    .required(),
  email        : Joi.string().email().required(),
  neighbourhood: Joi.string().alphanum().min(3).max(80).required()
});

const loginSchema = Joi.object({
  username : Joi.string().required(),
  password : Joi.string().required()
}).unknown(true);                     // anything else is simply ignored

module.exports = { registerSchema, loginSchema };
