const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["withdrawal", "referral_bonus", "deposit"], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["pending", "completed","received", "failed"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Transaction", transactionSchema);