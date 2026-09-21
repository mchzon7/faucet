const { verifyToken } = require('../utils/jwt');
const User = require('../models/user.model');

const protect = async (req, res, next) => {
    let token;

    // Check for token in cookies first (HttpOnly cookie)
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }
    
    // Also check Authorization header (for API requests)
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists in session (optional fallback)
    if (!token && req.session && req.session.token) {
        token = req.session.token;
    }

    if (!token) {
        // For API requests, return JSON
        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }
        // For web requests, redirect to login
        return res.redirect('/login');
    }

    try {
        const decoded = verifyToken(token);
        if (!decoded) {
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid or expired token'
                });
            }
            // Clear invalid cookie
            res.clearCookie('token');
            return res.redirect('/login');
        }

        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }
            res.clearCookie('token');
            return res.redirect('/login');
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }
        res.clearCookie('token');
        return res.redirect('/login');
    }
};

module.exports = { protect };