const mongoose = require('mongoose');
console.log('Testing MongoDB connection...');
console.log('MongoDB URI:', process.env.MONGODB_URI || 'mongodb://mongodb:27017/delivery-app');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/delivery-app')
  .then(() => {
    console.log('Successfully connected to MongoDB!');
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    console.error(err.stack);
    process.exit(1);
  });
