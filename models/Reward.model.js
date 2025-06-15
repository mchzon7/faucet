const mongoose = require("mongoose");

const rewardSchema = new mongoose.Schema({
    Rname: { type: String, unique: true},
    reward: {type: Number, Default: 0},
    visitreward: {type: Number, Default: 0},
    oofdreward: {type: Number, Default: 0},
    dailyofferreward: {type: Number, Default: 0},
    visit10sitereward: {type: Number, Default: 0},
    referralReward: {type: Number, Default: 0},
},
{
    timestamps: true
});

module.exports = mongoose.model("rewardd", rewardSchema);