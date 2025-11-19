// routes/messageRoutes.js - ENHANCED with auto-read and chat widget visibility
import express from 'express';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// 🔒 HELPER: Verify Case Manager Assignment
// ============================================
async function verifyCaseManagerAssignment(userId, caseManagerId) {
  const user = await User.findById(userId).select('assignedCaseManager');
  
  if (!user) {
    return { valid: false, error: 'User not found' };
  }
  
  if (!user.assignedCaseManager) {
    return { valid: false, error: 'No case manager assigned to this user' };
  }
  
  if (user.assignedCaseManager.toString() !== caseManagerId.toString()) {
    return { valid: false, error: 'Case manager not assigned to this user' };
  }
  
  return { valid: true };
}

// ============================================
// 📊 HELPER: Calculate and Emit Unread Count
// ============================================
/**
 * Calculate total unread count for a user and emit via socket
 * @param {string} userId - The user ID to calculate unread count for
 * @param {object} io - Socket.io instance
 */
async function calculateAndEmitUnreadCount(userId, io) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const userRole = (user.role === 'case_manager' || user.role === 'admin') 
      ? 'caseManager' 
      : 'user';

    const conversations = await Conversation.find({
      [userRole === 'caseManager' ? 'caseManagerId' : 'userId']: userId
    });

    const totalUnread = conversations.reduce((sum, conv) => {
      return sum + (conv.unreadCount[userRole] || 0);
    }, 0);

    // Emit via socket using the helper function
    if (io && io.emitUnreadCountUpdate) {
      await io.emitUnreadCountUpdate(userId, totalUnread);
    }

    return totalUnread;
  } catch (error) {
    console.error('Error calculating unread count:', error);
    return 0;
  }
}

// ============================================
// GET CONVERSATION - ✅ AUTO-MARK AS READ
// ============================================
router.get('/conversation', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    

    let conversationQuery;
    
    if (userRole === 'case_manager' || userRole === 'admin') {
      const { userId: targetUserId } = req.query;
      
      
      if (!targetUserId) {
        console.log('❌ Missing userId parameter for case manager');
        return res.status(400).json({ 
          success: false, 
          message: 'userId query parameter required for case managers' 
        });
      }

      // Verify assignment
      const verification = await verifyCaseManagerAssignment(targetUserId, userId);
      if (!verification.valid) {
        console.error('❌ Case manager not authorized to access user conversation:', verification.error);
        return res.status(403).json({
          success: false,
          message: verification.error
        });
      }
      
      conversationQuery = { userId: targetUserId, caseManagerId: userId };
    } else {
      const userDoc = await User.findById(userId).select('assignedCaseManager');
      
      if (!userDoc || !userDoc.assignedCaseManager) {
        return res.status(404).json({ 
          success: false, 
          message: 'No case manager assigned. You can only message after a case manager is assigned to you.',
          noAssignment: true
        });
      }
      
      const caseManagerId = userDoc.assignedCaseManager.toString();
  
      
      conversationQuery = { 
        userId: userId, 
        caseManagerId: caseManagerId 
      };
    }


    const conversationId = [
      conversationQuery.userId.toString(), 
      conversationQuery.caseManagerId.toString()
    ].sort().join('_');
    
    // Get or create conversation
    let conversation = await Conversation.findOne(conversationQuery);
    
    if (!conversation) {
      conversation = await Conversation.create({
        ...conversationQuery,
        lastMessage: '',
        lastMessageTime: new Date()
      });
    } else {
    }

    // Get messages
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(100);

    // ✅ AUTO-MARK MESSAGES AS READ when conversation is opened
    const unreadMessages = messages.filter(
      msg => msg.receiverId.toString() === userId && !msg.isRead
    );

    if (unreadMessages.length > 0) {
      
      await Message.updateMany(
        { 
          conversationId, 
          receiverId: userId, 
          isRead: false 
        },
        { isRead: true }
      );

      // Reset unread count in conversation
      const userRoleType = userRole === 'case_manager' || userRole === 'admin' 
        ? 'caseManager' 
        : 'user';
      
      await Conversation.findOneAndUpdate(
        { _id: conversation._id },
        { [`unreadCount.${userRoleType}`]: 0 }
      );

      
      // ✅ NEW: Emit updated unread count after auto-marking as read
      const io = req.app.get('io');
      if (io) {
        await calculateAndEmitUnreadCount(userId, io);
      }
      
      // Update the messages array to reflect read status
      messages.forEach(msg => {
        if (msg.receiverId.toString() === userId) {
          msg.isRead = true;
        }
      });
    }

    res.json({
      success: true,
      conversation,
      messages,
      conversationId,
      markedAsRead: unreadMessages.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch conversation',
      error: error.message 
    });
  }
});

// ============================================
// 🔒 SEND MESSAGE - WITH AUTHORIZATION
// ============================================
router.post('/send', isAuthenticated, async (req, res) => {
  try {
    
    const { receiverId, text } = req.body;
    const senderId = req.user.id;
    const senderRole = req.user.role;
    const isFromCaseManager = senderRole === 'case_manager' || senderRole === 'admin';


    if (!text || !receiverId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Text and receiverId are required' 
      });
    }

    if (!text.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message cannot be empty' 
      });
    }

    // Verify authorization
    if (isFromCaseManager) {
      const verification = await verifyCaseManagerAssignment(receiverId, senderId);
      if (!verification.valid) {
        return res.status(403).json({
          success: false,
          message: 'You can only message users assigned to you'
        });
      }
    } else {
      const userDoc = await User.findById(senderId).select('assignedCaseManager');
      
      if (!userDoc || !userDoc.assignedCaseManager) {
        return res.status(403).json({
          success: false,
          message: 'You can only message after a case manager is assigned to you',
          noAssignment: true
        });
      }
      
      const assignedCaseManagerId = userDoc.assignedCaseManager.toString();
      
      if (assignedCaseManagerId !== receiverId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only message your assigned case manager'
        });
      }
    }


    const conversationId = [senderId.toString(), receiverId.toString()]
      .sort()
      .join('_');
    

    // Create message
    const message = await Message.create({
      conversationId,
      senderId,
      receiverId,
      text: text.trim(),
      isFromCaseManager
    });

    // Update or create conversation
    const conversation = await Conversation.findOneAndUpdate(
      {
        $or: [
          { userId: senderId, caseManagerId: receiverId },
          { userId: receiverId, caseManagerId: senderId }
        ]
      },
      {
        $set: {
          lastMessage: text.trim().substring(0, 100),
          lastMessageTime: new Date(),
          status: 'active' // Ensure conversation is active
        },
        $inc: {
          [isFromCaseManager ? 'unreadCount.user' : 'unreadCount.caseManager']: 1
        }
      },
      { upsert: true, new: true }
    );

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      
      // ✅ Emit new message event
      if (io.emitNewMessage) {
        await io.emitNewMessage(receiverId, message);
      } else {
        // Fallback for old socket structure
        io.to(receiverId.toString()).emit('newMessage', { 
          message, 
          conversationId 
        });
      }
      
      // ✅ NEW: Emit unread count update to receiver
      await calculateAndEmitUnreadCount(receiverId, io);
    }

    console.log('═══════════════════════════════════');

    res.status(201).json({ 
      success: true, 
      message 
    });
  } catch (error) {
    console.error('❌ Send message error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send message',
      error: error.message 
    });
  }
});

// ============================================
// GET ALL CONVERSATIONS - ✅ WITH NEWLY ASSIGNED USERS
// ============================================
router.get('/conversations', isAuthenticated, async (req, res) => {
  try {
    
    const caseManagerId = req.user.id;
    const userRole = req.user.role;


    if (userRole !== 'case_manager' && userRole !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only case managers can view all conversations.' 
      });
    }

    // ✅ Get all users assigned to this case manager
    const assignedUsers = await User.find({
      assignedCaseManager: caseManagerId,
      role: 'user'
    }).select('_id username email fullName');


    // Get existing conversations
    const existingConversations = await Conversation.find({ 
      caseManagerId,
      status: 'active'
    })
      .populate('userId', 'username email fullName')
      .sort({ lastMessageTime: -1 })
      .limit(50);

    const existingUserIds = existingConversations.map(
      conv => conv.userId._id.toString()
    );

    // ✅ Find users without conversations yet
    const usersWithoutConversations = assignedUsers.filter(
      user => !existingUserIds.includes(user._id.toString())
    );

    // ✅ Create placeholder conversations for newly assigned users
    const newConversations = usersWithoutConversations.map(user => ({
      _id: null,
      userId: user,
      caseManagerId,
      lastMessage: 'No messages yet',
      lastMessageTime: new Date(0), // Old date so it appears at bottom
      unreadCount: { user: 0, caseManager: 0 },
      status: 'active',
      isNew: true // Flag to indicate this is a new assignment
    }));

    // Combine and sort
    const allConversations = [
      ...existingConversations.map(conv => ({
        ...conv.toObject(),
        isNew: false
      })),
      ...newConversations
    ].sort((a, b) => {
      // Show new assignments at the top
      if (a.isNew && !b.isNew) return -1;
      if (!a.isNew && b.isNew) return 1;
      // Then sort by last message time
      return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
    });

    res.json({ 
      success: true, 
      conversations: allConversations,
      stats: {
        total: allConversations.length,
        existing: existingConversations.length,
        newAssignments: newConversations.length
      }
    });
  } catch (error) {
    console.error('❌ Get conversations error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch conversations',
      error: error.message 
    });
  }
});

// ============================================
// MARK MESSAGES AS READ (Manual)
// ============================================
router.put('/read', isAuthenticated, async (req, res) => {
  try {
    
    const userId = req.user.id;
    const { conversationId } = req.body;


    if (!conversationId) {
      return res.status(400).json({ 
        success: false, 
        message: 'conversationId is required' 
      });
    }

    const result = await Message.updateMany(
      { 
        conversationId, 
        receiverId: userId, 
        isRead: false 
      },
      { isRead: true }
    );

    const userRole = req.user.role === 'case_manager' || req.user.role === 'admin' 
      ? 'caseManager' 
      : 'user';
    
    await Conversation.findOneAndUpdate(
      {
        $or: [
          { userId, conversationId },
          { caseManagerId: userId, conversationId }
        ]
      },
      { [`unreadCount.${userRole}`]: 0 }
    );
    
    // ✅ NEW: Emit updated unread count after marking as read
    const io = req.app.get('io');
    if (io) {
      await calculateAndEmitUnreadCount(userId, io);
    }
    
    console.log('═══════════════════════════════════');

    res.json({ 
      success: true, 
      message: 'Messages marked as read',
      count: result.modifiedCount
    });
  } catch (error) {
    console.error('❌ Mark read error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark messages as read',
      error: error.message 
    });
  }
});

// ============================================
// GET UNREAD COUNT
// ============================================
router.get('/unread-count', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role === 'case_manager' || req.user.role === 'admin' 
      ? 'caseManager' 
      : 'user';

    const conversations = await Conversation.find({
      [userRole === 'caseManager' ? 'caseManagerId' : 'userId']: userId
    });

    const totalUnread = conversations.reduce((sum, conv) => {
      return sum + (conv.unreadCount[userRole] || 0);
    }, 0);

    res.json({ 
      success: true, 
      unreadCount: totalUnread 
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch unread count',
      error: error.message 
    });
  }
});

// ============================================
// CHECK IF MESSAGING IS AVAILABLE
// ============================================
router.get('/check-availability', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole === 'case_manager' || userRole === 'admin') {
      return res.json({
        success: true,
        available: true,
        role: userRole
      });
    }

    const user = await User.findById(userId)
      .select('assignedCaseManager')
      .populate('assignedCaseManager', 'username email');

    const hasAssignment = !!(user && user.assignedCaseManager);

    res.json({
      success: true,
      available: hasAssignment,
      caseManager: hasAssignment ? {
        id: user.assignedCaseManager._id,
        username: user.assignedCaseManager.username,
        email: user.assignedCaseManager.email
      } : null,
      message: hasAssignment 
        ? 'Messaging available' 
        : 'Wait for admin to assign a case manager before messaging'
    });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check messaging availability',
      error: error.message
    });
  }
});

export default router;