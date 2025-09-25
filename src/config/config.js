// Add useTransactions configuration option
module.exports = {
  // ... existing config ...

  // Database configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/delivery-app',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
    useTransactions: process.env.USE_MONGODB_TRANSACTIONS === 'true' || false,
  },

  // ... rest of existing config ...
};
