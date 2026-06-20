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

    // DYNAMIC PRIORITY MATRIX ALGORITHM
    const sortedTickets = ordersWithItems.map(order => {
      let score = 0;
      if (order.channel === 'Waitstaff') score += 30;
      if (order.channel === 'Cashier') score += 20;
      if (order.channel === 'QR') score += 10;

      const minutesWaiting = Math.floor((Date.now() - new Date(order.createdAt)) / 60000);
      score += minutesWaiting;

      return { ...order, calculatedPriority: score, minutesWaiting };
    }).sort((a, b) => b.calculatedPriority - a.calculatedPriority);

    res.json(sortedTickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTickets };
