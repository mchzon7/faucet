const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// ===================== DASHBOARD ROUTE (EJS) =====================
router.get('/dashboard', protect, async (req, res) => {
    try {
        // Get user with populated data
        const user = await User.findById(req.user._id)
            .populate('referrals', 'name lname email createdAt')
            .populate('withdrawals', 'amount status createdAt');

        if (!user) {
            return res.redirect('/login');
        }

        // Prepare data for EJS
        const dashboardData = {
            user: {
                username: user.username,
                name: user.name,
                lname: user.lname,
                email: user.email,
                balance: user.balance || 0,
                totalEarned: user.totalEarned || 0,
                totalRefEarned: user.totalRefEarned || 0,
                progress: user.progress || 0,
                level: user.level || 1,
                referralCount: user.referralCount || 0
            },
            recentReferrals: (user.referrals || []).slice(-5),
            recentWithdrawals: (user.withdrawals || []).slice(-5),
            appName: 'FluwentCash'
        };

        // Render dashboard with EJS
        res.render('dashboard', dashboardData);

    } catch (error) {
        console.error('Dashboard render error:', error);
        res.status(500).send('Error loading dashboard');
    }
});

// ===================== VERIFY TOKEN ROUTE =====================
router.get('/api/verify-token', protect, async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            message: 'Token is valid'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// ===================== PROGRESS UPDATE ROUTE =====================
router.get('/api/get-progress', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            progress: user.progress || 0,
            level: user.level || 1
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;