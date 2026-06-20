const mongoose = require('mongoose');

const floorSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
}, { timestamps: true });

const Floor = mongoose.model('Floor', floorSchema);
module.exports = Floor;
