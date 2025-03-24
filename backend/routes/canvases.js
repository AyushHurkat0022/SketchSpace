const express = require('express');
const router = express.Router();
const { 
  getCanvases, 
  createCanvas, 
  updateCanvas,
  shareCanvas,
  deleteCanvas 
} = require('../controllers/canvasController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const Joi = require('joi');

const createSchema = Joi.object({
    email: Joi.string().email().required(),
    canvasElements: Joi.array().default([]),
    canvasSharedWith: Joi.array().items(Joi.string().email()).default([]),
    name: Joi.string().allow(null, '').optional()
});

const updateSchema = Joi.object({
  email: Joi.string().email().required(),
  canvasElements: Joi.array().required()
});

const shareSchema = Joi.object({
  shareWithEmail: Joi.string().email().required(),
  ownerEmail: Joi.string().email().required()
});

const deleteSchema = Joi.object({
  email: Joi.string().email().required()
});

router.get('/:email', auth, getCanvases);
router.post('/', auth, validate(createSchema), createCanvas);
router.put('/:canvasId', auth, validate(updateSchema), updateCanvas);
router.post('/:canvasId/share', auth, validate(shareSchema), shareCanvas);
router.delete('/:canvasId', auth, validate(deleteSchema), deleteCanvas);

module.exports = router;