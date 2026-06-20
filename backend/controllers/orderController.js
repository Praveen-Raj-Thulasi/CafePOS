const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const OrderEvent = require('../models/OrderEvent');
const Table = require('../models/Table');

// Utility to generate a unique order number (e.g. ORD-12345)
const generateOrderNumber = () => {
  return 'ORD-' + Math.floor(10000 + Math.random() * 90000);
};

// @desc    Create a new order (Multi-Channel Ingestion)
// @route   POST /api/orders
// @access  Public (for QR) / Private (for Cashier/Waitstaff)
const createOrder = async (req, res) => {
  const { tableId, items, channel, customerId, actorId } = req.body;

  try {
    // 1. Calculate totals
    let subtotal = 0;
    let tax = 0;
    
    items.forEach(item => {
      const lineTotal = item.unitPrice * item.quantity;
      subtotal += lineTotal;
      tax += lineTotal * (item.taxRate || 0);
    });

    const total = subtotal + tax;

    // 2. Create the Order
    const order = await Order.create({
      table: tableId,
      customer: customerId,
      channel,
      subtotal,
      tax,
      total,
      orderNumber: generateOrderNumber()
    });

    // 3. Create Order Items
    const orderItemsToInsert = items.map(item => ({
      order: order._id,
      product: item.product,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      kdsStatus: item.kdsAssigned ? 'ToCook' : 'NotRequired'
    }));

    await OrderItem.insertMany(orderItemsToInsert);

    // 4. Log the Event
    await OrderEvent.create({
      order: order._id,
      eventType: 'Order Created',
      actor: actorId || null,
      metadata: { channel, itemCount: items.length }
    });

    // 5. Update Table Status to Active (Inverted State Engine)
    const table = await Table.findById(tableId);
    if (table && table.status === 'Vacant') {
      table.status = 'Active';
      await table.save();
    }

    // 6. Emit Real-Time Socket Events
    const io = req.app.get('io');
    if (io) {
      // Broadcast table state change
      io.emit('table_state_changed', { tableId: table._id, status: 'Active' });
      // Notify KDS of new tickets
      io.emit('new_kitchen_ticket', { orderNumber: order.orderNumber, tableId });
      // Notify Admin/Cashier
      io.emit('order_created', { orderNumber: order.orderNumber });
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get orders
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('table');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createOrder, getOrders };
