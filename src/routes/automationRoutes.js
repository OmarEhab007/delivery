const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const automationController = require('../controllers/automation/automationController');

const router = express.Router();

router.use(protect);
router.use(restrictTo('Merchant', 'Admin'));

router.post('/rules', automationController.createRule);
router.get('/rules', automationController.listRules);
router.patch('/rules/:id', automationController.updateRule);

module.exports = router;
