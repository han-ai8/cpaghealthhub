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
// GET CONVERSATION - ✅ AUTO-MARK AS READ
// ============================================
router.get('/conversation', isAuthenticated, async (req, res) => {
  try {
    console.log('═══════════════════════════════════');
    console.log('📡 GET /api/messages/conversation');
    const userId = req.user.id;
    const userRole = req.user.role;
    console.log('👤 User ID:', userId);
    console.log('🏷️ User Role:', userRole);

    let conversationQuery;
    
    if (userRole === 'case_manager' || userRole === 'admin') {
      const { userId: targetUserId } = req.query;
      console.log('🎯 Target User ID (from query):', targetUserId);
      
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
        console.log('❌ Authorization failed:', verification.error);
        return res.status(403).json({
          success: false,
          message: verification.error
        });
      }
      
      conversationQuery = { userId: targetUserId, caseManagerId: userId };
    } else {
      const userDoc = await User.findById(userId).select('assignedCaseManager');
      
      if (!userDoc || !userDoc.assignedCaseManager) {
        console.log('❌ No case manager assigned to user:', userId);
        return res.status(404).json({ 
          success: false, 
          message: 'No case manager assigned. You can only message after a case manager is assigned to you.',
          noAssignment: true
        });
      }
      
      const caseManagerId = userDoc.assignedCaseManager.toString();
      console.log('✅ Case Manager ID:', caseManagerId);
      
      conversationQuery = { 
        userId: userId, 
        caseManagerId: caseManagerId 
      };
    }

    console.log('🔍 Conversation Query:', conversationQuery);

    const conversationId = [
      conversationQuery.userId.toString(), 
      conversationQuery.caseManagerId.toString()
    ].sort().join('_');
    
    console.log('🆔 Generated Conversation ID:', conversationId);

    // Get or create conversation
    let conversation = await Conversation.findOne(conversationQuery);
    
    if (!conversation) {
      console.log('📝 Creating new conversation');
      conversation = await Conversation.create({
        ...conversationQuery,
        lastMessage: '',
        lastMessageTime: new Date()
      });
      console.log('✅ Conversation created:', conversation._id);
    } else {
      console.log('✅ Conversation found:', conversation._id);
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
      console.log(`📖 Auto-marking ${unreadMessages.length} messages as read`);
      
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

      console.log(`✅ Marked ${unreadMessages.length} messages as read`);
      
      // Update the messages array to reflect read status
      messages.forEach(msg => {
        if (msg.receiverId.toString() === userId) {
          msg.isRead = true;
        }
      });
    }

    console.log('📨 Messages found:', messages.length);
    console.log('═══════════════════════════════════');

    res.json({
      success: true,
      conversation,
      messages,
      conversationId,
      markedAsRead: unreadMessages.length
    });
  } catch (error) {
    console.error('❌ GET conversation error:', error);
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
    console.log('═══════════════════════════════════');
    console.log('📡 POST /api/messages/send');
    
    const { receiverId, text } = req.body;
    const senderId = req.user.id;
    const senderRole = req.user.role;
    const isFromCaseManager = senderRole === 'case_manager' || senderRole === 'admin';

    console.log('📤 Sender ID:', senderId);
    console.log('📥 Receiver ID:', receiverId);
    console.log('💬 Text:', text?.substring(0, 50) + '...');
    console.log('🏷️ Sender Role:', senderRole);

    if (!text || !receiverId) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        success: false, 
        message: 'Text and receiverId are required' 
      });
    }

    if (!text.trim()) {
      console.log('❌ Empty message');
      return res.status(400).json({ 
        success: false, 
        message: 'Message cannot be empty' 
      });
    }

    // Verify authorization
    if (isFromCaseManager) {
      const verification = await verifyCaseManagerAssignment(receiverId, senderId);
      if (!verification.valid) {
        console.log('❌ Case manager not authorized:', verification.error);
        return res.status(403).json({
          success: false,
          message: 'You can only message users assigned to you'
        });
      }
    } else {
      const userDoc = await User.findById(senderId).select('assignedCaseManager');
      
      if (!userDoc || !userDoc.assignedCaseManager) {
        console.log('❌ User has no assigned case manager');
        return res.status(403).json({
          success: false,
          message: 'You can only message after a case manager is assigned to you',
          noAssignment: true
        });
      }
      
      const assignedCaseManagerId = userDoc.assignedCaseManager.toString();
      
      if (assignedCaseManagerId !== receiverId.toString()) {
        console.log('❌ User trying to message non-assigned case manager');
        return res.status(403).json({
          success: false,
          message: 'You can only message your assigned case manager'
        });
      }
    }

    console.log('✅ Authorization passed - proceeding with message');

    const conversationId = [senderId.toString(), receiverId.toString()]
      .sort()
      .join('_');
    
    console.log('🆔 Conversation ID:', conversationId);

    // Create message
    const message = await Message.create({
      conversationId,
      senderId,
      receiverId,
      text: text.trim(),
      isFromCaseManager
    });

    console.log('✅ Message created:', message._id);

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

    console.log('✅ Conversation updated:', conversation._id);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      console.log('📡 Emitting socket event to room:', receiverId.toString());
      io.to(receiverId.toString()).emit('newMessage', { 
        message, 
        conversationId 
      });
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
    console.log('═══════════════════════════════════');
    console.log('📡 GET /api/messages/conversations');
    
    const caseManagerId = req.user.id;
    const userRole = req.user.role;

    console.log('👤 Case Manager ID:', caseManagerId);
    console.log('🏷️ Role:', userRole);

    if (userRole !== 'case_manager' && userRole !== 'admin') {
      console.log('❌ Access denied - not a case manager');
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

    console.log(`✅ Found ${assignedUsers.length} assigned users`);

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

    console.log(`✅ Total conversations: ${allConversations.length}`);
    console.log(`   - Existing: ${existingConversations.length}`);
    console.log(`   - New assignments: ${newConversations.length}`);
    console.log('═══════════════════════════════════');

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
    console.log('═══════════════════════════════════');
    console.log('📡 PUT /api/messages/read');
    
    const userId = req.user.id;
    const { conversationId } = req.body;

    console.log('👤 User ID:', userId);
    console.log('🆔 Conversation ID:', conversationId);

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

    console.log('✅ Marked', result.modifiedCount, 'messages as read');

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

    console.log('✅ Reset unread count for', userRole);
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