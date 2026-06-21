const express = require('express');
const { getActiveSession, openSession, closeSession, getPastSessions } = require('../controllers/sessionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/active', protect, getActiveSession);
router.post('/open', protect, openSession);
router.post('/close', protect, closeSession);
router.get('/past', protect, getPastSessions);

module.exports = router;
