import AdminNotification from "../models/AdminNotification.js";

export const getAdminNotifications = async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 8, 1), 30);

    const [notifications, unreadCount] = await Promise.all([
      AdminNotification.find().sort({ createdAt: -1 }).limit(limit),
      AdminNotification.countDocuments({ isRead: false })
    ]);

    return res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    return next(error);
  }
};

export const markAdminNotificationAsRead = async (req, res, next) => {
  try {
    const notification = await AdminNotification.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      },
      {
        new: true
      }
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found"
      });
    }

    return res.json(notification);
  } catch (error) {
    return next(error);
  }
};

export const markAllAdminNotificationsAsRead = async (req, res, next) => {
  try {
    await AdminNotification.updateMany(
      { isRead: false },
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      }
    );

    return res.json({
      message: "All notifications marked as read"
    });
  } catch (error) {
    return next(error);
  }
};
