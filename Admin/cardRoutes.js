const express = require('express');
const router = express.Router();
const Card = require('../models/card');
const ccard = require('../models/ccard');
const Admin = require('../models/adminschema');
const User = require('../models/user.model');
const Transaction = require("../models/transaction");
const adminAuth = require('./isAdmin');
const { body, validationResult } = require('express-validator');
const card = require('../models/card');
const { protect } = require("../middleware/auth");

// Admin routes with EJS rendering
// Show all cards
router.get('/admin/cards', adminAuth, async (req, res) => {
    try {
        // 1. Parse pagination variables as Numbers and define defaults
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;
        
        const search = req.query.search || "";
        const status = req.query.status || "";

        // 2. Safely construct the MongoDB query
        let query = {};

        // Apply wildcard text search safely only to String fields (e.g., cardNumber)
        if (search) {
            query.$or = [
                { cardNumber: { $regex: search, $options: "i" } }
            ];
        }

        // Apply status filtering if selected in your dashboard dropdown
        if (status) {
            if (status === 'active') {
                query.isActive = true;
                query.remainingRedemptions = { $gt: 0 };
            } else if (status === 'inactive') {
                query.$or = [
                    { isActive: false },
                    { remainingRedemptions: { $lte: 0 } }
                ];
            }
        }

        // 3. Execute database queries inside the try block
        const totalCards = await Card.countDocuments(query);
        const cards = await Card.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // 4. Render the page safely
        res.render('admin/cards/index', {
            cards,
            currentPage: page,
            totalPages: Math.ceil(totalCards / limit) || 1,
            search,
            status,
            success: req.flash('success_msg'),
            error: req.flash('error_msg'),
            admin: req.admin,
            body: req.body,
            appName: process.env.APP_NAME || "Your App"
        });
        
    } catch (error) {
        console.error('Error fetching cards:', error);
        req.flash('error_msg', 'Failed to fetch cards');
        res.redirect('/admin/cards');
    }
});

// Show create card form
router.get('/admin/cards/create', adminAuth, (req, res) => {
    res.render('admin/cards/create', {
        error: req.flash('error_msg'), admin: req.admin, success: req.flash('success_msg'), body: req.body, appName: process.env.APP_NAME
    });
});

// Create card
router.post('/admin/cards/create', adminAuth, [
    body('cardNumber').isNumeric().withMessage('Card number must be a number').isInt({ min: 1 }).withMessage('Card number must be at least 1'),
    body('amount').isNumeric().withMessage('Amount must be a number').isInt({ min: 1 }).withMessage('Amount must be at least 1'),
    body('totalRedemptions').isNumeric().withMessage('Total redemptions must be a number').isInt({ min: 1 }).withMessage('Total redemptions must be at least 1'),
    body('pointsRequired').isNumeric().withMessage('Points required must be a number').isInt({ min: 0 }).withMessage('Points required must be 0 or greater'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash('error_msg', errors.array()[0].msg);
            return res.redirect('/admin/cards/create');
        }
        
        const { cardNumber, amount, displayAmount, totalRedemptions, pointsRequired, expiresAt } = req.body;
        const card = new Card({
            cardNumber,
            amount,
            displayAmount: displayAmount || `$${amount}`,
            totalRedemptions,
            remainingRedemptions: totalRedemptions,
            pointsRequired,
            expiresAt: expiresAt || null,
            isActive: true
        });

        await card.save();
        req.flash('success_msg', 'Card created successfully!');
        res.redirect('/admin/cards');
    } catch (error) {
        console.error('Error creating card:', error);
        req.flash('error_msg', 'Failed to create card: ' + error.message);
        res.redirect('/admin/cards/create');
    }
});

// View single card
router.get('/cards/:id', adminAuth, async (req, res) => {
    const {card}=req.params;
    if(!card) {
        req.flash('error_msg', 'Card not found');
        return res.redirect('/admin/cards');
    } else {
        res.render('admin/cards/view', { card, admin: req.admin, success: req.flash('success_msg'), body: req.body, appName: process.env.APP_NAME });
    }
});
         // Show edit form
router.get('/admin/cards/:id/edit', adminAuth, async (req, res) => {
    try {
        const card = await Card.findById(req.params._id);
        if (!card) {
            req.flash('error_msg', 'Card not found');
            return res.redirect('/admin/cards');
        }
        res.render('admin/cards/edit', { card, error: req.flash('error_msg'), admin: req.admin, success: req.flash('success_msg'), body: req.body, appName: process.env.APP_NAME });
    } catch (error) {
        console.error('Error fetching card:', error);
        req.flash('error_msg', 'Failed to fetch card');
        res.redirect('/admin/cards');
    }
});

// Delete card
router.post('/admin/cards/:id', adminAuth, async (req, res) => {
    try {
        const card = await Card.findByIdAndDelete(req.params.id);
        if (!card) {
            req.flash('error_msg', 'Card not found');
            return res.redirect('/admin/cards');
        }
        req.flash('success_msg', 'Card deleted successfully!');
        res.redirect('/admin/cards');
    } catch (error) {
        console.error('Error deleting card:', error);
        req.flash('error_msg', 'Failed to delete card');
        res.redirect('/admin/cards');
    }
});

// Statistics page
router.get('/admin/card-stats', adminAuth, async (req, res) => {
    try {
        const totalCards = await Card.countDocuments();
        const activeCards = await Card.countDocuments({ 
            isActive: true, 
            remainingRedemptions: { $gt: 0 } 
        });
        
        const totalRedemptionsResult = await Card.aggregate([
            { $group: { _id: null, total: { $sum: { $size: '$redeemedBy' } } } }
        ]);
        const totalRedemptions = totalRedemptionsResult[0]?.total || 0;

        const totalAmountResult = await Card.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalAmount = totalAmountResult[0]?.total || 0;

        const recentCards = await Card.find()
            .sort({ createdAt: -1 })
            .limit(5);

        res.render('admin/cards/stats', {
            stats: {
                totalCards,
                activeCards,
                totalRedemptions,
                totalAmount,
            },
            appName: process.env.APP_NAME,
            recentCards,
            cards: totalCards,
            admin: req.admin, success: req.flash('success_msg'), body: req.body, currentPage: 'stats', error: req.flash('error_msg'),
            title: 'Statistics'
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        req.flash('error_msg', 'Failed to fetch statistics');
        res.redirect('/admin/cards');
    }
});

// User route - Show available cards
// ============================================
// GET - Show available cards for users (FIXED)
// ============================================

router.get('/available-cards',protect, async (req, res) => {
    try {
        // 1. Added missing || operator
        const userId = req.user._id; 
        const user = await User.findById(userId);
        
        const now = new Date();

        // Get all cards for fallback/debugging
        const allCards = await Card.find({})
            .sort({ createdAt: -1 })
            .limit(5);

        console.log('Total cards in database:', allCards.length);
        allCards.forEach(card => {
            console.log(`Card: ${card.cardNumber}, Active: ${card.isActive}, Remaining: ${card.remainingRedemptions}, Expires: ${card.expiresAt}`);
        });

        // Get only available cards
        const availableCards = await Card.find({
            isActive: true,
            remainingRedemptions: { $gt: 0 },
            $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: { $gt: now } }
            ]
        }).sort({ createdAt: -1 });


        // Use available cards if found, otherwise fallback to all cards
        const cardsToShow = availableCards.length > 0 ? availableCards : allCards;

        // Map status
        const cardsWithStatus = cardsToShow.map(card => {
            const isRedeemed = card.redeemedBy && card.redeemedBy.some(
                redemption => redemption.userId.toString() === userId.toString()
            );
            return {
                ...card.toObject(),
                // 2. Added missing || operator
                isRedeemed: isRedeemed || false, 
                isActuallyAvailable: card.isActive && card.remainingRedemptions > 0 && 
                    (!card.expiresAt || card.expiresAt > now)
            };
        });

        res.render('cards/Available', {
            title: 'Available Cards',
            cards: cardsWithStatus, // Use this in your frontend loop!
            userPoints: user.balance, // 3. Added missing  operator
            success: req.flash('success'),
            error: req.flash('error'),
            warning: req.flash('warning'),
            appName: process.env.APP_NAME,
            user: user
            // Removed "card: allCards" to prevent template variable pollution/collisions
        });

    } catch (error) {
        console.error('Error card section:', error);
        req.flash('error_msg', 'error server');
        res.redirect('/dashboard');
    }
});


// NOTE: If this router is mounted as app.use('/redeem-card', ...) in your server.js,
// change the path below from '/redeem-card' to '/'
router.post('/redeem-card',protect, async (req, res) => {
    try {
        // 1. Get cardId from the form body (sent from modalCardId input)
        const { cardId } = req.body;
        const { wallet } = req.body;
        const userId = req.user._id;

        if (!cardId) {
            req.flash('error_msg', 'Invalid request: Card ID missing');
            return res.redirect('/available-cards'); // Change to your actual render route if different
        }

        // 2. Query by ID instead of cardNumber (matching MongoDB's Object ID)
        const card = await Card.findById(cardId);
        if (!card) {
            req.flash('error_msg', 'Card not found');
            return res.redirect('/available-cards');
        }

        // 3. Keep your existing availability and expiry checks
        if (!card.isAvailable()) {
            req.flash('error_msg', 'Card is no longer available');
            return res.redirect('/available-cards');
        }

        if (card.isExpired()) {
            req.flash('error_msg', 'Card has expired');
            return res.redirect('/available-cards');
        }

        // 4. Double check if the user has already redeemed this specific card
        const alreadyRedeemed = card.redeemedBy.some(
            redemption => redemption.userId.toString() === userId.toString()
        );
        if (alreadyRedeemed) {
            req.flash('error_msg', 'You have already redeemed this card');
            return res.redirect('/available-cards');
        }

        // 5. Fetch user and verify balance
        const user = await User.findById(userId);
        if (!user) {
            req.flash('error_msg', 'User session not found');
            return res.redirect('/available-cards');
        }

        // Match schema field name (e.g., if you use user.balance or user.points)
        if (user.balance < card.pointsRequired) {
            req.flash('error_msg', 'Insufficient points to redeem this card');
            return res.redirect('/available-cards');
        }

        if (user.isVerified !== true) {
            req.flash("error_msg", "You need to verified your account to Redeem");
            return res.redirect("/available-cards");
        }

        // 6. Process redemption
        user.balance -= card.pointsRequired;
        await user.save();

        req.session.user = user;

        // Check field spelling: schema has "remainingRedemption" in front-end, 
        // make sure it matches your mongoose schema here (e.g. remainingRedemption or remainingRedemptions)
        card.remainingRedemptions -= 1; 
        card.redeemedBy.push({ userId, redeemedAt: new Date() });
        
        if (card.remainingRedemptions <= 0) {
            card.isActive = false;
        }
        await card.save();

        req.flash('success_msg', `Successfully redeemed $${card.amount} reward card!`);
        res.redirect('/available-cards');

        const amount = card.amount;

        if (userId) {
              const user = await User.findById(userId);
              const apiKey = process.env.WithdrawKey;
              const to = wallet;
              const amonn = parseInt(amount * 1);
              const currency = "USDT";
        
              const data = new URLSearchParams();
              data.append("api_key", apiKey);
              data.append("to", to);
              data.append("amount", amonn);
              data.append("currency", currency);
        
              const transaction = new Transaction({userId, amount, type: "Reward-card", status: "completed"});
              transaction.save();
        
              fetch("https://faucetpay.io/api/v1/send", {
                    method: "POST",
                    body: data,
              })
                  .then(response => response.json())
            }
    } catch (error) {
        console.error('Error redeeming card:', error);
        req.flash('error_msg', 'Failed to redeem card');
        res.redirect('/available-cards');
    }
});

module.exports = router;