const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const session = require('express-session');


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Be more restrictive in production
    methods: ['GET', 'POST'],
  },
});

const prisma = new PrismaClient();

const path = require('path');
app.get('/ping', (req, res) => {
  res.status(200).send('Handshake acknowledged.');
});
// Middleware
app.use(cors({
  origin: '*', // Be more restrictive in production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Socket.io connection
// Socket.io connection

// Middleware for Socket Authentication
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    // For now, allow anonymous connections if you want, but strictly speaking we should validate.
    // Given the issues with handshake, let's log and proceed or fail.
    console.log('Socket handshake: No token provided');
    // return next(new Error('Authentication error'));
  }
  // TODO: Verify token with jsonwebtoken if strict auth needed
  next();
});

// Track online users: userId -> socketId
const onlineUsers = new Map();

io.on('connection', (socket) => {
  socket.on('register_user', (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} is online (${socket.id})`);

    // Broadcast online status to everyone or relevant rooms? 
    // For simplicity, let's just update lastSeen in DB
    prisma.user.update({
      where: { id: userId },
      data: { lastSeen: new Date() }
    }).catch(e => console.error('Error updating lastSeen', e));

    socket.userId = userId; // Attach to socket instance for disconnect handling
    io.emit('user_status_change', { userId, status: 'online' });
    socket.emit('online_users', Array.from(onlineUsers.keys()));
  });

  socket.on('joinRoom', ({ rideId }) => {
    socket.join(rideId);
    console.log(`User ${socket.id} joined ride ${rideId}`);
  });

  socket.on('typing_start', ({ rideId, userId }) => {
    socket.to(rideId).emit('typing_start', { userId });
  });

  socket.on('typing_stop', ({ rideId, userId }) => {
    socket.to(rideId).emit('typing_stop', { userId });
  });

  // Live Tracking Relay
  socket.on('update_location', ({ rideId, location, userId }) => {
    // Broadcast to room except sender
    socket.to(rideId).emit('update_location', { location, userId });
  });

  // Ride Completion Logic
  socket.on('ride_completed', async ({ rideId, userId }) => {
    console.log(`Ride ${rideId} completed by ${userId}`);
    // Notify all in room to navigate to review
    io.to(rideId).emit('ride_completed', { rideId });

    // Optional: Update Post status in DB if you have a status field
    // await prisma.post.update(...)
  });

  // When a user reads messages in a room
  socket.on('messages_read', async ({ rideId, userId }) => {
    // Update DB
    // Note: This matches messages in rideId where receiverId == userId and status != READ
    try {
      await prisma.message.updateMany({
        where: {
          rideId: rideId,
          receiverId: userId,
          status: { not: 'READ' }
        },
        data: { status: 'READ' }
      });
      // Broadcast to room that messages have been read
      io.to(rideId).emit('messages_read_update', { rideId, userId });
    } catch (e) {
      console.error("Error marking messages read", e);
    }
  });

  // Note: sendMessage is now primarily handled via the POST /api/chat/messages endpoint
  socket.on('disconnect', async () => {
    console.log('user disconnected:', socket.id);
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('user_status_change', { userId: socket.userId, status: 'offline', lastSeen: new Date() });

      try {
        await prisma.user.update({
          where: { id: socket.userId },
          data: { lastSeen: new Date() }
        });
      } catch (e) {
        // silent fail
      }
    }
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/review', require('./routes/reviews'));
app.use('/api/chat', require('./routes/chat')(io));
app.use('/api/cars', require('./routes/cars'));
app.use('/api/notifications', require('./routes/nottifications'));
app.use('/api/drivers', require('./routes/drivers'));

// Graceful Startup Handshake
const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');

    const PORT = process.env.PORT || 5000;
    const HOST = '0.0.0.0';
    server.listen(PORT, HOST, () => {
      console.log(`Server running on http://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error('Critical: Database Offline', error);
    process.exit(1);
  }
};

startServer();

// Handle Prisma disconnect on app termination
process.on('beforeExit', async () => {
  await prisma.$disconnect();
}); 