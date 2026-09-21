const mongoose = require('mongoose');

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
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 120
  },
  balances: {
    tokens: {
      type: Number,
      default: 0,
      min: 0
    },
    cash: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  stats: {
    totalClaims: {
      type: Number,
      default: 0,
      min: 0
    },
    totalEarned: {
      type: Number,
      default: 0,
      min: 0
    },
    offerwallsCompleted: {
      type: Number,
      default: 0,
      min: 0
    },
    shortlinksCompleted: {
      type: Number,
      default: 0,
      min: 0
    },
    microTasksCompleted: {
      type: Number,
      default: 0,
      min: 0
    },
    lastClaimAt: {
      type: Date,
      default: null
    }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Homepagee', userSchema);
