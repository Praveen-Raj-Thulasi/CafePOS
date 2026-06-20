const express = require('express');
const router = express.Router();
const {
  getAllCoupons,
  createCoupon,
  toggleCouponStatus,
  deleteCoupon,
  validateCoupon
} = require('../controllers/couponController');
const { protect, admin } = require('../middleware/auth');

router.get('/validate', validateCoupon); // Public or Cashier (protect if needed)

// Admin only routes
router.route('/')
  .get(protect, admin, getAllCoupons)
  .post(protect, admin, createCoupon);

router.route('/:id')
  .put(protect, admin, toggleCouponStatus)
  .delete(protect, admin, deleteCoupon);

module.exports = router;
