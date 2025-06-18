const axios = require('axios');

module.exports = async (req, res, next) => {
  const token = req.body['h-captcha-response'];
  if (!token) {
    return req.flash('error_msg', 'captcha is required');
  }

  try {
    const response = await axios.post(
      'https://hcaptcha.com/siteverify',
      new URLSearchParams({
        secret: process.env.hcaptcha,
        response: token,
        remoteip: req.ip,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    if (response.data.success) {
      next();
    } else {
      res.status(403).send('hCaptcha verification failed');
    }
  } catch (err) {
    res.status(500).send('Server error verifying hCaptcha');
  }
};