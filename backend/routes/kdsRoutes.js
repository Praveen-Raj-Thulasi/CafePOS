const express = require('express');
const router = express.Router();
const { getTickets, updateTicketStatus } = require('../controllers/kdsController');
const { protect } = require('../middleware/auth');

router.route('/tickets')
  .get(getTickets); // Typically protected, open for demo

router.route('/tickets/:id/status')
  .put(updateTicketStatus);

module.exports = router;
