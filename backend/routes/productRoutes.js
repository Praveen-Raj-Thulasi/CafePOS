const express = require('express');
const router = express.Router();
const { getProducts, createProduct, updateProduct, deleteProduct, getProductAlternatives } = require('../controllers/productController');
const { protect, admin } = require('../middleware/auth');

router.route('/')
  .get(getProducts)
  .post(protect, admin, createProduct);

router.route('/alternatives/:productId')
  .get(getProductAlternatives);

router.route('/:id')
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

module.exports = router;
