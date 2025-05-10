const express = require('express');
const router = express.Router();
const {
  processPayment,
  getPayments
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .post(protect, processPayment)
  .get(protect, getPayments);

module.exports = router;