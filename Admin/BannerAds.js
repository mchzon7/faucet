// routes/admin-banner.js
const express = require("express");
const router = express.Router();
const BannerAd = require("../models/Banner.model");
const isAdmin = require("./isAdmin");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// 1. Configure where to save uploaded banner images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "public/uploads/banners/";
    // Automatically create the directory structure if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Save files with a unique timestamp to prevent overriding files with identical names
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "banner-" + uniqueSuffix + path.extname(file.originalname));
  }
});

// 2. Initialize upload middleware layer
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Ensure only valid image assets are uploaded
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  }
});

// GET banner ad management page
router.get("/admin/banner-ads", isAdmin, async (req, res) => {
  try {
    const ads = await BannerAd.find().sort({ createdAt: -1 });
    res.render("AdminBanner", { ads, appName: process.env.APP_NAME });
  } catch (err) {
    res.status(500).send("Server error fetching ads");
  }
});

// POST create a new banner ad (Handles single file upload linked to the name field "imageFile")
router.post("/admin/banner-ads", isAdmin, upload.single("imageFile"), async (req, res) => {
  try {
    const { targetUrl } = req.body;
    
    // Fallback security check if user forgets to attach a file
    if (!req.file) {
      return res.status(400).send("Please select and upload a valid banner image file.");
    }

    // Convert local file system path into a usable web URL path (/uploads/banners/...)
    const imageUrl = `/uploads/banners/${req.file.filename}`;

    // Create the record in MongoDB
    await BannerAd.create({ imageUrl, targetUrl });
    res.redirect("/admin/banner-ads");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving banner advertisement");
  }
});

// Track Clicks
router.get("/ad/click/:id", async (req, res) => {
  try {
    const ad = await BannerAd.findById(req.params.id);
    if (ad) {
      ad.clicks += 1;
      await ad.save();
      return res.redirect(ad.targetUrl); 
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