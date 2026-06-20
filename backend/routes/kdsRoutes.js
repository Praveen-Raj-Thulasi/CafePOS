const express = require('express');
const router = express.Router();
const { getTickets } = require('../controllers/kdsController');
const { protect } = require('../middleware/auth');

router.route('/tickets')
  .get(getTickets);

module.exports = router;
