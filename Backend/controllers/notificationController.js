const Notification = require('../models/notification');
const ErrorResponse = require('../utils/errorResponse');


exports.getNotifications = async (req, res, next) => {
  try {
    let query;
    
    if (req.user.role === 'admin') {
      // Admin gets all notifications
      query = Notification.find({ 
        $or: [
          { admin_id: null },
          { user_id: req.user.id } 
        ]
      });
    } else {
      query = Notification.find({ user_id: req.user.id });
    }

    const notifications = await query.sort('-created_at');

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (err) {
    next(err);
  }
};


exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return next(new ErrorResponse(`Notification not found with id of ${req.params.id}`, 404));
    }

    // Checking if user owns the notification
    if ((notification.user_id && notification.user_id.toString() !== req.user.id) && 
        (notification.admin_id && notification.admin_id.toString() !== req.user.id)) {
      return next(new ErrorResponse(`Not authorized to update this notification`, 401));
    }

    notification.is_read = true;
    await notification.save();

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (err) {
    next(err);
  }
};