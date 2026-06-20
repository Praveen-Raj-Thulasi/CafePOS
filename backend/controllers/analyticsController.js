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

    const rawOrders = await Order.find(query)
      .populate('table', 'tableNumber')
      .sort({ updatedAt: -1 })
      .lean(); // Use lean to freely attach items

    const orderIds = rawOrders.map(o => o._id);
    const OrderItem = require('../models/OrderItem');
    const orderItems = await OrderItem.find({ order: { $in: orderIds } }).populate('product', 'name').lean();

    // Attach items to orders
    rawOrders.forEach(order => {
      order.items = orderItems.filter(item => item.order.toString() === order._id.toString());
    });

    // Group by Date string (YYYY-MM-DD)
    const groupedByDate = {};

    rawOrders.forEach(order => {
      const dateStr = new Date(order.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      if (!groupedByDate[dateStr]) {
        groupedByDate[dateStr] = {
          date: dateStr,
          totalRevenue: 0,
          totalOrders: 0,
          orders: []
        };
      }
      groupedByDate[dateStr].totalRevenue += order.total;
      groupedByDate[dateStr].totalOrders += 1;
      groupedByDate[dateStr].orders.push(order);
    });

    // Convert object to array sorted by date descending
    const dateWiseData = Object.values(groupedByDate).sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      dateWiseData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAnalytics, getReportData };
