const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    ip: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['completed', 'reversed'],
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trancpx', transactionSchema);