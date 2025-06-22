require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const transpoter = require("./nodemailer");
const crypto = require("crypto");
const router = express.Router();

router.get("/register", (req, res) => {
    const referralCode = req.query.ref || null; // capture referral code from string
    res.render("register", { referralCode });
});

router.post("/register", async (req, res) => {
    const { username, name, email, password, referralCode } = req.body;
    const hashPassword = await bcrypt.hash(password, 10);
    try {
        let checkUser = await User.findOne({ email });
        if (checkUser) {
            req.flash("error_msg", "user already exist");
            return res.redirect("/register");
        }

        let checkusername = await User.findOne({ username });
        if (checkusername) {
            req.flash("error_msg", "username already exist");
            return res.redirect("/register");
        }

        let referrer = null;
        if (referralCode) {
            referrer = await User.findOne({ username: referralCode });
            if (!referrer) {
                req.flash("error_msg", "invalid referral code");
                return res.redirect("/register");
            }
        }

        const protex = new User({ username, name, email, password: hashPassword, balance: 0, referrer: referrer ? referrer._id : null });
        await protex.save();

        if (referrer) {
            referrer.referralCount += 1;
            await referrer.save();
        }

        req.flash("success_msg", "Account created successfully....");
        return res.redirect("/login");


    } catch (error) {
        res.send(error);
    }
});

router.get("/login", (req, res) => res.render("login"));
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const protex = await User.findOne({ email });
    if (protex && (await bcrypt.compare(password, protex.password))) {
        req.session.user = protex;
        res.redirect("/dashboard");
    } else {
        req.flash("error_msg", "invalid email or password");
        return res.redirect("/login");
    }
});

router.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Logout error:", err);
            return res.redirect("/dashboard"); // stay on dashboard if error
        }
        res.clearCookie("connect.sid"); // optional: clear session cookie
        res.redirect("/login"); // or res.redirect("/")
    });
});

router.get("/forgotpassword", (req, res) => res.render("forgotpassword"));

router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return res.render("forgotpassword", { error_msg: "user not found..!" });
    }

    const token = crypto.randomBytes(20).toString("hex");
    user.resetPassword = token;
    user.resetPasswordExpAt = Date.now() + 3600000;
    await user.save();

    const resetLink = `/reset-password/${token}`;

    await transpoter.sendMail({
        from: process.env.SENDER_EMAIL,
        to: user.email,
        subject: "password-reset",
        html: `<p>Click <a href='${resetLink}'>here</a> to reset your password.</p>`,
    });

    req.flash("success_msg", "Check your email for reset link");
    res.redirect("/login");
});

router.get("/reset-password/:token", async (req, res) => {
    const user = await User.findOne({
        resetPassword: req.params.token,
        resetPasswordExpAt: { $gt: Date.now() },
    });

    if (!user) {
        return res.send("Token is invalid or expired.");
    }

    res.render("verifyforgotPassword", { token: req.params.token });
});

router.post("/reset-password/:token", async (req, res) => {
    const { password } = req.body;
    const user = await User.findOne({
        resetPassword: req.params.token,
        resetPasswordExpAt: { $gt: Date.now() },
    });

    if (!user) {
        return res.send("Token is invalid or expired.");
    }

    const hashPassword = await bcrypt.hash(password, 10);
    user.password = hashPassword;
    user.resetPassword = null;
    user.resetPasswordExpAt = null;
    await user.save();

    res.send("Password updated successfully. <a href='/login'>Login</a>");
});

module.exports = router;