const mongoose = require('mongoose');

const posSessionSchema = new mongoose.Schema({
  sessionNumber: { type: String, required: true, unique: true },
  status: { type: String, enum: ['Open', 'Closed'], default: 'Open' },
  openedAt: { type: Date, required: true, default: Date.now },
  closedAt: { type: Date },
  openedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  startingCash: { type: Number, required: true, default: 0 },
  
  // These are calculated and saved at closing time
  actualEndingCash: { type: Number, default: 0 },
  expectedEndingCash: { type: Number, default: 0 },
  
  metricsSnapshot: {
    totalRevenue: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    cashPayments: { type: Number, default: 0 },
    cardPayments: { type: Number, default: 0 },
    upiPayments: { type: Number, default: 0 }
  }
}, { timestamps: true });

const POSSession = mongoose.model('POSSession', posSessionSchema);
module.exports = POSSession;
