// socket/socket.js (Updated)
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

    // User joins their personal room
    socket.on('join_user_room', (userId) => {
      socket.join(`user_${userId}`);
      connectedUsers.set(userId, socket.id);
      console.log(`👤 User ${userId} joined room: user_${userId}`);
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

    // Message events (existing functionality)
    socket.on('join_chat', (userId) => {
      socket.join(`chat_${userId}`);
      console.log(`💬 User ${userId} joined chat room`);
    });

    socket.on('send_message', (data) => {
      io.to(`chat_${data.recipientId}`).emit('receive_message', data);
    });

    socket.on('typing', (data) => {
      socket.to(`chat_${data.recipientId}`).emit('user_typing', data);
    });

    socket.on('stop_typing', (data) => {
      socket.to(`chat_${data.recipientId}`).emit('user_stop_typing', data);
    });
  });

  return io;
};