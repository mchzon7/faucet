const express = require("express");
const router = express.Router();

// Route to track the link before redirecting
router.get("/", (req, res) => {
  const {url, linkId} = req.query;
  if (!req.session.user) {
    res.redirect("/login");
  }

  if (!url || !linkId) {
    return res.status(400).send("Invalid request.");
  }

  res.render("track", {url, linkId});
});

module.exports = router;
