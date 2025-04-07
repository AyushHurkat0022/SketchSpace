const Canvas = require('../models/Canvas');
const logger = require('../logger');

exports.getCanvases = async (req, res) => {
  try {
    const canvases = await Canvas.find({
      $or: [
        { email: req.params.email },
        { canvasSharedWith: req.params.email }
      ]
    });
    res.json(canvases);
  } catch (error) {
    throw error;
  }
};

exports.createCanvas = async (req, res) => {
    const { email, canvasElements, canvasSharedWith, name } = req.body;  // Add name here
    
    try {
        const canvas = new Canvas({
            email,
            canvasElements: canvasElements || [],
            canvasSharedWith: canvasSharedWith || [],
            name: name || null,  // Explicitly handle null/undefined
            lastUpdatedBy: email
        });

        const savedCanvas = await canvas.save();
        logger.info(`Canvas created by: ${email}`);
        res.status(201).json(savedCanvas);
    } catch (error) {
        logger.error(`Error creating canvas: ${error.message}`);
        res.status(500).json({ error: 'Failed to create canvas', details: error.message });
    }
};

exports.updateCanvas = async (req, res) => {
  const { canvasId } = req.params;
  const { canvasElements, email } = req.body;

  try {
    const canvas = await Canvas.findById(canvasId);
    if (!canvas) throw new Error('Canvas not found');

    // Check if user has permission
    if (canvas.email !== email && !canvas.canvasSharedWith.includes(email)) {
      throw new Error('Unauthorized');
    }

    // Merge existing elements with new ones
    const existingElements = canvas.canvasElements || [];
    const mergedElements = [...existingElements];

    // canvasElements.forEach(newElement => {
    //   const index = mergedElements.findIndex(el => el.id === newElement.id);
    //   if (index >= 0) {
    //     mergedElements[index] = newElement; // Update existing element
    //   } else {
    //     mergedElements.push(newElement); // Add new element
    //   }
    // });

    canvas.canvasElements = mergedElements;
    canvas.lastUpdatedBy = email;
    canvas.updatedAt = Date.now();

    await canvas.save();
    logger.info(`Canvas ${canvasId} updated by: ${email}`);
    res.json(canvas);
  } catch (error) {
    logger.error(`Update canvas error: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

exports.shareCanvas = async (req, res) => {
    const { canvasId } = req.params;
    const { shareWithEmail, ownerEmail } = req.body;

    try {
        const canvas = await Canvas.findById(canvasId);
        if (!canvas) throw new Error('Canvas not found');
        
        if (canvas.email !== ownerEmail) throw new Error('Only owner can share');
        if (canvas.canvasSharedWith.includes(shareWithEmail)) {
            throw new Error('Already shared with this user');
        }

        canvas.canvasSharedWith.push(shareWithEmail);
        await canvas.save();
        
        logger.info(`Canvas ${canvasId} shared with: ${shareWithEmail}`);
        res.json({ message: 'Canvas shared successfully', canvas });
    } catch (error) {
        logger.error(`Share canvas error: ${error.message}`);
        res.status(error.message === 'Only owner can share' ? 403 : 400).json({ error: error.message });
    }
};

exports.deleteCanvas = async (req, res) => {
  const { canvasId } = req.params;
  const { email } = req.body;

  try {
    const canvas = await Canvas.findById(canvasId);
    if (!canvas) throw new Error('Canvas not found');

    if (canvas.email === email) {
      // Owner deleting - remove completely
      await Canvas.findByIdAndDelete(canvasId);
      logger.info(`Canvas ${canvasId} deleted by owner: ${email}`);
      res.json({ message: 'Canvas deleted successfully' });
    } else if (canvas.canvasSharedWith.includes(email)) {
      // Shared user removing from their list
      canvas.canvasSharedWith = canvas.canvasSharedWith.filter(e => e !== email);
      await canvas.save();
      logger.info(`Canvas ${canvasId} removed from shared list for: ${email}`);
      res.json({ message: 'Canvas removed from your list' });
    } else {
      throw new Error('Unauthorized');
    }
  } catch (error) {
    throw error;
  }
};
