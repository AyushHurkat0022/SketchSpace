const mongoose = require('mongoose');

const canvasSchema = new mongoose.Schema({
  name: {
    type: String,
    default: null,
  },
  email: {  // Creator's email
    type: String,
    required: true,
  },
  lastUpdatedBy: {
    type: String,
    default: null,
  },
  canvasElements: {
    type: Array,
    default: [],
  },
  canvasSharedWith: [{
    type: String,  // Array of emails
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Canvas', canvasSchema);
