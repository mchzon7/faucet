const mongoose = require("mongoose");

const pagesSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    page1: {type: Boolean, default: false},
    page2: {type: Boolean, default: false},
    page3: {type: Boolean, default: false},
    page4: {type: Boolean, default: false},
    page5: {type: Boolean, default: false},
    page6: {type: Boolean, default: false},
    page7: {type: Boolean, default: false},
    page8: {type: Boolean, default: false},
    page9: {type: Boolean, default: false},
    page10: {type: Boolean, default: false},
},
{
    timestamps: true
});

module.exports = mongoose.model("pages", pagesSchema);