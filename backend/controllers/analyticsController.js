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

    // Fetch real data for Charts (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentOrders = await Order.find({
      status: 'Completed',
      updatedAt: { $gte: sevenDaysAgo }
    }).lean();

    const orderIds = recentOrders.map(o => o._id);
    const OrderItem = require('../models/OrderItem');
    const recentOrderItems = await OrderItem.find({ order: { $in: orderIds } }).populate('product').lean();

    // 1. Calculate salesData
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const salesMap = new Map();
    
    // Initialize last 7 days chronologically
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      salesMap.set(days[d.getDay()], 0);
    }

    recentOrders.forEach(order => {
      const dayName = days[new Date(order.updatedAt).getDay()];
      if (salesMap.has(dayName)) {
        salesMap.set(dayName, salesMap.get(dayName) + order.total);
      }
    });

    const salesData = Array.from(salesMap.entries()).map(([name, sales]) => ({ name, sales }));

    // 2. Calculate popularItems (Top 4)
    const productStats = {};
    recentOrderItems.forEach(item => {
      if (!item.product) return;
      const pName = item.product.name;
      if (!productStats[pName]) productStats[pName] = 0;
      productStats[pName] += item.quantity;
    });

    const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
    const popularItems = Object.keys(productStats)
      .map(name => ({ name, value: productStats[name] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4)
      .map((item, index) => ({ ...item, color: CHART_COLORS[index] }));

    // 3. AI & Kitchen Analytics
    const aiStats = {
      currentLoad: Math.min(100, Math.round((activeOrders / 30) * 100)), // Assuming 30 is 100% capacity
      suggestionsUsed: 0,
      averageWaitReduced: 0
    };

    const aiItems = await OrderItem.find({ isAlternativeAccepted: true });
    if (aiItems.length > 0) {
      aiStats.suggestionsUsed = aiItems.length;
      const totalWaitSaved = aiItems.reduce((sum, item) => sum + (item.waitSaved || 0), 0);
      aiStats.averageWaitReduced = Math.round(totalWaitSaved / aiItems.length);
    }

    res.json({
      totalTables,
      activeOrders,
      completedOrdersToday,
      revenueToday,
      salesData,
      popularItems,
      aiStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getReportData = async (req, res) => {
  try {
    const { type, startDate, endDate, channel, product } = req.query;
    let query = { status: 'Completed' };
    
    const now = new Date();
    
    if (type === 'daily') {
      const targetDate = req.query.date ? new Date(req.query.date) : new Date();
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      query.updatedAt = { $gte: startOfDay, $lte: endOfDay };
    } else if (type === 'weekly') {
      const startOfWeek = new Date(now.setDate(now.getDate() - 7));
      query.updatedAt = { $gte: startOfWeek };
    } else if (type === 'monthly') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      query.updatedAt = { $gte: startOfMonth };
    } else if (type === 'custom' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.updatedAt = { $gte: start, $lte: end };
    }

    if (channel && channel !== 'All') {
      query.channel = channel;
    }

    const rawOrders = await Order.find(query)
      .populate('table', 'tableNumber')
      .sort({ updatedAt: -1 })
      .lean();

    const orderIds = rawOrders.map(o => o._id);
    const OrderItem = require('../models/OrderItem');
    const orderItems = await OrderItem.find({ order: { $in: orderIds } }).populate({ path: 'product', populate: { path: 'category' } }).lean();

    // Attach items to orders
    rawOrders.forEach(order => {
      order.items = orderItems.filter(item => item.order.toString() === order._id.toString());
    });

    // Summary Metrics
    let totalRevenue = 0;
    const totalOrders = rawOrders.length;
    
    // Aggregation Maps
    const salesTrendMap = {};
    const topProductsMap = {};
    const topCategoriesMap = {};

    rawOrders.forEach(order => {
      totalRevenue += order.total;
      
      // Sales Trend Grouping (By Date if > 1 day, else by Hour)
      let trendKey = new Date(order.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (type === 'daily') {
        trendKey = new Date(order.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit' });
      }
      
      if (!salesTrendMap[trendKey]) salesTrendMap[trendKey] = { name: trendKey, revenue: 0, orders: 0 };
      salesTrendMap[trendKey].revenue += order.total;
      salesTrendMap[trendKey].orders += 1;

      // Top Products & Categories
      order.items.forEach(item => {
        if (!item.product) return;
        
        // Filter by product if specified
        if (product && product !== 'All' && item.product._id.toString() !== product) return;

        const prodName = item.product.name;
        const catName = item.product.category?.name || 'Uncategorized';
        const itemRevenue = item.unitPrice * item.quantity;

        if (!topProductsMap[prodName]) {
          topProductsMap[prodName] = { name: prodName, quantity: 0, revenue: 0 };
        }
        topProductsMap[prodName].quantity += item.quantity;
        topProductsMap[prodName].revenue += itemRevenue;

        if (!topCategoriesMap[catName]) {
          topCategoriesMap[catName] = { name: catName, revenue: 0, value: 0 };
        }
        topCategoriesMap[catName].revenue += itemRevenue;
        topCategoriesMap[catName].value += itemRevenue; // for pie chart
      });
    });

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const salesTrend = Object.values(salesTrendMap);
    
    const topProducts = Object.values(topProductsMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
      
    const topCategories = Object.values(topCategoriesMap)
      .sort((a, b) => b.revenue - a.revenue);

    const topOrders = [...rawOrders]
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map(o => ({
        id: o.orderNumber,
        date: new Date(o.updatedAt).toLocaleString(),
        total: o.total,
        channel: o.channel
      }));

    res.json({
      summary: {
        totalOrders,
        totalRevenue,
        averageOrderValue
      },
      salesTrend,
      topProducts,
      topCategories,
      topOrders,
      rawOrders // Keep raw orders for CSV export
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAnalytics, getReportData };
