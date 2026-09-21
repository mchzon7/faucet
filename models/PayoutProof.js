const mongoose = require('mongoose');

const payoutProofSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
    trim: true
  },
  method: {
    type: String,
    enum: ['FaucetPay', 'Paystack', 'Binance Pay', 'USDT'],
    required: true
  },
  paidAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PayoutProof', payoutProofSchema);
