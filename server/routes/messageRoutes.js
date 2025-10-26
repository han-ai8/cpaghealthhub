import express from 'express';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Get conversation between user and their case manager
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
      // Case manager viewing a specific user's conversation
      const { userId: targetUserId } = req.query;
      console.log('🎯 Target User ID (from query):', targetUserId);
      
      if (!targetUserId) {
        console.log('❌ Missing userId parameter for case manager');
        return res.status(400).json({ 
          success: false, 
          message: 'userId query parameter required for case managers' 
        });
      }
      conversationQuery = { userId: targetUserId, caseManagerId: userId };
    } else {
      // Regular user viewing their conversation with case manager
      // Get the full user to check assignedCaseManager
      const User = (await import('../models/User.js')).default;
      const userDoc = await User.findById(userId);
      
      console.log('👤 User document:', userDoc?.username);
      console.log('📌 assignedCaseManager (raw):', userDoc?.assignedCaseManager);
      console.log('📌 Type:', typeof userDoc?.assignedCaseManager);
      
      if (!userDoc || !userDoc.assignedCaseManager) {
        console.log('❌ No case manager assigned to user:', userId);
        return res.status(404).json({ 
          success: false, 
          message: 'No case manager assigned',
          debug: {
            userId,
            hasCaseManager: !!userDoc?.assignedCaseManager
          }
        });
      }
      
      const caseManagerId = userDoc.assignedCaseManager.toString();
      console.log('✅ Case Manager ID (formatted):', caseManagerId);
      
      conversationQuery = { 
        userId: userId, 
        caseManagerId: caseManagerId 
      };
    }

    console.log('🔍 Conversation Query:', conversationQuery);

    // Generate conversation ID
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

    console.log('📨 Messages found:', messages.length);
    console.log('═══════════════════════════════════');

    res.json({
      success: true,
      conversation,
      messages,
      debug: {
        conversationId,
        messageCount: messages.length,
        userId: conversationQuery.userId.toString(),
        caseManagerId: conversationQuery.caseManagerId.toString()
      }
    });
  } catch (error) {
    console.error('❌ GET conversation error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch conversation',
      error: error.message 
    });
  }
});

// Send message
router.post('/send', isAuthenticated, async (req, res) => {
  try {
    console.log('═══════════════════════════════════');
    console.log('📡 POST /api/messages/send');
    
    const { receiverId, text } = req.body;
    const senderId = req.user.id;
    const isFromCaseManager = req.user.role === 'case_manager' || req.user.role === 'admin';

    console.log('📤 Sender ID:', senderId);
    console.log('📥 Receiver ID:', receiverId);
    console.log('💬 Text:', text?.substring(0, 50) + '...');
    console.log('🏷️ From Case Manager?', isFromCaseManager);

    // Validation
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

    // Generate conversation ID
    const conversationId = [senderId.toString(), receiverId.toString()]
      .sort()
      .join('_');
    
    console.log('🆔 Conversation ID:', conversationId);

    // Create message
    console.log('📝 Creating message...');
    const message = await Message.create({
      conversationId,
      senderId,
      receiverId,
      text: text.trim(),
      isFromCaseManager
    });

    console.log('✅ Message created:', message._id);

    // Update or create conversation
    console.log('📝 Updating conversation...');
    const conversation = await Conversation.findOneAndUpdate(
      {
        $or: [
          { userId: senderId, caseManagerId: receiverId },
          { userId: receiverId, caseManagerId: senderId }
        ]
      },
      {
        $set: {
          lastMessage: text.trim(),
          lastMessageTime: new Date()
        },
        $inc: {
          [isFromCaseManager ? 'unreadCount.user' : 'unreadCount.caseManager']: 1
        }
      },
      { upsert: true, new: true }
    );

    console.log('✅ Conversation updated:', conversation._id);

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      console.log('📡 Emitting socket event to room:', receiverId.toString());
      io.to(receiverId.toString()).emit('newMessage', { 
        message, 
        conversationId 
      });
      console.log('✅ Socket event emitted');
    } else {
      console.log('⚠️ Socket.io not available');
    }

    console.log('═══════════════════════════════════');

    res.status(201).json({ 
      success: true, 
      message 
    });
  } catch (error) {
    console.error('❌ Send message error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send message',
      error: error.message 
    });
  }
});

// Mark messages as read
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

    // Mark all messages in this conversation as read
    const result = await Message.updateMany(
      { 
        conversationId, 
        receiverId: userId, 
        isRead: false 
      },
      { isRead: true }
    );

    console.log('✅ Marked', result.modifiedCount, 'messages as read');

    // Reset unread count
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
      message: 'Messages marked as read' 
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

// Get all conversations (for case manager)
router.get('/conversations', isAuthenticated, async (req, res) => {
  try {
    console.log('═══════════════════════════════════');
    console.log('📡 GET /api/messages/conversations');
    
    const caseManagerId = req.user.id;
    const userRole = req.user.role;

    console.log('👤 Case Manager ID:', caseManagerId);
    console.log('🏷️ Role:', userRole);

    // Only case managers and admins can access this
    if (userRole !== 'case_manager' && userRole !== 'admin') {
      console.log('❌ Access denied - not a case manager');
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only case managers can view all conversations.' 
      });
    }

    const conversations = await Conversation.find({ 
      caseManagerId,
      status: 'active'
    })
      .populate('userId', 'username email')
      .sort({ lastMessageTime: -1 })
      .limit(50);

    console.log('✅ Found', conversations.length, 'conversations');
    console.log('═══════════════════════════════════');

    res.json({ 
      success: true, 
      conversations 
    });
  } catch (error) {
    console.error('❌ Get conversations error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch conversations',
      error: error.message 
    });
  }
});

// Get unread count
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

export default router;