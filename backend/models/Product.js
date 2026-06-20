const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  price: { type: Number, required: true },
  unit: { type: String, default: 'per piece' },
  tax: { type: Number, default: 0 },
  description: { type: String },
  kdsAssigned: { type: Boolean, default: true } // Whether it goes to kitchen
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
