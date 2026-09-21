const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const transporter = require("../controllers/nodemailer"); // path to your mailer.js
const isAdmin = require("./isAdmin");

// Send email to all users
router.get("/sendmailusers", isAdmin, (req, res) => res.render("sendmailtousers", {appName: process.env.APP_NAME}));
router.post("/mail/all", async (req, res) => {
  const { subject, message } = req.body;
  try {
    const users = await User.find({}, "email");
    const sendPromises = users.map(user => {
      return transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to: user.email,
        subject: ` Fluwentcash - ${subject}`,
        html: ` 
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
                      <h2 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600; letter-spacing: -0.5px;">Fluwentcash-Admin</h2>
                      <p style="margin: 5px 0 0 0; color: #c7d2fe; font-size: 14px;">New message from your website.</p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 40px;">
                      
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                        
                        
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
                      <p style="margin: 0; font-size: 12px; color: #9ca3af;">This email was from fluwentcash Admin.</p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
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
      subject: ` Fluwentcash - ${subject}`,
      html: ` 
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
                      <h2 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600; letter-spacing: -0.5px;">Fluwentcash-Admin</h2>
                      <p style="margin: 5px 0 0 0; color: #c7d2fe; font-size: 14px;">New message from your website.</p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 40px;">
                      
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                        
                        
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
                      <p style="margin: 0; font-size: 12px; color: #9ca3af;">This email was from fluwentcash Admin.</p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    req.flash(`Email sent to ${email} successfully`);
    return res.redirect("/sendmailusers");
  } catch (err) {
    console.error(err);
    return res.render("sendmailtousers", { error_msg: "Error sending email." });
  }
});

module.exports = router;