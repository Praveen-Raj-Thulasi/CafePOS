const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  tableNumber: { type: String, required: true },
  floor: { type: mongoose.Schema.Types.ObjectId, ref: 'Floor', required: true },
  seats: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Vacant', 'Active'], 
    default: 'Vacant' 
  }
}, { timestamps: true });

// Ensure table numbers are unique per floor
tableSchema.index({ tableNumber: 1, floor: 1 }, { unique: true });

const Table = mongoose.model('Table', tableSchema);
module.exports = Table;
