const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  cardnum: {
    type: String,
    required: true,
    default: '$1'
  },
  redemption: {
    type: Number,
    required: true,
    min: 1
  },
  remaining: {
    type: Number,
    required: true,
    min: 0
  },
  pointsRequired: {
    type: Number,
    required: true,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Generate unique card number
cardSchema.pre('save', function(next) {
  if (!this.cardNumber) {
    this.cardNumber = 'CRD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  }
  if (!this.displayAmount) {
    this.displayAmount = `$${this.amount}`;
  }
  this.remainingRedemptions = this.totalRedemptions;
  next();
});

// Check if card is available for redemption
cardSchema.methods.isAvailable = function() {
  return this.isActive && this.remainingRedemptions > 0;
};

// Check if card has expired
cardSchema.methods.isExpired = function() {
  return this.expiresAt && new Date() > this.expiresAt;
};

module.exports = mongoose.model('Ccard', cardSchema);