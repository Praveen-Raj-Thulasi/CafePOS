const express = require('express');
const router = express.Router();
const {
  getAllPromotions,
  createPromotion,
  togglePromotionStatus,
  deletePromotion
} = require('../controllers/promotionController');
const { protect, admin } = require('../middleware/auth');

router.route('/')
  .get(protect, admin, getAllPromotions)
  .post(protect, admin, createPromotion);

router.route('/:id')
  .put(protect, admin, togglePromotionStatus)
  .delete(protect, admin, deletePromotion);

module.exports = router;
