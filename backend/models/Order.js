const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }, 
  channel: { 
    type: String, 
    enum: ['QR', 'Cashier', 'Waitstaff'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Preparing', 'Ready', 'Served', 'Completed'], 
    default: 'Pending' 
  },
  subtotal: { type: Number, required: true, default: 0 },
  tax: { type: Number, required: true, default: 0 },
  discount: { type: Number, required: true, default: 0 },
  total: { type: Number, required: true, default: 0 },
  orderNumber: { type: String, required: true, unique: true }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
