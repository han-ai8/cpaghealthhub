import Notification from '../models/Notification.js';

class NotificationService {
  constructor(io) {
    this.io = io;
  }

  async createNotification(data) {
    try {
      const notification = await Notification.create(data);
      await notification.populate('recipient', 'username email');

      if (this.io) {
        this.io.to(`user_${data.recipient}`).emit('new_notification', notification);
      }

      return notification;
    } catch (error) {
      throw error;
    }
  }

  async notifyNewAnnouncement(announcement, userIds) {
    const promises = userIds.map(userId =>
      this.createNotification({
        recipient: userId,
        type: 'announcement',
        title: 'New Announcement',
        message: `${announcement.title}`,
        relatedId: announcement._id,
        relatedModel: 'Announcement',
        link: `/user/home#announcement-${announcement._id}` 
      })
    );
    return Promise.all(promises);
  }

  async notifyNewPost(post, userIds) {
    const promises = userIds.map(userId =>
      this.createNotification({
        recipient: userId,
        type: 'post',
        title: 'New Post from CPAG',
        message: post.content.substring(0, 100) + '...',
        relatedId: post._id,
        relatedModel: 'Post',
        link: `/user/home#post-${post._id}`
      })
    );
    return Promise.all(promises);
  }

  async notifyNewClinic(clinic, userIds) {
    const promises = userIds.map(userId =>
      this.createNotification({
        recipient: userId,
        type: 'clinic_added',
        title: 'New Clinic Added',
        message: `${clinic.name} in ${clinic.municipality} is now available`,
        relatedId: clinic._id,
        relatedModel: 'Clinic',
        link: `/user/clinic-finder`
      })
    );
    return Promise.all(promises);
  }

  // ✅ UPDATED: Now includes comment ID in link for direct scrolling
  async notifyAdminReply(userId, content, commentBody, commentId, contentType = 'CommunityPost') {
    let link = `/user/community#comment-${commentId}`; // Default for community posts
    
    if (contentType === 'Announcement' || content.constructor?.modelName === 'Announcement') {
      link = `/user/home#announcement-${content._id}-comment-${commentId}`;
    } else if (contentType === 'Post' || content.constructor?.modelName === 'Post') {
      link = `/user/home#post-${content._id}-comment-${commentId}`;
    }

    const modelName = content.constructor?.modelName || contentType;
    
    return this.createNotification({
      recipient: userId,
      type: 'admin_reply',
      title: 'Admin Replied to Your Comment',
      message: `CPAG Admin replied to your comment: "${commentBody.substring(0, 50)}..."`,
      relatedId: content._id,
      relatedModel: modelName,
      link: link, // ✅ Direct link to specific comment
      metadata: {
        commentId: commentId // Store comment ID for reference
      }
    });
  }

  // ✅ UPDATED: Includes comment ID in link
  async notifyNewComment(postAuthorId, commenterName, post, commentId) {
    return this.createNotification({
      recipient: postAuthorId,
      type: 'comment',
      title: 'New Comment on Your Post',
      message: `${commenterName} commented on your post`,
      relatedId: post._id,
      relatedModel: 'CommunityPost',
      link: `/user/community#post-${post._id}-comment-${commentId}`, // ✅ Direct link to comment
      metadata: {
        commentId: commentId
      }
    });
  }

  async notifyNewArticle(article, userIds) {
    const promises = userIds.map(userId =>
      this.createNotification({
        recipient: userId,
        type: 'article',
        title: 'New Article Published',
        message: `${article.title}`,
        relatedId: article._id,
        relatedModel: 'Article',
        link: `/user/articles/${article._id}`
      })
    );
    return Promise.all(promises);
  }

  async notifySessionScheduled(userId, appointment, sessionNote) {
    return this.createNotification({
      recipient: userId,
      type: 'session_scheduled',
      title: 'Session Note Added',
      message: `Your case manager added notes for session #${sessionNote.sessionNumber}`,
      relatedId: appointment._id,
      relatedModel: 'Appointment',
      link: `/user/schedule`,
      metadata: {
        sessionNumber: sessionNote.sessionNumber,
        date: sessionNote.date
      }
    });
  }

  async notifyAppointmentConfirmed(userId, appointment) {
    return this.createNotification({
      recipient: userId,
      type: 'appointment_confirmed',
      title: 'Appointment Confirmed',
      message: `Your appointment for ${appointment.service} on ${appointment.date} has been confirmed`,
      relatedId: appointment._id,
      relatedModel: 'Appointment',
      link: `/user/schedule`
    });
  }

  async notifyAppointmentCancelled(userId, appointment, reason) {
    return this.createNotification({
      recipient: userId,
      type: 'appointment_cancelled',
      title: 'Appointment Status Update',
      message: reason || 'Your appointment has been cancelled',
      relatedId: appointment._id,
      relatedModel: 'Appointment',
      link: `/user/schedule`
    });
  }
}

export default NotificationService;