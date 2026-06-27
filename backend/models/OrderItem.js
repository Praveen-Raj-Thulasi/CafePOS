const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, default: 1 },
  unitPrice: { type: Number, required: true },
  kdsStatus: { 
    type: String, 
    enum: ['ToCook', 'Preparing', 'Completed', 'NotRequired'], 
    default: 'NotRequired' 
  },
  isAlternativeAccepted: { type: Boolean, default: false },
  waitSaved: { type: Number, default: 0 },
  priorityScore: { type: Number, default: 0 } // For the Dynamic KDS Priority Matrix
}, { timestamps: true });

// Indexes to speed up queries
orderItemSchema.index({ order: 1 });
orderItemSchema.index({ isAlternativeAccepted: 1 });
orderItemSchema.index({ kdsStatus: 1 });

const OrderItem = mongoose.model('OrderItem', orderItemSchema);
module.exports = OrderItem;
