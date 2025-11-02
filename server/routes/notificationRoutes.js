import express from 'express';
import notificationService from '../services/notificationService.js';
import { isAuthenticated, isUserRole } from '../middleware/auth.js';

const router = express.Router();

// Get user's notifications
router.get('/', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit, skip, unreadOnly } = req.query;
    
    const result = await notificationService.getUserNotifications(userId, {
      limit: parseInt(limit) || 50,
      skip: parseInt(skip) || 0,
      unreadOnly: unreadOnly === 'true'
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching notifications:', error);
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
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Mark notification as read
router.put('/:id/read', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;
    
    const notification = await notificationService.markAsRead(notificationId, userId);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all as read
router.put('/mark-all-read', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const userId = req.user.id;
    await notificationService.markAllAsRead(userId);
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// Delete notification
router.delete('/:id', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;
    
    await notificationService.deleteNotification(notificationId, userId);
    
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Delete all notifications
router.delete('/', isAuthenticated, isUserRole, async (req, res) => {
  try {
    const userId = req.user.id;
    await notificationService.deleteAllNotifications(userId);
    
    res.json({ message: 'All notifications deleted' });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({ error: 'Failed to delete all notifications' });
  }
});

export default router;