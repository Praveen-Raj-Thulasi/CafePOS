const express = require('express');
const router = express.Router();
const { getTableBill, settleBill, claimPayment, rejectPayment, getPendingVerifications, sendReceiptEmail } = require('../controllers/paymentController');

// Both routes are public so the Customer QR App can access them
router.get('/pending', getPendingVerifications);
router.get('/bill/:tableId', getTableBill);
router.post('/settle', settleBill);
router.post('/claim', claimPayment);
router.post('/reject', rejectPayment);
router.post('/receipt/email', sendReceiptEmail);

module.exports = router;
