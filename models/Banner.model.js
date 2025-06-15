const mongoose = require("mongoose");

const bannerAdSchema = new mongoose.Schema({
  imageUrl: String,
  targetUrl: String,
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  clicks: { type: Number, default: 0 } // Track number of clicks
});

module.exports = mongoose.model("bannerad", bannerAdSchema);