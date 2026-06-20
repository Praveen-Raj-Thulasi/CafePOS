const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Table = require('../models/Table');

router.post('/reset-demo', protect, async (req, res) => {
  try {
    // 1. Wipe all orders
    await OrderItem.deleteMany({});
    await Order.deleteMany({});
    
    // 2. Set all tables back to Vacant
    await Table.updateMany({}, { status: 'Vacant' });

    // 3. Emit global reset so frontends refresh
    const io = req.app.get('io');
    if (io) {
      io.emit('analytics_updated');
      io.emit('kds_refresh_needed');
      io.emit('table_state_changed'); 
    }

    res.json({ message: 'Demo Reset Successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
