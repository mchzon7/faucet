const mongoose = require("mongoose");

const taskActionSchema = new mongoose.Schema({
  ip: String,
  lastClicked: { type: Date, default: Date.now, expires: 10 }
}); // Auto-delete after 24 hours

module.exports = mongoose.model("TaskAction", taskActionSchema);