const db = require('./utils/db');

// Check if MongoDB supports transactions
db.supportsTransactions().then(supported => {
  if (supported) {
    logger.info('MongoDB transactions are supported and enabled.');
  } else {
    logger.warn('MongoDB transactions are not supported or disabled by configuration. Operating in fallback mode.');
  }
}); 