const express = require('express');
const router = express.Router();
const { getAnalytics, getReportData } = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/auth');

router.get('/', protect, getAnalytics);
router.get('/reports', protect, admin, getReportData);

module.exports = router;
