const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const transpoter = require("./nodemailer");
const { protect } = require("../middleware/auth");

// Setup your mailer (use your real SMTP credentials or a service like SendGrid)


// Send user verify account OTP
router.post("/send-otp",protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    req.flash('error_msg', 'please login')
    return res.redirect('/login')
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
  const userId = user;

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
      subject: "Your Verification OTP - Secure Access",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Account</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #eef2f5;">
                  
                  <tr>
                    <td style="background-color: #4f46e5; padding: 6px; text-align: center;"></td>
                  </tr>

                  <tr>
                    <td style="padding: 40px 35px; text-align: center;">
                      
                      <div style="margin-bottom: 20px; font-size: 40px; color: #f59e0b;">🔒</div>
                      
                      <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">Account Verification</h2>
                      
                      <p style="margin: 0 0 25px 0; color: #4b5563; font-size: 15px; line-height: 1.5;">
                        Hello, ${user.name || 'User'}. Use the verification code below to complete your security authentication.
                      </p>

                      <div style="background-color: #f9fafb; border: 1px dashed #d1d5db; border-radius: 6px; padding: 20px; margin-bottom: 25px; letter-spacing: 6px;">
                        <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; color: #111827; margin-left: 6px;">${otp}</span>
                      </div>

                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fffbeb; border-radius: 6px;">
                        <tr>
                          <td style="padding: 12px 15px; font-size: 13px; color: #b45309; line-height: 1.4; text-align: center;">
                            ⏱️ This code is highly confidential and will expire in <strong>10 minutes</strong>.
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 30px 0 0 0; color: #9ca3af; font-size: 13px; line-height: 1.5;">
                        If you did not request this verification, you can safely ignore this email or update your password security immediately.
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; font-size: 12px; color: #9ca3af;">&copy; ${new Date().getFullYear()} Fluwentcash. All rights reserved.</p>
                    </td>
                  </tr>
              </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    });
    
    req.flash("success_msg", "OTP has been sent to your email successfully. Please check your inbox or spam folder.");
    res.redirect("/verify");
  } catch (err) {
    res.status(500).json({ message: "Error sending OTP", error: err.message });
  }
});

// user Verify OTP
router.get("/verify",protect,async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    req.flash("error_msg", "please login");
    return res.redirect("/login");
  }
  res.render("../views/new/verify", {appName: process.env.APP_NAME, title: 'FluwentCash'});
});

router.post("/verify-otp",protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    req.flash("error_msg", "please login");
    return res.redirect("/login");
  }

  const { otp } = req.body;
  const userId = user;

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

router.get("/contact",protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.redirect("/login");
  res.render("../views/new/contact", { user, appName: process.env.APP_NAME, title: 'FluwentCash' });
});

// Handle contact form submission
 router.post("/contact",protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  if(!user) return res.redirect("/login");
  const { name, email, subject, message } = req.body;

  try {
    const mailOptions = {
      from: email,
      to: process.env.SENDER_EMAIL,
      subject:` Contact Us - ${subject}`,
      html:` 
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contact Us Message</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #eef2f5;">
                  
                  <tr>
                    <td style="background-color: #4f46e5; padding: 30px 40px; text-align: left;">
                      <h2 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600; letter-spacing: -0.5px;">New Contact Inquiry</h2>
                      <p style="margin: 5px 0 0 0; color: #c7d2fe; font-size: 14px;">You received a new message from your website contact form.</p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 40px;">
                      
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                        <tr>
                          <td width="25%" style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #4b5563; vertical-align: top;">Name:</td>
                          <td width="75%" style="padding: 10px 0; font-size: 15px; color: #1f2937; vertical-align: top;">${name}</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #4b5563; vertical-align: top;">Email:</td>
                          <td style="padding: 10px 0; font-size: 15px; color: #4f46e5; vertical-align: top;"><a href="mailto:${email}" style="color: #4f46e5; text-decoration: none;">${email}</a></td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #4b5563; vertical-align: top;">Subject:</td>
                          <td style="padding: 10px 0; font-size: 15px; font-weight: 600; color: #1f2937; vertical-align: top;">${subject}</td>
                        </tr>
                      </table>

                      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 0 0 30px 0;">

                      <div>
                        <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #4b5563; text-transform: uppercase; letter-spacing: 0.5px;">Message</h4>
                        <div style="background-color: #f9fafb; border-left: 4px solid #4f46e5; padding: 20px; border-radius: 4px;">
                          <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #374151; white-space: pre-line;">${message}</p>
                        </div>
                      </div>

                    </td>
                  </tr>

                  <tr>
                    <td style="background-color: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; font-size: 12px; color: #9ca3af;">This email was automatically generated by your website's system backend.</p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };
 await transpoter.sendMail(mailOptions);
    res.render("../views/new/contact", {success_msg: "Your message has been submitted successfully!", user, appName: process.env.APP_NAME, title: 'FluwentCash' });
  } catch (error) {
    console.error(error);
    res.render("../views/new/contact", { error_msg: "An error occurred while sending your message.", user, appName: process.env.APP_NAME, title: 'FluwentCash' });
  }
});

module.exports = router;