const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountType: { type: String, enum: ['percent', 'flat'], required: true },
  discountValue: { type: Number, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon;
