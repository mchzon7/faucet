require('dotenv').config();
const mongoose = require('mongoose');
mongoose.set('strictQuery', true);
mongoose.set('sanitizeFilter', true);

async function connectDB() {
  const uri = process.env.MONGODB_URI;
    

  if (typeof uri !== 'string' || uri.trim().length === 0) {
    throw new Error('MongoDB connection string is missing. Set MONGODB_URI in your .env file.');
  }

  await mongoose.connect(uri, {
    autoIndex: process.env.NODE_ENV !== 'production',
    serverSelectionTimeoutMS: 10000
  });

  console.log('Connected to MongoDB');
}

module.exports = connectDB;
