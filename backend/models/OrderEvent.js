const mongoose = require('mongoose');

const orderEventSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  eventType: { 
    type: String, 
    enum: [
      'Order Created', 
      'Sent To Kitchen', 
      'Preparing', 
      'Ready', 
      'Assigned To Servant', 
      'Delivered', 
      'Paid', 
      'Cancelled'
    ],
    required: true
  },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Could be null if QR order
  metadata: { type: mongoose.Schema.Types.Mixed } // Flexible object for extra data
}, { timestamps: true });

const OrderEvent = mongoose.model('OrderEvent', orderEventSchema);
module.exports = OrderEvent;
