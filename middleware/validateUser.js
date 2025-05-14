const Joi = require('joi');
const bcrypt  = require('bcrypt');

const schema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: 