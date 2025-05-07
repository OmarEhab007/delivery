const express = require('express');
const router = express.Router();
const { swaggerSpec } = require('../config/swagger');

// Export Swagger specification as JSON for use in other tools
router.get('/json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

module.exports = router; 