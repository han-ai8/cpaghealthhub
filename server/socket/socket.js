// socket/socket.js (Updated with Enhanced Unread Count Events)
import { Server } from 'socket.io';

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:5000'],
      credentials: true,
      methods: ['GET', 'POST']
    }
  });

  // Store connected users
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ✅ User joins their personal room (CRITICAL for notifications)
    socket.on('join_user_room', (userId) => {
      const roomName = `user_${userId}`;
      socket.join(roomName);
      connectedUsers.set(userId, socket.id);
      console.log(`✅ User ${userId} joined room: ${roomName}`);
      
      // Confirm join
      socket.emit('room_joined', { userId, room: roomName });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      // Remove user from connected users map
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          console.log(`👋 User ${userId} disconnected`);
          break;
        }
      }
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });

    // ============================================
    // MESSAGE EVENTS
    // ============================================
    
    socket.on('join_chat', (userId) => {
      socket.join(`chat_${userId}`);
      console.log(`💬 User ${userId} joined chat room`);
    });

    socket.on('send_message', (data) => {
      io.to(`chat_${data.recipientId}`).emit('receive_message', data);
    });

    socket.on('typing', (data) => {
      const { conversationId, userId, isTyping } = data;
      
      // Emit to the other person in the conversation
      socket.to(conversationId).emit('userTyping', { userId, isTyping });
      
      console.log(`⌨️ User ${userId} ${isTyping ? 'started' : 'stopped'} typing`);
    });

    socket.on('stop_typing', (data) => {
      socket.to(`chat_${data.recipientId}`).emit('user_stop_typing', data);
    });

    // ============================================
    // ✅ UNREAD COUNT EVENTS
    // ============================================
    
    // Emit unread count update to specific user
    socket.on('updateUnreadCount', ({ userId, unreadCount }) => {
      const roomName = `user_${userId}`;
      io.to(roomName).emit('unreadCountUpdated', { unreadCount });
      console.log(`📬 Emitted unread count ${unreadCount} to room ${roomName}`);
    });
  });

  // ============================================
  // ✅ HELPER FUNCTIONS (called from routes)
  // ============================================
  
  // Emit unread count update to specific user
  io.emitUnreadCountUpdate = async (userId, unreadCount) => {
    const roomName = `user_${userId}`;
    io.to(roomName).emit('unreadCountUpdated', { unreadCount });
    console.log(`📬 [Helper] Emitted unread count ${unreadCount} to room ${roomName}`);
    
    // Log connected clients in room for debugging
    const socketsInRoom = await io.in(roomName).allSockets();
    console.log(`   └─ Sockets in room ${roomName}:`, socketsInRoom.size);
    
    return { success: true, roomName, socketCount: socketsInRoom.size };
  };

  // Emit new message notification
  io.emitNewMessage = async (userId, message) => {
    const roomName = `user_${userId}`;
    io.to(roomName).emit('newMessage', { message });
    console.log(`💬 [Helper] Emitted new message to room ${roomName}`);
    
    return { success: true, roomName };
  };

  // Get connected users count
  io.getConnectedUsersCount = () => {
    return connectedUsers.size;
  };

  console.log('✅ Socket.io initialized with enhanced message and notification support');

  return io;
};