// routes/admin-banner.js
const express = require("express");
const router = express.Router();
const BannerAd = require("../models/Banner.model");
const isAdmin = require("./isAdmin");

// GET banner ad management page
router.get("/admin/banner-ads", isAdmin, async (req, res) => {
  const ads = await BannerAd.find().sort({ createdAt: -1 });
  res.render("AdminBanner", { ads });
});

// POST create a new banner ad
router.post("/admin/banner-ads", isAdmin, async (req, res) => {
  const { imageUrl, targetUrl } = req.body;
  await BannerAd.create({ imageUrl, targetUrl });
  res.redirect("/admin/banner-ads");
});
// Track Clicks
router.get("/ad/click/:id", async (req, res) => {
  try {
    const ad = await BannerAd.findById(req.params.id);
    if (ad) {
      ad.clicks += 1;
      await ad.save();
      return res.redirect(ad.targetUrl); // Redirect to the actual ad target
    }
    res.status(404).send("Ad not found");
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// DELETE banner ad
router.post("/admin/banner-ads/delete/:id", isAdmin, async (req, res) => {
  await BannerAd.findByIdAndDelete(req.params.id);
  res.redirect("/admin/banner-ads");
});

module.exports = router;