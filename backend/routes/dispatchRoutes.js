const express = require('express');
const router = express.Router();
const { triggerDispatch } = require('../controllers/dispatchController');

router.post('/assign', triggerDispatch);

module.exports = router;
