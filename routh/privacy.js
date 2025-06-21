const express = require("express");
const router = express.Router();

router.get("/privacy-policy", (req, res) => {
  res.render("privacy");
});

router.get("/terms-of-service", (req, res) => {
  res.render("termsAndcondition");
});

router.get("/ads", (req, res)=> {
  res.render("ads.ejs");
});

router.get("/ads2", (req, res)=> {
  res.render("ads1.ejs");
})

module.exports=router;
