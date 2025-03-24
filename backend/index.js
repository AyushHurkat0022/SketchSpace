const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const userRoutes = require('./routes/users');
const canvasRoutes = require('./routes/canvases');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./logger');
require('dotenv').config();

const app = express();

// Logger setup
logger.info('Starting server...');

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
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

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});