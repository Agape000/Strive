const Order = require('../models/order');
const OrderItem = require('../models/orderItem');
const Product = require('../models/product');
const Notification = require('../models/notification');
const ErrorResponse = require('../utils/errorResponse');


exports.createOrder = async (req, res, next) => {
  try {
    const { items, delivery_address, city, country } = req.body;

    // Calculating the total amount and validate products
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of items) {
      const product = await Product.findById(item.product_id);
      if (!product) {
        return next(new ErrorResponse(`Product not found with id of ${item.product_id}`, 404));
      }
      if (product.stock_quantity < item.quantity) {
        return next(new ErrorResponse(`Not enough stock for product ${product.product_name}`, 400));
      }
      
      totalAmount += product.price * item.quantity;
      orderItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: product.price
      });
    }

    // Create order
    const order = await Order.create({
      user_id: req.user.id,
      delivery_address,
      city,
      country,
      postal_code,
      total_amount: totalAmount
    });
    const user = await User.findById(req.user.id);

    const orderEmail = emailTemplates.orderConfirmation(
      `${user.firstname} ${user.lastname}`,
      order._id,
      order.total_amount
    );
    
    await sendEmail({
      email: user.email,
      subject: orderEmail.subject,
      html: orderEmail.html
    });
    
    // order items and upadte product quantities
    for (const item of orderItems) {
      await OrderItem.create({
        order_id: order._id,
        ...item
      });

      await Product.findByIdAndUpdate(item.product_id, {
        $inc: { stock_quantity: -item.quantity }
      });
    }

    // notification for admin
    await Notification.create({
      admin_id: null, 
      type: 'order_placed',
      title: 'New Order Placed',
      message: `New order #${order._id} has been placed by ${req.user.email}`,
      related_order_id: order._id
    });

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (err) {
    next(err);
  }
};


exports.getOrders = async (req, res, next) => {
  try {
    let query;
    
    if (req.user.role === 'admin') {
      query = Order.find().populate('user_id', 'email firstname lastname');
    } else {
      query = Order.find({ user_id: req.user.id });
    }

    const orders = await query.sort('-order_date');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    next(err);
  }
};


exports.getOrder = async (req, res, next) => {
  try {
    let order = await Order.findById(req.params.id);
    
    if (!order) {
      return next(new ErrorResponse(`Order not found with id of ${req.params.id}`, 404));
    }

    // Making  sure that user is order owner or admin
    if (order.user_id.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse(`Not authorized to access this order`, 401));
    }

    // Populating order items with product details
    const orderItems = await OrderItem.find({ order_id: order._id }).populate('product_id', 'product_name images');

    order = order.toObject();
    order.items = orderItems;

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    next(err);
  }
};


exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    let order = await Order.findById(req.params.id);
    
    if (!order) {
      return next(new ErrorResponse(`Order not found with id of ${req.params.id}`, 404));
    }

    order.status = status;
    await order.save();

    // Create notification for user
    await Notification.create({
      user_id: order.user_id,
      type: 'order_placed',
      title: 'Order Status Updated',
      message: `Your order #${order._id} status has been updated to ${status}`,
      related_order_id: order._id
    });

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    next(err);
  }
};