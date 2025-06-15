const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const transpoter = require("./nodemailer");

// Setup your mailer (use your real SMTP credentials or a service like SendGrid)


// Send user verify account OTP
router.post("/send-otp", async (req, res) => {
  if (!req.session.user) {
    res.json({ success: false, message: "please login" });
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
  const userId = req.session.user;

  try {
    const user = await User.findById(userId);
    if (!user) {
      req.flash("error_msg", "user not found");
      return res.redirect("/login");
    }

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await transpoter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Your Verification OTP",
      text: `Your OTP is: ${otp}`
    });
    req.flash("success_msg", "OTP has been sent to your email");
    res.redirect("/verify");
  } catch (err) {
    res.status(500).json({ message: "Error sending OTP", error: err.message });
  }
});

// user Verify OTP
router.get("/verify", (req, res) => res.render("verify"));

router.post("/verify-otp", async (req, res) => {
  if (!req.session.user) {
    req.flash("error_msg", "please login");
    return res.redirect("/login");
  }

  const { otp } = req.body;
  const userId = req.session.user;

  try {
    const user = await User.findById(userId);

    if (!user || user.otp !== otp || user.otpExpires < new Date()) {
      req.flash("error_msg", "Invalid or expired OTP");
      return res.redirect("/verify");
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();
    req.session.user = user;

    req.flash("success_msg", "Email verified successfully");
    res.redirect("/dashboard");
  } catch (err) {
    res.status(500).json({ message: "Verification failed", error: err.message });
  }
});

router.get("/contact", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  const user = req.session.user;
  res.render("contact-us", { user });
});

// Handle contact form submission
router.post("/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;

  try {
    const mailOptions = {
      from: email,
      to: process.env.SENDER_EMAIL,
      subject: ` Contact Us - ${subject}`,
      html: `
        <h4>Contact Message</h4>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong><br>${message}</p>
      `,
    };

    await transpoter.sendMail(mailOptions);
    res.render("contact-us", { success_msg: "Your message has been submitted successfully!" });
  } catch (error) {
    console.error(error);
    res.render("contact-us", { error_msg: "An error occurred while sending your message." });
  }
});

module.exports = router;