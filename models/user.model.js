const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: [/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores.']
  },

    name: {
        type: String,
        required:true,
    },

    lname: {
        type: String,
        required:true,
    },

    email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 120
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

    points: {
    type: Number,
    default: 0
    },

    referrer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", 
        default: null
    },

    weeklyReferrals: { type: Number, default: 0 },

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

    faucetClaims: {type: Number, default: 0},

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

const sss = mongoose.model("seemani", userSchema);

module.exports = sss;