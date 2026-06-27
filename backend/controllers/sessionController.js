const POSSession = require('../models/POSSession');
const Order = require('../models/Order');

// Get active session
const getActiveSession = async (req, res) => {
  try {
    const session = await POSSession.findOne({ status: 'Open' }).populate('openedBy', 'name email');
    if (!session) {
      return res.status(404).json({ message: 'No active session found' });
    }
    
    // Calculate current running metrics
    const orders = await Order.find({ session: session._id, status: 'Completed' });
    
    let totalRevenue = 0;
    let cashPayments = 0;
    let cardPayments = 0;
    let upiPayments = 0;

    orders.forEach(order => {
      totalRevenue += order.total;
      if (order.paymentMethod === 'Cash' || order.paymentMethod === 'Cashier' || order.paymentMethod === 'Servant') {
        cashPayments += order.total;
      } else if (order.paymentMethod === 'Card') {
        cardPayments += order.total;
      } else if (order.paymentMethod === 'Online' || order.paymentMethod === 'UPI') {
        upiPayments += order.total;
      }
    });

    res.json({
      ...session.toObject(),
      currentMetrics: {
        totalRevenue,
        totalOrders: orders.length,
        cashPayments,
        cardPayments,
        upiPayments,
        expectedEndingCash: session.startingCash + cashPayments
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Open a new session
const openSession = async (req, res) => {
  try {
    const { startingCash } = req.body;
    
    // Check if one is already open
    const active = await POSSession.findOne({ status: 'Open' });
    if (active) {
      return res.status(400).json({ message: 'A session is already open. Close it first.' });
    }

    const sessionNumber = `SES-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    const newSession = await POSSession.create({
      sessionNumber,
      startingCash: startingCash || 0,
      openedBy: req.user?._id // Requires auth middleware
    });

    res.status(201).json(newSession);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Close current session
const closeSession = async (req, res) => {
  try {
    const { actualEndingCash } = req.body;
    
    const session = await POSSession.findOne({ status: 'Open' });
    if (!session) {
      return res.status(404).json({ message: 'No active session to close' });
    }

    // Calculate final metrics
    const orders = await Order.find({ session: session._id, status: 'Completed' });
    
    let totalRevenue = 0;
    let cashPayments = 0;
    let cardPayments = 0;
    let upiPayments = 0;

    orders.forEach(order => {
      totalRevenue += order.total;
      if (order.paymentMethod === 'Cash' || order.paymentMethod === 'Cashier' || order.paymentMethod === 'Servant') {
        cashPayments += order.total;
      } else if (order.paymentMethod === 'Card') {
        cardPayments += order.total;
      } else if (order.paymentMethod === 'Online' || order.paymentMethod === 'UPI') {
        upiPayments += order.total;
      }
    });

    const expectedEndingCash = session.startingCash + cashPayments;

    session.status = 'Closed';
    session.closedAt = new Date();
    session.closedBy = req.user?._id;
    session.actualEndingCash = actualEndingCash || 0;
    session.expectedEndingCash = expectedEndingCash;
    session.metricsSnapshot = {
      totalRevenue,
      totalOrders: orders.length,
      cashPayments,
      cardPayments,
      upiPayments
    };

    await session.save();

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get past sessions
const getPastSessions = async (req, res) => {
  try {
    const sessions = await POSSession.find({ status: 'Closed' })
      .sort({ closedAt: -1 })
      .populate('openedBy closedBy', 'name email');
      
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getActiveSession,
  openSession,
  closeSession,
  getPastSessions
};
