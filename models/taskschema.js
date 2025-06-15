const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    faId: String,
    email: String,
    password: String,
    fa: String,
    amount: {type: Number, default: 0.05}
},
{
    timestamps:true
});

module.exports = mongoose.model("taskco", taskSchema);