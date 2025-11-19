// socket/socket.js (Updated with Production CORS)
import { Server } from 'socket.io';

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGINS 
        ? process.env.CORS_ORIGINS.split(',')
        : [
            'https://api.cpaghealthhub.com',
            'https://www.cpaghealthhub.com',
            'https://cpaghealthhub.com',
            'http://localhost:5173',
            'http://localhost:5000'
          ],
      credentials: true,
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true // Support older clients if needed
  });

  // Store connected users
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    // ✅ User joins their personal room (CRITICAL for notifications)
    socket.on('join_user_room', (userId) => {
      const roomName = `user_${userId}`;
      socket.join(roomName);
      connectedUsers.set(userId, socket.id);
      
      // Confirm join
      socket.emit('room_joined', { userId, room: roomName });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      // Remove user from connected users map
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          break;
        }
      }
    });

    // ============================================
    // MESSAGE EVENTS
    // ============================================
    
    socket.on('join_chat', (userId) => {
      socket.join(`chat_${userId}`);
    });

    socket.on('send_message', (data) => {
      io.to(`chat_${data.recipientId}`).emit('receive_message', data);
    });

    socket.on('typing', (data) => {
      const { conversationId, userId, isTyping } = data;
      
      // Emit to the other person in the conversation
      socket.to(conversationId).emit('userTyping', { userId, isTyping });
      
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
    });
  });

  // ============================================
  // ✅ HELPER FUNCTIONS (called from routes)
  // ============================================
  
  // Emit unread count update to specific user
  io.emitUnreadCountUpdate = async (userId, unreadCount) => {
    const roomName = `user_${userId}`;
    io.to(roomName).emit('unreadCountUpdated', { unreadCount });
    
    // Log connected clients in room for debugging
    const socketsInRoom = await io.in(roomName).allSockets();
    
    return { success: true, roomName, socketCount: socketsInRoom.size };
  };

  // Emit new message notification
  io.emitNewMessage = async (userId, message) => {
    const roomName = `user_${userId}`;
    io.to(roomName).emit('newMessage', { message });
    
    return { success: true, roomName };
  };

  // Get connected users count
  io.getConnectedUsersCount = () => {
    return connectedUsers.size;
  };


  return io;
};
