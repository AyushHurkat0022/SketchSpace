const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');
const Canvas = require('./models/Canvas');
const userRoutes = require('./routes/users');
const canvasRoutes = require('./routes/canvasRoutes');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./logger');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP'
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(limiter);
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Connect to MongoDB
connectDB();

// Routes
app.use('/users', userRoutes);
app.use('/canvases', canvasRoutes);

// Error handling
app.use(errorHandler);

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Authentication error'));
    socket.user = decoded;
    next();
  });
});

// WebSocket logic
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id} | User: ${socket.user.email}`);

  // Handle joining a canvas room
  socket.on('joinCanvas', async (canvasId) => {
    try {
      const canvas = await Canvas.findOne({
        _id: canvasId,
        $or: [
          { owner: socket.user.id },
          { sharedWith: socket.user.email }
        ]
      });

      if (!canvas) throw new Error('Canvas not found');

      socket.join(canvasId);
      logger.info(`User ${socket.user.email} joined canvas ${canvasId}`);

      // Send initial canvas data
      socket.emit('canvasLoaded', {
        id: canvas._id,
        name: canvas.name,
        canvasElements: canvas.canvasElements,
        owner: canvas.owner,
        sharedWith: canvas.sharedWith,
        createdAt: canvas.createdAt,
        updatedAt: canvas.updatedAt
      });

      // Notify others
      socket.to(canvasId).emit('userJoined', {
        userId: socket.id,
        userEmail: socket.user.email
      });
    } catch (error) {
      logger.error(`Canvas join error: ${error.message}`);
      socket.emit('canvasError', error.message);
    }
  });

  // Handle canvas updates
  socket.on('updateCanvas', async ({ canvasId, canvasElements }) => {
    try {
      const canvas = await Canvas.findById(canvasId);
      if (!canvas) throw new Error('Canvas not found');
  
      // Replace with new elements (assuming full state is sent)
      canvas.canvasElements = canvasElements;
      canvas.updatedAt = new Date();
      canvas.lastUpdatedBy = socket.user.email;
  
      const updatedCanvas = await canvas.save();
  
      io.to(canvasId).emit('canvasUpdated', {
        canvasElements: updatedCanvas.canvasElements,
        updatedBy: socket.user.email,
        timestamp: updatedCanvas.updatedAt
      });
    } catch (error) {
      logger.error(`Canvas update error: ${error.message}`);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3030;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
