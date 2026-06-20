const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  color: { type: String, default: '#eef2f6' } // Default to the soft UI background color
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
