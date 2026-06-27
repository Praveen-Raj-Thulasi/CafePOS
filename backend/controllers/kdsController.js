const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');

const getTickets = async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ['Pending', 'Preparing'] }
    }).populate('table', 'tableNumber');

    // Fetch items for each order
    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const items = await OrderItem.find({ order: order._id }).populate('product', 'name');
      return { ...order._doc, items };
    }));

    // DYNAMIC PRIORITY MATRIX ALGORITHM (Wait Time + Max Cooking Time)
    const sortedTickets = ordersWithItems.map(order => {
      const minutesWaiting = Math.floor((Date.now() - new Date(order.createdAt)) / 60000);
      
      let maxCookingTime = 0;
      if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
          if (item.product && item.product.cookingTime > maxCookingTime) {
            maxCookingTime = item.product.cookingTime;
          }
        });
      }

      // Priority Score = Minutes Waiting + Estimated Max Cooking Time
      // Orders with high cooking times need to start earlier.
      // Orders waiting a long time need to be served quickly.
      let score = minutesWaiting + maxCookingTime;
      
      // Minor bumps for channel
      if (order.channel === 'Waitstaff') score += 5;
      if (order.channel === 'Cashier') score += 3;

      return { ...order, calculatedPriority: score, minutesWaiting, maxCookingTime };
    }).sort((a, b) => b.calculatedPriority - a.calculatedPriority);

    res.json(sortedTickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateItemStatus = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { kdsStatus } = req.body;

    const item = await OrderItem.findByIdAndUpdate(
      itemId,
      { kdsStatus },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ message: 'Order item not found' });
    }

    // Emit event to update KDS
    const io = req.app.get('io');
    if (io) {
      io.emit('kds_refresh_needed', { type: 'ITEM_UPDATED' });
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTickets, updateItemStatus };
