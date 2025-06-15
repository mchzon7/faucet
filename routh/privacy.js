const express = require("express");
const router = express.Router();

router.get("/privacy-policy", (req, res) => {
  res.render("privacy");
});

router.get("/terms-of-service", (req, res) => {
  res.render("termsAndcondition");
});

module.exports=router;
