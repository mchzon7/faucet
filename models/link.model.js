const mongoose = require("mongoose");

const linkSchema = new mongoose.Schema({
    url: String,
    name: {type: String, required:true},
    description: { type: String, required: false},
    reward: {type: Number, default: 0.05},
},
{
    timestamps: true
});

let user = mongoose.model("link", linkSchema);

module.exports= user;