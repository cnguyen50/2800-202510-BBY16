const Joi = require('joi');

const safeString = Joi.string()
  .pattern(/[$.]/, { invert: true })
  .messages({ 'string.pattern.invert': 'Illegal characters ($ or .)' });

module.exports = schema => (req, res, next) => {
    const {value, error} = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
    });

    if(error) {
        const details = error.details.map(d => ({
            field: d.path.join('.'),
            message: d.message
        }));

        return res.status(400).json({error: 'Validation failed', details});
    }

    req.validatedBody = value;
    next();
}

module.exports.safeString = safeString;