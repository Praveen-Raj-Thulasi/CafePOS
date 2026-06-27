const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }, 
  qrSessionId: { type: String }, // Used to separate bills for different users scanning the same table QR
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'POSSession' },
  channel: { 
    type: String, 
    enum: ['QR', 'Cashier', 'Waitstaff'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Preparing', 'Ready', 'Served', 'Completed', 'Cancelled'], 
    default: 'Pending',
    index: true
  },
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'PendingVerification', 'Paid'],
    default: 'Unpaid'
  },
  paymentMethod: {
    type: String,
    enum: ['Online', 'Cashier', 'Servant', 'None'],
    default: 'None'
  },
  subtotal: { type: Number, required: true, default: 0 },
  tax: { type: Number, required: true, default: 0 },
  discount: { type: Number, required: true, default: 0 },
  couponCode: { type: String },
  total: { type: Number, required: true, default: 0 },
  orderNumber: { type: String, required: true, unique: true },
  estimatedWaitTime: { type: Number },
  estimatedCompletionTime: { type: Date },
  actualCompletionTime: { type: Date }
}, { timestamps: true });

// Compound indexes for fast dashboard analytics and kitchen queries
orderSchema.index({ status: 1, updatedAt: -1 });
orderSchema.index({ table: 1, status: 1 });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
