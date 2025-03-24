const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const logger = require('../logger');

exports.register = async (req, res) => {
    const { username, email, password } = req.body;
    
    try {
        let user = await User.findOne({ email });
        if (user) throw new Error('User already exists');

        user = new User({ username, email, password });
        await user.save();

        const token = jwt.sign(
            { id: user._id, email: user.email, username: user.username },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1h' }
        );

        logger.info(`User registered: ${email}`);
        res.status(201).json({ token, message: 'User registered successfully' });
    } catch (error) {
        logger.error(`Registration error: ${error.message}`);
        res.status(400).json({ error: error.message }); // Send response instead of throwing
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const user = await User.findOne({ email });
        if (!user) throw new Error('Invalid credentials');

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new Error('Invalid credentials');

        const token = jwt.sign(
            { id: user._id, email: user.email, username: user.username },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1h' }
        );

        logger.info(`User logged in: ${email}`);
        res.json({ token, message: 'Logged in successfully' });
    } catch (error) {
        logger.error(`Login error: ${error.message}`);
        res.status(401).json({ error: error.message }); // Send 401 for auth failure
    }
};