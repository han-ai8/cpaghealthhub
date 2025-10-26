import { Server } from 'socket.io';

const onlineUsers = new Map();

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:5000'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    // Add these additional options for better compatibility
    allowEIO3: true,
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id);

    // User joins their personal room
    socket.on('join', (userId) => {
      if (userId) {
        socket.join(userId.toString());
        onlineUsers.set(userId.toString(), socket.id);
        console.log(`👤 User ${userId} joined their room`);

        // Notify others that this user is online
        socket.broadcast.emit('userOnline', userId);
      }
    });

    // Handle typing indicator
    socket.on('typing', ({ conversationId, userId, isTyping }) => {
      socket.to(conversationId).emit('userTyping', {
        userId,
        isTyping
      });
    });

    // Handle message read receipts
    socket.on('messageRead', ({ conversationId, userId }) => {
      socket.to(conversationId).emit('messagesRead', {
        conversationId,
        userId
      });
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.id);
      
      // Remove from online users
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          socket.broadcast.emit('userOffline', userId);
          console.log(`👤 User ${userId} went offline`);
          break;
        }
      }
    });
  });

  return io;
};

export const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};