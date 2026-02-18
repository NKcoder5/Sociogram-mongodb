import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Notification } from '../models/notification.model.js';
import { Message } from '../models/message.model.js';
import { User } from '../models/user.model.js';

let io;
const connectedUsers = new Map();

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        const allowedOrigins = [
          process.env.FRONTEND_URL,
          "http://localhost:5173",
          "http://127.0.0.1:5173",
          "http://localhost:5000",
          "http://127.0.0.1:5000",
          "http://localhost:8000",
          "http://127.0.0.1:8000",
          "http://localhost:3000",
          "https://sociogram-mongodb-1.onrender.com",
          "https://sociogram-1.onrender.com",
          "https://sociogram-n73b.onrender.com"
        ].filter(Boolean);

        const isRenderOrigin = origin && origin.endsWith('onrender.com');
        if (!origin || allowedOrigins.includes(origin) || isRenderOrigin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
          return callback(null, true);
        }

        console.log('Socket CORS blocked origin:', origin);
        return callback(new Error('Not allowed by CORS'));
      },
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true
    }
  });

  // Socket authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.SECRET_KEY || process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.userId}`);

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Store user socket mapping
    connectedUsers.set(socket.userId, socket.id);

    // Handle joining conversation rooms
    socket.on('joinConversation', ({ conversationId }) => {
      socket.join(conversationId);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });

    // Handle leaving conversation rooms
    socket.on('leaveConversation', ({ conversationId }) => {
      socket.leave(conversationId);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });

    // Handle sending messages
    socket.on('sendMessage', async (messageData) => {
      console.log('Socket received message:', messageData);

      if (messageData.conversationId) {
        socket.to(messageData.conversationId).emit('receiveMessage', messageData);
      }

      // Create notification for message recipient
      if (messageData.receiverId && messageData.senderId !== messageData.receiverId) {
        try {
          // Create notification in database using Mongoose
          const notification = await Notification.create({
            type: 'message',
            message: `${messageData.senderName || 'Someone'} sent you a message`,
            senderId: messageData.senderId,
            receiverId: messageData.receiverId,
            isRead: false,
            post: messageData.postId || null // Adjust if there's an associated post
          });

          const populatedNotification = await Notification.findById(notification._id)
            .populate('sender', 'id username profilePicture');

          // Transform for frontend
          const transformedNotification = {
            ...populatedNotification.toObject(),
            id: populatedNotification._id,
            senderId: populatedNotification.sender?._id || populatedNotification.sender
          };

          // Emit notification to receiver
          io.to(`user_${messageData.receiverId}`).emit('newNotification', transformedNotification);
        } catch (error) {
          console.error('Error creating message notification:', error);
        }
      }
    });

    // Handle typing indicators
    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(conversationId).emit('userTyping', {
        userId: socket.userId,
        isTyping
      });
    });

    // Handle user status updates
    socket.on('updateStatus', ({ status }) => {
      socket.broadcast.emit('userStatusUpdate', {
        userId: socket.userId,
        status
      });
    });

    // Handle message reactions
    socket.on('messageReaction', async ({ messageId, emoji, action, conversationId }) => {
      console.log('📝 Message reaction:', { messageId, emoji, action, userId: socket.userId });

      try {
        if (action === 'add') {
          await Message.findOneAndUpdate(
            { _id: messageId },
            {
              $push: {
                reactions: {
                  userId: socket.userId,
                  emoji: emoji
                }
              }
            }
          );
        } else if (action === 'remove') {
          await Message.findOneAndUpdate(
            { _id: messageId },
            {
              $pull: {
                reactions: {
                  userId: socket.userId,
                  emoji: emoji
                }
              }
            }
          );
        }
      } catch (error) {
        console.error('Error handling reaction in database:', error);
      }

      io.to(conversationId).emit('messageReaction', {
        messageId,
        emoji,
        action,
        userId: socket.userId
      });
    });

    // Handle joinUserRoom for unified socket
    socket.on('joinUserRoom', ({ userId }) => {
      if (userId === socket.userId) {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined their personal room`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      connectedUsers.delete(socket.userId);
      socket.broadcast.emit('userStatusUpdate', {
        userId: socket.userId,
        status: 'offline'
      });
    });
  });

  return io;
};

export const getSocketInstance = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

export const getReceiverSocketId = (userId) => {
  return connectedUsers.get(userId);
};

export default { initializeSocket, getSocketInstance, getReceiverSocketId };
