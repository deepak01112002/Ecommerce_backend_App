const authMiddleware = require('./authMiddleware');

module.exports = async function (req, res, next) {
    // First check if user is authenticated
    authMiddleware(req, res, () => {
        // Check if user has admin role
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            return res.status(403).json({
                message: 'Access denied. Admin privileges required.'
            });
        }
    });
};