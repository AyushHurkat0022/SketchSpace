require('dotenv').config();
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

const app = express();
const server = http.createServer(app);

// Allowed origins for CORS
const allowedOrigins = [
  'https://sketchspace.onrender.com', // live frontend
  'http://localhost:3000'             // local dev frontend
];

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow requests with no origin
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));

app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP'
});
app.use(limiter);

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Connect to MongoDB
connectDB();

// Routes
app.use('/users', userRoutes);
app.use('/canvases', canvasRoutes);

app.get('/health', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState; 
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date(),
      db: dbState === 1 ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Error handling
app.use(errorHandler);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

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

  // Join canvas room
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

      socket.emit('canvasLoaded', {
        id: canvas._id,
        name: canvas.name,
        canvasElements: canvas.canvasElements.map(element => ({
          ...element,
          type: element.type
        })),
        owner: canvas.owner,
        sharedWith: canvas.sharedWith,
        createdAt: canvas.createdAt,
        updatedAt: canvas.updatedAt
      });

      socket.to(canvasId).emit('userJoined', {
        userId: socket.id,
        userEmail: socket.user.email
      });
    } catch (error) {
      logger.error(`Canvas join error: ${error.message}`);
      socket.emit('canvasError', error.message);
    }
  });

  // Canvas updates
  socket.on('updateCanvas', async ({ canvasId, canvasElements }) => {
    try {
      const canvas = await Canvas.findById(canvasId);
      if (!canvas) throw new Error('Canvas not found');
  
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

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 3030;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
