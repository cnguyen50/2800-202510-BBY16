module.exports = function requireAuth(req, res, next) {
    if(!req.session.userId) {
        return res.status(401).json({error: 'Unauthorized'});
    }
    req.user = { _id: req.session.userId };
    next();
};