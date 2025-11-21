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

const normalizeTimestamp = (value) => {
  if (!value) return 0;
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
};

const mergeCanvasElements = (existing = [], incoming = []) => {
  const map = new Map();

  existing.forEach((element) => {
    if (element?.id) {
      map.set(element.id, element);
    }
  });

  incoming.forEach((element) => {
    if (!element || !element.id) {
      return;
    }

    if (element.isDeleted) {
      map.delete(element.id);
      return;
    }

    const current = map.get(element.id);
    if (!current) {
      map.set(element.id, element);
      return;
    }

    const currentUpdatedAt = normalizeTimestamp(current.updatedAt || current.createdAt);
    const incomingUpdatedAt = normalizeTimestamp(element.updatedAt || element.createdAt);

    if (incomingUpdatedAt >= currentUpdatedAt) {
      map.set(element.id, {
        ...current,
        ...element,
        updatedAt: incomingUpdatedAt ? new Date(incomingUpdatedAt) : new Date(),
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => {
    const aCreated = normalizeTimestamp(a.createdAt);
    const bCreated = normalizeTimestamp(b.createdAt);
    if (aCreated === bCreated) {
      return (a.id || "").localeCompare(b.id || "");
    }
    return aCreated - bCreated;
  });
};

// Allowed origins for CORS
const allowedOrigins = [
  'https://sketchspace.onrender.com',
  'http://localhost:3000'
];

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
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
  socket.on('joinCanvas', async (payload) => {
    try {
      const canvasId = typeof payload === 'string' ? payload : payload?.canvasId;

      if (!canvasId) {
        throw new Error('Canvas ID is required to join');
      }

      // FIXED: Use correct field names from Canvas model
      const canvas = await Canvas.findOne({
        _id: canvasId,
        $or: [
          { email: socket.user.email },              // Changed from 'owner'
          { canvasSharedWith: socket.user.email }    // Changed from 'sharedWith'
        ]
      });

      if (!canvas) {
        throw new Error('Canvas not found or access denied');
      }

      socket.join(canvasId);
      logger.info(`User ${socket.user.email} joined canvas ${canvasId}`);

      // FIXED: Send correct field names
      socket.emit('canvasLoaded', {
        id: canvas._id,
        name: canvas.name,
        canvasElements: canvas.canvasElements,
        email: canvas.email,                        // Changed from 'owner'
        canvasSharedWith: canvas.canvasSharedWith,  // Changed from 'sharedWith'
        createdAt: canvas.createdAt,
        updatedAt: canvas.updatedAt,
        lastUpdatedBy: canvas.lastUpdatedBy
      });

      socket.to(canvasId).emit('userJoined', {
        userId: socket.id,
        userEmail: socket.user.email,
        canvasId
      });
    } catch (error) {
      logger.error(`Canvas join error: ${error.message}`);
      socket.emit('canvasError', error.message);
    }
  });

  // Canvas updates
  socket.on('updateCanvas', async ({ canvasId, canvasElements }) => {
    try {
      const canvas = await Canvas.findOne({
        _id: canvasId,
        $or: [
          { email: socket.user.email },
          { canvasSharedWith: socket.user.email }
        ]
      });

      if (!canvas) {
        throw new Error('Canvas not found or access denied');
      }
  
      const mergedElements = mergeCanvasElements(canvas.canvasElements || [], canvasElements || []);
      canvas.canvasElements = mergedElements;
      canvas.updatedAt = new Date();
      canvas.lastUpdatedBy = socket.user.email;
  
      const updatedCanvas = await canvas.save();
  
      // Broadcast to all users in the room including sender
      io.to(canvasId).emit('canvasUpdated', {
        canvasElements: updatedCanvas.canvasElements,
        updatedBy: socket.user.email,
        timestamp: updatedCanvas.updatedAt,
        version: normalizeTimestamp(updatedCanvas.updatedAt)
      });

      logger.info(`Canvas ${canvasId} updated by ${socket.user.email}`);
    } catch (error) {
      logger.error(`Canvas update error: ${error.message}`);
      socket.emit('canvasError', error.message);
    }
  });

  // Real-time streaming updates (no persistence)
  socket.on('streamCanvas', ({ canvasId, element, elements, mode = 'element', timestamp, removedElementIds = [] }) => {
    try {
      if (!canvasId) {
        throw new Error('Canvas ID is required for streaming');
      }
      if (!socket.rooms.has(canvasId)) {
        throw new Error('User has not joined this canvas');
      }

      if (mode === 'snapshot' && !Array.isArray(elements)) {
        throw new Error('Snapshot mode requires an elements array');
      }

      if (mode === 'element' && !element) {
        throw new Error('Element mode requires a single element payload');
      }

      socket.to(canvasId).emit('canvasStream', {
        mode,
        element,
        canvasElements: elements,
        removedElementIds,
        updatedBy: socket.user.email,
        timestamp: timestamp || new Date(),
      });
    } catch (error) {
      logger.error(`Canvas stream error: ${error.message}`);
    }
  });

  // Handle user leaving canvas room
  socket.on('leaveCanvas', (canvasId) => {
    socket.leave(canvasId);
    socket.to(canvasId).emit('userLeft', {
      userId: socket.id,
      userEmail: socket.user.email,
      canvasId
    });
    logger.info(`User ${socket.user.email} left canvas ${canvasId}`);
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