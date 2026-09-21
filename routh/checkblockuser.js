const User = require('../models/user.model');

const checkBlocked = async (req, res, next) => {
    try {
        // Check if user exists in request (set by auth middleware)
        if (!req.user) {
            req.flash('error_msg', 'Please log in to continue');
            return res.redirect('/login');
        }

        // Get user from database to check block status
        const user = await User.findById(req.user._id);
        
        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/login');
        }

        // Check if user is blocked
        if (user.isBlocked === true) {
            // Clear the token cookie
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
            });

            // Set flash message
            req.flash('error_msg', 'Your account has been blocked. Please contact support.');
            
            // Redirect to login
            return res.redirect('/login');
        }

        // User is not blocked, proceed
        next();

    } catch (error) {
        console.error('Block check error:', error);
        
        // Set flash message
        req.flash('error_msg', 'An error occurred. Please try again.');
        
        // Redirect to login
        return res.redirect('/login');
    }
};

module.exports = checkBlocked;