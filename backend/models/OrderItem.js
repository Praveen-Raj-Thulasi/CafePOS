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
  priorityScore: { type: Number, default: 0 } // For the Dynamic KDS Priority Matrix
}, { timestamps: true });

const OrderItem = mongoose.model('OrderItem', orderItemSchema);
module.exports = OrderItem;
