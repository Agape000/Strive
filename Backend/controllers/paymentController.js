const Payment = require('../models/payment');
const Order = require('../models/order');
const Notification = require('../models/notification');
const ErrorResponse = require('../utils/errorResponse');


exports.processPayment = async (req, res, next) => {
  try {
    const { order_id, payment_method, transaction_id } = req.body;

    const order = await Order.findById(order_id);
    
    if (!order) {
      return next(new ErrorResponse(`Order not found with id of ${order_id}`, 404));
    }

    // Verifying if order belongs to user
    if (order.user_id.toString() !== req.user.id) {
      return next(new ErrorResponse(`Not authorized to pay for this order`, 401));
    }

    // Checking if order is already paid
    const existingPayment = await Payment.findOne({ order_id });
    if (existingPayment && existingPayment.payment_status === 'completed') {
      return next(new ErrorResponse(`Order has already been paid`, 400));
    }

    // Create payment
    const payment = await Payment.create({
      order_id,
      amount: order.total_amount,
      payment_method,
      transaction_id,
      payment_status: 'completed'
    });
    
    // Updating order status
    order.status = 'processing';
    await order.save();

    // Creating notifications
    await Notification.create({
      user_id: order.user_id,
      type: 'payment_received',
      title: 'Payment Successful',
      message: `Your payment of $${order.total_amount} for order #${order._id} was successful`,
      related_order_id: order._id
    });

    await Notification.create({
      admin_id: null, 
      type: 'payment_received',
      title: 'Payment Received',
      message: `Payment received for order #${order._id}`,
      related_order_id: order._id
    });
    const user = await User.findById(req.user.id);

    const paymentEmail = emailTemplates.paymentReceived(
      `${user.firstname} ${user.lastname}`,
      order._id,
      order.total_amount
    );
    
    await sendEmail({
      email: user.email,
      subject: paymentEmail.subject,
      html: paymentEmail.html
    });
    
    res.status(201).json({
      success: true,
      data: payment
    });
  } catch (err) {
    next(err);
  }
};


exports.getPayments = async (req, res, next) => {
  try {
    let query;
    
    if (req.user.role === 'admin') {
      query = Payment.find().populate('order_id');
    } else {
      const orders = await Order.find({ user_id: req.user.id }).select('_id');
      query = Payment.find({ order_id: { $in: orders } }).populate('order_id');
    }

    const payments = await query.sort('-payment_date');

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (err) {
    next(err);
  }
};