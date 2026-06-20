const Order = require('../models/Order');
const Table = require('../models/Table');

const getAnalytics = async (req, res) => {
  try {
    const totalTables = await Table.countDocuments();
    
    const activeOrders = await Order.countDocuments({
      status: { $in: ['Pending', 'Preparing', 'Ready', 'Served'] }
    });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const completedOrders = await Order.find({
      status: 'Completed',
      updatedAt: { $gte: startOfDay }
    });

    const completedOrdersToday = completedOrders.length;
    const revenueToday = completedOrders.reduce((sum, order) => sum + order.total, 0);

    // Mock data for Charts (to match wireframe aesthetics immediately)
    const salesData = [
      { name: 'Mon', sales: 4000 },
      { name: 'Tue', sales: 3000 },
      { name: 'Wed', sales: 5000 },
      { name: 'Thu', sales: 4500 },
      { name: 'Fri', sales: 6000 },
      { name: 'Sat', sales: 7000 },
      { name: 'Sun', sales: 5500 },
    ];

    const popularItems = [
      { name: 'Espresso', value: 400, color: '#0088FE' },
      { name: 'Latte', value: 300, color: '#00C49F' },
      { name: 'Avocado Toast', value: 300, color: '#FFBB28' },
      { name: 'Croissant', value: 200, color: '#FF8042' },
    ];

    res.json({
      totalTables,
      activeOrders,
      completedOrdersToday,
      revenueToday,
      salesData,
      popularItems
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getReportData = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    let query = { status: 'Completed' };
    
    const now = new Date();
    
    if (type === 'daily') {
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      query.updatedAt = { $gte: startOfDay };
    } else if (type === 'weekly') {
      const startOfWeek = new Date(now.setDate(now.getDate() - 7));
      query.updatedAt = { $gte: startOfWeek };
    } else if (type === 'custom' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.updatedAt = { $gte: start, $lte: end };
    }

    const orders = await Order.find(query)
      .populate('table', 'tableNumber')
      .populate('items.product', 'name')
      .sort({ updatedAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAnalytics, getReportData };
