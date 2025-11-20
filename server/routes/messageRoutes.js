// routes/messageRoutes.js - COMPLETE FIXED VERSION
import express from 'express';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';

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
// GET CONVERSATION - ✅ AUTO-MARK AS READ (ADD THIS!)
// ============================================
router.get('/conversation', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log('📨 GET /conversation called:', { userId, userRole });

    let conversationQuery;
    
    if (userRole === 'case_manager' || userRole === 'admin') {
      const { userId: targetUserId } = req.query;
      
      console.log('🔍 Case manager requesting conversation with user:', targetUserId);
      
      if (!targetUserId) {
        return res.status(400).json({ 
          success: false, 
          message: 'userId query parameter required for case managers' 
        });
      }

      const verification = await verifyCaseManagerAssignment(targetUserId, userId);
      if (!verification.valid) {
        console.error('❌ Case manager not authorized:', verification.error);
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
          message: 'No case manager assigned',
          noAssignment: true
        });
      }
      
      const caseManagerId = userDoc.assignedCaseManager.toString();
      conversationQuery = { 
        userId: userId, 
        caseManagerId: caseManagerId 
      };
    }

    console.log('🔍 Looking for conversation:', conversationQuery);

    const conversationId = [
      conversationQuery.userId.toString(), 
      conversationQuery.caseManagerId.toString()
    ].sort().join('_');
    
    let conversation = await Conversation.findOne(conversationQuery);
    
    if (!conversation) {
      console.log('📝 Creating new conversation');
      conversation = await Conversation.create({
        ...conversationQuery,
        lastMessage: '',
        lastMessageTime: new Date()
      });
    }

    console.log('✅ Conversation found/created:', conversation._id);

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(100);

    console.log(`✅ Found ${messages.length} messages`);

    const unreadMessages = messages.filter(
      msg => msg.receiverId.toString() === userId && !msg.isRead
    );

    if (unreadMessages.length > 0) {
      console.log(`📖 Marking ${unreadMessages.length} messages as read`);
      
      await Message.updateMany(
        { 
          conversationId, 
          receiverId: userId, 
          isRead: false 
        },
        { isRead: true }
      );

      const userRoleType = userRole === 'case_manager' || userRole === 'admin' 
        ? 'caseManager' 
        : 'user';
      
      await Conversation.findOneAndUpdate(
        { _id: conversation._id },
        { [`unreadCount.${userRoleType}`]: 0 }
      );

      const io = req.app.get('io');
      if (io) {
        await calculateAndEmitUnreadCount(userId, io);
      }
      
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
    console.error('❌ Get conversation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch conversation',
      error: error.message 
    });
  }
});

// ============================================
// GET ALL CONVERSATIONS - ✅ FIXED NULL USERID ISSUE
// ============================================
router.get('/conversations', isAuthenticated, async (req, res) => {
  try {
    console.log('📨 GET /conversations called');
    console.log('User:', {
      id: req.user.id,
      role: req.user.role
    });
    
    const caseManagerId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'case_manager' && userRole !== 'admin') {
      console.log('❌ Access denied - not case manager/admin');
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only case managers can view all conversations.' 
      });
    }

    console.log('✅ Authorization passed');

    const assignedUsers = await User.find({
      assignedCaseManager: caseManagerId,
      role: 'user'
    }).select('_id username email fullName');

    console.log(`📋 Found ${assignedUsers.length} assigned users`);

    const existingConversations = await Conversation.find({ 
      caseManagerId,
      userId: { $ne: null, $exists: true },
      status: 'active'
    })
      .populate('userId', 'username email fullName')
      .sort({ lastMessageTime: -1 })
      .limit(50)
      .lean();

    console.log(`💬 Found ${existingConversations.length} existing conversations`);

    const validConversations = existingConversations.filter(conv => {
      if (!conv.userId || !conv.userId._id) {
        console.warn('⚠️ Skipping conversation with missing user:', conv._id);
        return false;
      }
      return true;
    });

    console.log(`✅ Valid conversations after filtering: ${validConversations.length}`);

    const existingUserIds = validConversations.map(
      conv => conv.userId._id.toString()
    );

    const usersWithoutConversations = assignedUsers.filter(
      user => !existingUserIds.includes(user._id.toString())
    );

    console.log(`👤 Found ${usersWithoutConversations.length} users without conversations`);

    const newConversations = usersWithoutConversations.map(user => ({
      _id: null,
      userId: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName
      },
      caseManagerId,
      lastMessage: 'No messages yet - Start the conversation',
      lastMessageTime: new Date(0),
      unreadCount: { user: 0, caseManager: 0 },
      status: 'active',
      isNew: true
    }));

    const allConversations = [
      ...validConversations.map(conv => ({
        ...conv,
        isNew: false
      })),
      ...newConversations
    ].sort((a, b) => {
      if (a.isNew && !b.isNew) return -1;
      if (!a.isNew && b.isNew) return 1;
      return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
    });

    console.log(`✅ Returning ${allConversations.length} total conversations`);

    res.json({ 
      success: true, 
      conversations: allConversations,
      stats: {
        total: allConversations.length,
        existing: validConversations.length,
        newAssignments: newConversations.length,
        skipped: existingConversations.length - validConversations.length
      }
    });
  } catch (error) {
    console.error('❌ Get conversations error:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch conversations',
      error: error.message
    });
  }
});

// ============================================
// 🔒 SEND MESSAGE - WITH AUTHORIZATION (FIXED)
// ============================================
router.post('/send', isAuthenticated, async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    const senderId = req.user.id;
    const senderRole = req.user.role;
    const isFromCaseManager = senderRole === 'case_manager' || senderRole === 'admin';

    console.log('📨 Send message called:', {
      senderId,
      receiverId,
      isFromCaseManager,
      textLength: text?.length
    });

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
        console.error('❌ Case manager not authorized:', verification.error);
        return res.status(403).json({
          success: false,
          message: 'You can only message users assigned to you'
        });
      }
    } else {
      const userDoc = await User.findById(senderId).select('assignedCaseManager');
      
      if (!userDoc || !userDoc.assignedCaseManager) {
        console.error('❌ User has no assigned case manager');
        return res.status(403).json({
          success: false,
          message: 'You can only message after a case manager is assigned to you',
          noAssignment: true
        });
      }
      
      const assignedCaseManagerId = userDoc.assignedCaseManager.toString();
      
      if (assignedCaseManagerId !== receiverId.toString()) {
        console.error('❌ User trying to message wrong case manager');
        return res.status(403).json({
          success: false,
          message: 'You can only message your assigned case manager'
        });
      }
    }

    // ✅ FIX: Properly determine userId and caseManagerId
    let userId, caseManagerId;
    
    if (isFromCaseManager) {
      userId = receiverId;
      caseManagerId = senderId;
    } else {
      userId = senderId;
      caseManagerId = receiverId;
    }

    console.log('✅ Conversation participants:', { userId, caseManagerId });

    const conversationId = [senderId.toString(), receiverId.toString()]
      .sort()
      .join('_');

    console.log('📝 Creating message with conversationId:', conversationId);

    // Create message
    const message = await Message.create({
      conversationId,
      senderId,
      receiverId,
      text: text.trim(),
      isFromCaseManager
    });

    console.log('✅ Message created:', message._id);

    // ✅ FIX: Update or create conversation with correct userId and caseManagerId
    try {
      console.log('🔄 Updating conversation...');
      
      const conversation = await Conversation.findOneAndUpdate(
        {
          userId: userId,
          caseManagerId: caseManagerId
        },
        {
          $set: {
            lastMessage: text.trim().substring(0, 100),
            lastMessageTime: new Date(),
            status: 'active'
          },
          $inc: {
            [isFromCaseManager ? 'unreadCount.user' : 'unreadCount.caseManager']: 1
          }
        },
        { 
          upsert: true, 
          new: true,
          setDefaultsOnInsert: true
        }
      );

      console.log('✅ Conversation updated:', conversation._id);
    } catch (convError) {
      console.error('❌ Conversation update error:', convError);
      // Don't fail message send if conversation update fails
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      try {
        if (io.emitNewMessage) {
          await io.emitNewMessage(receiverId, message);
        } else {
          io.to(receiverId.toString()).emit('newMessage', { 
            message, 
            conversationId 
          });
        }
        
        await calculateAndEmitUnreadCount(receiverId, io);
        console.log('✅ Socket events emitted');
      } catch (socketError) {
        console.error('⚠️ Socket error (non-critical):', socketError);
      }
    }

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
// MARK MESSAGES AS READ
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
    
    const io = req.app.get('io');
    if (io) {
      await calculateAndEmitUnreadCount(userId, io);
    }

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

// ============================================
// CLEANUP ROUTE - Remove Invalid Conversations (Run Once)
// ============================================
router.post('/conversations/cleanup', isAuthenticated, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    console.log('🧹 Starting conversation cleanup...');
    
    const invalidConversations = await Conversation.find({
      $or: [
        { userId: null },
        { userId: { $exists: false } }
      ]
    });
    
    console.log(`Found ${invalidConversations.length} invalid conversations`);
    
    const result = await Conversation.deleteMany({
      $or: [
        { userId: null },
        { userId: { $exists: false } }
      ]
    });
    
    console.log(`✅ Deleted ${result.deletedCount} invalid conversations`);
    
    res.json({
      success: true,
      message: 'Cleanup completed',
      deleted: result.deletedCount,
      details: invalidConversations.map(c => ({
        _id: c._id,
        caseManagerId: c.caseManagerId,
        lastMessage: c.lastMessage
      }))
    });
    
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    res.json({
      success: false,
      message: 'Cleanup failed',
      error: error.message
    });
  }
});

export default router;