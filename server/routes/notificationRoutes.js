import express from 'express';
import Notification from '../models/Notification.js';
import { isAuthenticated, isUserRole } from '../middleware/auth.js';

const router = express.Router();

// Get all notifications for current user
router.get('/', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📬 Fetching notifications for user: ${userId}`);

    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      read: false
    });

    console.log(`✅ Found ${notifications.length} notifications, ${unreadCount} unread`);
    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get unread count
router.get('/unread-count', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const count = await Notification.countDocuments({
      recipient: userId,
      read: false
    });

    res.json({ count });
  } catch (error) {
    console.error('❌ Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Mark notification as read
router.put('/:id/read', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    console.log(`✅ Notification ${notificationId} marked as read`);
    res.json(notification);
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark all notifications as read
router.put('/read-all', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true }
    );

    console.log(`✅ All notifications marked as read for user ${userId}`);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// Delete notification
router.delete('/:id', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    console.log(`✅ Notification ${notificationId} deleted`);
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export default router; // ✅ MAKE SURE THIS IS HERE!