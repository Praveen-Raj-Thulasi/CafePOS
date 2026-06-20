const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['Order', 'Product'], required: true },
  targetProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  minQuantity: { type: Number, default: 0 },
  minOrderAmount: { type: Number, default: 0 },
  discountType: { type: String, enum: ['percent', 'flat'], required: true },
  discountValue: { type: Number, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Promotion = mongoose.model('Promotion', promotionSchema);
module.exports = Promotion;
