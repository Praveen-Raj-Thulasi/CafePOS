const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const OrderEvent = require('../models/OrderEvent');
const Table = require('../models/Table');

const generateOrderNumber = () => {
  return 'ORD-' + Math.floor(10000 + Math.random() * 90000);
};

const createOrder = async (req, res) => {
  const { tableId, items, channel, customerId, actorId } = req.body;

  try {
    let subtotal = 0;
    let tax = 0;
    
    items.forEach(item => {
      const lineTotal = item.unitPrice * item.quantity;
      subtotal += lineTotal;
      tax += lineTotal * (item.taxRate || 0);
    });

    const total = subtotal + tax;

    const order = await Order.create({
      table: tableId,
      customer: customerId,
      channel: channel || 'Cashier',
      subtotal,
      tax,
      total,
      status: 'Pending',
      orderNumber: generateOrderNumber()
    });

    const orderItemsToInsert = items.map(item => ({
      order: order._id,
      product: item.product || item._id, // Handle different frontend mappings
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      kdsStatus: item.kdsAssigned ? 'ToCook' : 'NotRequired'
    }));

    await OrderItem.insertMany(orderItemsToInsert);

    // Update Table Status to Active (Green)
    const table = await Table.findById(tableId);
    if (table && table.status === 'Vacant') {
      table.status = 'Active';
      await table.save();
    }

    // Emit Real-Time Socket Events
    const io = req.app.get('io');
    if (io) {
      io.emit('table_state_changed', { tableId: table._id, status: 'Active' });
      io.emit('order_created', { orderNumber: order.orderNumber, tableId });
      io.emit('kds_refresh_needed');
      io.emit('analytics_updated');
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('table');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  const { status } = req.body; // Pending, Preparing, Ready, Served, Completed
  try {
    const order = await Order.findById(req.params.id).populate('table');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = status;
    await order.save();

    const io = req.app.get('io');
    if (io) {
      if (status === 'Ready') {
        io.emit('kitchen_ready', { orderId: order.orderNumber, tableNumber: order.table?.tableNumber, _id: order._id });
      }
      if (status === 'Served') {
        io.emit('order_served', { orderId: order.orderNumber, _id: order._id, tableNumber: order.table?.tableNumber });
      }
      if (status === 'Completed') {
        if (order.table) {
          const table = await Table.findById(order.table._id);
          table.status = 'Vacant';
          await table.save();
          io.emit('table_state_changed', { tableId: table._id, status: 'Vacant' });
        }
        io.emit('analytics_updated');
      }
      io.emit('kds_refresh_needed');
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createOrder, getOrders, updateOrderStatus };
