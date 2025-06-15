const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const transporter = require("../controllers/nodemailer"); // path to your mailer.js
const isAdmin = require("./isAdmin");

// Send email to all users
router.get("/sendmailusers", (req, res) => res.render("sendmailtousers"));
router.post("/mail/all", isAdmin, async (req, res) => {
  const { subject, message } = req.body;
  try {
    const users = await User.find({}, "email");
    const sendPromises = users.map(user => {
      return transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to: user.email,
        subject,
        html: `<p>${message}</p>`
      });
    });

    await Promise.all(sendPromises);
    req.flash("success_msg", "Emails sent to all users successfully.");
    return res.redirect("/sendmailusers");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error sending emails.");
  }
});

// Send email to a single user
router.post("/mail/single", isAdmin, async (req, res) => {
  const { email, subject, message } = req.body;
  try {
    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: email,
      subject,
      html: `<p>${message}</p>`
    });

    req.flash(`Email sent to ${email} successfully`);
    return res.redirect("/sendmailusers");
  } catch (err) {
    console.error(err);
    return res.render("sendmailtousers", { error_msg: "Error sending email." });
  }
});

module.exports = router;