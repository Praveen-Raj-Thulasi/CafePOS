const express = require('express');
const router = express.Router();
const { getTickets, updateItemStatus } = require('../controllers/kdsController');
const { protect } = require('../middleware/auth');

router.route('/tickets')
  .get(getTickets);

router.route('/item/:itemId/status')
  .put(updateItemStatus);

module.exports = router;
