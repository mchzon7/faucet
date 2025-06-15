const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true},

    name: {
        type: String,
        required:true,
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    otp: String,

    otpExpires: Date,

    isVerified:{type: Boolean, default: false},

    isBlocked:{type: Boolean, default: false},

    password: {
        type: String,
        required:true
    },

    resetPassword: String,

    resetPasswordExpAt: Date,

    walletAddress: {
        type: String,
        required:false
    },

    balance: {
        type: Number,
        default: 0
    },

    referrer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", 
        default: null
    },

    referralCount: { type: Number,default:0},

    clickedLinks: {
        type: [String],
        default:[]
    },

    visitedLinks: {
        type: [String], default: []
    },
    progress: {type: Number, default: 0},

    totalEarned: {type: Number, default: 0},

    totalRefEarned: {type: Number, default: 0},

    level: {type: Number, default: 1},

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
    timestamps:true
}
);

const sss = mongoose.model("seeman", userSchema);

module.exports = sss;