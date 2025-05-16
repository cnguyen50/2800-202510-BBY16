// middleware/validateBody.js
//ai generated
const validateBody = schema => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly : false,   // return **all** problems
    stripUnknown: true    // silently drop extraneous keys
  });

  if (error) {
    const msg = error.details.map(d => d.message).join(', ');
    return res.status(400).json({ error: msg });
  }

  req.body = value;       // use the cleaned, typed values
  next();
};

module.exports = validateBody;
