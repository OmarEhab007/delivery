const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const analyticsController = require('../controllers/reporting/analyticsController');

const router = express.Router();

router.use(protect);
router.use(restrictTo('Merchant', 'Admin'));

router.get('/kpis', analyticsController.getKpis);
router.get('/lanes', analyticsController.getLanePerformanceReport);

module.exports = router;
