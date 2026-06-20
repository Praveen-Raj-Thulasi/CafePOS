const User = require('../models/User');
const Order = require('../models/Order');

// @desc    Mock endpoint to simulate Round-Robin dispatch
// @route   POST /api/dispatch/assign
// @access  Public
const triggerDispatch = async (req, res) => {
  const { orderId, tableNumber } = req.body;
  
  try {
    const io = req.app.get('io');
    if (io) {
      // Simulate assigning to a mock servant via Round-Robin
      io.emit('delivery_assigned', { 
        orderId, 
        tableNumber: tableNumber || '102',
        servantName: 'Alex (Auto-Assigned)'
      });
    }

    res.json({ message: 'Dispatch triggered successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { triggerDispatch };
