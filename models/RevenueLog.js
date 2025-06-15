const mongoose = require("mongoose");

const revenueLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  transactionId: { type: String, required: true, unique: true },
  revenue: { type: Number, required: true },
  earnedAmount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

let rev = mongoose.model("revenueLog", revenueLogSchema);

module.export = rev;