const OrderItem = require('../models/OrderItem');
const Order = require('../models/Order');

// @desc    Get active KDS tickets sorted by Priority Matrix
// @route   GET /api/kds/tickets
// @access  Private
const getTickets = async (req, res) => {
  try {
    const activeItems = await OrderItem.find({
      kdsStatus: { $in: ['ToCook', 'Preparing'] }
    }).populate({
      path: 'order',
      select: 'orderNumber channel createdAt table',
      populate: { path: 'table', select: 'tableNumber' }
    }).populate('product', 'name');

    // DYNAMIC PRIORITY MATRIX ALGORITHM
    // 1. Channel Weight: Waitstaff=3, Cashier=2, QR=1
    // 2. Wait Time: Older orders get higher score
    
    const sortedTickets = activeItems.map(item => {
      let score = 0;
      if (item.order.channel === 'Waitstaff') score += 30;
      if (item.order.channel === 'Cashier') score += 20;
      if (item.order.channel === 'QR') score += 10;

      // Add wait time score (1 point per minute waiting)
      const minutesWaiting = Math.floor((Date.now() - new Date(item.createdAt)) / 60000);
      score += minutesWaiting;

      return { ...item._doc, calculatedPriority: score, minutesWaiting };
    }).sort((a, b) => b.calculatedPriority - a.calculatedPriority);

    res.json(sortedTickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update ticket status
// @route   PUT /api/kds/tickets/:id/status
// @access  Private
const updateTicketStatus = async (req, res) => {
  const { status } = req.body; // 'ToCook', 'Preparing', 'Completed'
  try {
    const item = await OrderItem.findById(req.params.id).populate('order', 'orderNumber');
    if (item) {
      item.kdsStatus = status;
      await item.save();

      const io = req.app.get('io');
      if (io) {
        // Emit global event for frontend to catch
        if (status === 'Completed') {
          io.emit('kitchen_ticket_completed', { orderId: item.order.orderNumber, itemId: item._id });
        }
        // Tell KDS screens to refresh
        io.emit('kds_refresh_needed');
      }

      res.json(item);
    } else {
      res.status(404).json({ message: 'Ticket not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTickets, updateTicketStatus };
