require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const { generateToken } = require('../utils/jwt');
const homeController = require('../controllers/homeController');
const blogController = require('../controllers/blogController');
const User = require("../models/user.model");
const transpoter = require("./nodemailer");
const crypto = require("crypto");
const router = express.Router();
const axios = require("axios");


router.get('/', homeController.getHomePage);
router.get('/blog', blogController.getBlogIndex);

// Helper function to check if an IP is a VPN/Proxy
async function isVpnOrProxy(ip) {
  // If running locally for testing, skip the check
  if (ip === "::1" || ip === "127.0.0.1" || !ip) return false;

  try {
    // Using ip-api.com (Free tier allows 45 requests/min. For production, consider premium or proxycheck.io)
    const response = await axios.get(`http://ip-api.com/json/${ip}?fields=status,proxy,hosting,query`);
    if (response.data && response.data.status === "success") {
      // If the IP is flagged as a proxy, VPN, or data center hosting provider
      return response.data.proxy === true || response.data.hosting === true;
    }
    return false;
  } catch (error) {
    console.error("VPN Check Error:", error.message);
    return false; // Fallback to let user proceed if API fails
  }
}

router.get("/register", (req, res) => {
    if(req.session.user){
        return res.redirect("/dashboard");
    } else {
        res.render("../views/new/register", { appName: process.env.APP_NAME, title: 'FluwentCash' });
    }
});

router.post('/register', async (req, res) => {
    const { username, name, lname, email, password, referralCode } = req.body;
    
    try {
        // Strong password regex requirement:
        // - At least 8 characters long
        // - At least 1 uppercase letter
        // - At least 1 lowercase letter
        // - At least 1 number
        // - At least 1 special character (@$!%*?&)
        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;

        if (!strongPasswordRegex.test(password)) {
            req.flash(
                "error_msg", 
                "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)."
            );
            return res.status(400).redirect('/register');
        }

        let checkUser = await User.findOne({ email });
        if (checkUser) {
            req.flash("error_msg", "User already exists");
            return res.status(400).redirect('/register');
        }

        let checkusername = await User.findOne({ username });
        if (checkusername) {
            req.flash("error_msg", "Username already exists");
            return res.status(400).redirect('/register');
        }

        let referrer = null;
        if (referralCode) {
            referrer = await User.findOne({ username: referralCode });
            if (!referrer) {
                req.flash("error_msg", "Invalid referral code!");
                return res.status(400).redirect('/register');
            }
        }

        const hashPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ 
            username, 
            name, 
            lname, 
            email, 
            password: hashPassword, 
            balance: 0, 
            referrer: referrer ? referrer._id : null 
        });
        await newUser.save();

        if (referrer) {
            referrer.referralCount += 1;
            referrer.weeklyReferrals += 1;
            await referrer.save();
        }

        // Generate JWT token
        const token = generateToken(newUser._id);
        // Set token as HttpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            sameSite: 'lax'
        });

        return res.status(201).redirect("/login");

    } catch (error) {
        req.flash("error_msg", error.message);
        return res.status(500).render("../views/new/register", { appName: process.env.APP_NAME, title: 'FluwentCash' });
    }
});

router.get("/login", (req, res) => { 
        res.render("../views/new/login", { appName: process.env.APP_NAME, title: 'FluwentCash' });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Validate input
        if (!email || !password) {
            req.flash('error_msg', 'Email and password are required');
            return res.redirect('/login');
        }

        // Find user by email or username
        const user = await User.findOne({ 
            $or: [{ email: email }, { username: email }] 
        });
        
        if (!user) {
            req.flash('error_msg', 'Invalid email/username or password');
            return res.redirect('/login');
        }

        if(user.isBlocked){
            req.flash('error_msg', 'Your account has been blocked');
            return res.redirect('/login');
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            req.flash('error_msg', 'Incorecet password');
            return res.redirect('/login')
        }

        // Generate JWT token
        const token = generateToken(user._id);

        // Set token as HttpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            sameSite: 'lax',
            path: '/' // Make sure cookie is available for all routes
        });

        // Return success with redirect URL
        return res.status(200).redirect("/dashboard")

    } catch (error) {
        req.flash("error_msg", error.message);
        return res.status(500).render("../views/new/login", { appName: process.env.APP_NAME, title: 'FluwentCash' });
    }
});

router.get('/logout', (req, res) => {
    // Clear the token cookie
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    });
    
    // Clear session if using session
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destroy error:', err);
            }
        });
    }
    
    // Redirect to login page
    res.redirect('/login');
});

router.get("/forgotpassword", (req, res) => res.render("../views/new/forgotpassword", {appName: process.env.APP_NAME, title: 'FluwentCash'}));

router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return res.render("../views/new/forgotpassword", { error_msg: "user not found..!"});
    }

    const token = crypto.randomBytes(20).toString("hex");
    user.resetPassword = token;
    user.resetPasswordExpAt = Date.now() + 3600000; // 1 hour expiration
    await user.save();

    const resetLink = `http://localhost:8000/reset-password/${token}`;

    // Professional HTML Email Template
    const emailHtml =`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #333333; text-align: center;">Password Reset Request</h2>
            <p style="color: #555555; font-size: 16px; line-height: 1.5;">
                You requested a password reset for your <strong>CrashCash</strong> account. Click the button below to set a new password. This link will expire in 1 hour.
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
                    Reset Password
                </a>
            </div>
            <p style="color: #777777; font-size: 14px; line-height: 1.5;">
                If the button above doesn't work, copy and paste the following URL into your browser:
                <br>
                <a href="${resetLink}" style="color: #007bff; word-break: break-all;">${resetLink}</a>
            </p>
            <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">
            <p style="color: #999999; font-size: 12px; text-align: center;">
                If you did not request this, please ignore this email and your password will remain unchanged.
            </p>
        </div>
    `;

    try {
        await transpoter.sendMail({
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Password Reset Request",
            html: emailHtml, // Passed the template string here
        });

        req.flash("success_msg", "Check your email for reset link");
        res.redirect("/login");
    } catch (error) {
        console.error("Email sending failed:", error);
        return res.render("../views/new/forgotpassword", { error_msg: "Failed to send reset email. Try again later." });
    }
});

router.get("/reset-password/:token", async (req, res) => {
    const user = await User.findOne({
        resetPassword: req.params.token,
        resetPasswordExpAt: { $gt: Date.now() },
    });

    if (!user) {
        return res.send(
            `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Success - FluwentCash</title>
            <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
        </head>
        <body class="bg-gray-50 flex items-center justify-center min-h-screen p-4">
            <div class="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
                <div class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                </div>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">Invalid or Expired Link</h2>
                <p class="text-gray-600 mb-6 font-medium">
                    Your reset link has been expired please request a new one.
                </p>
                <a href="/login" class="inline-block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200">
                    Sign In to Account
                </a>
            </div>
        </body>
        </html>`
        );
    }

    res.render("verifyforgotPassword", { token: req.params.token,  appName: process.env.APP_NAME, title: 'FluwentCash'  });
});

router.post("/reset-password/:token", async (req, res) => {
    const { password } = req.body;
    const user = await User.findOne({
        resetPassword: req.params.token,
        resetPasswordExpAt: { $gt: Date.now() },
    });

    // 1. Redesigned Error Page (Invalid/Expired Token)
    if (!user) {
        return res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Link Expired - FluwentCash</title>
                <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
            </head>
            <body class="bg-gray-50 flex items-center justify-center min-h-screen p-4">
                <div class="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
                    <div class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">Link Expired or Invalid</h2>
                    <p class="text-gray-600 mb-6 font-medium">
                        This password reset link is no longer valid. For security reasons, reset links expire after 1 hour.
                    </p>
                    <a href="/forgot-password" class="inline-block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200">
                        Request a New Link
                    </a>
                </div>
            </body>
            </html>`
        );
    }

    const hashPassword = await bcrypt.hash(password, 10);
    user.password = hashPassword;
    user.resetPassword = null;
    user.resetPasswordExpAt = null;
    await user.save();

    // 2. Redesigned Success Page
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Success - FluwentCash</title>
            <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
        </head>
        <body class="bg-gray-50 flex items-center justify-center min-h-screen p-4">
            <div class="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
                <div class="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">Password Updated</h2>
                <p class="text-gray-600 mb-6 font-medium">
                    Your password has been changed successfully. You can now use your new password to sign in.
                </p>
                <a href="/login" class="inline-block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200">
                    Sign In to Account
                </a>
            </div>
        </body>
        </html>`
    );
});

module.exports = router;