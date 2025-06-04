const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    // Basic validation
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        // Check for existing user by email or username
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            if (user.email === email) {
                return res.status(400).json({ message: 'User with this email already exists' });
            }
            if (user.username === username) {
                return res.status(400).json({ message: 'User with this username already exists' });
            }
        }

        // Create new user (password will be hashed by pre-save hook in User model)
        user = new User({
            username,
            email,
            password
        });

        await user.save();

        // Create JWT payload
        const payload = {
            user: {
                id: user.id
            }
        };

        // Sign the token
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' }, // Token expires in 1 hour (adjust as needed)
            (err, token) => {
                if (err) throw err;
                res.status(201).json({
                    token,
                    user: { id: user.id, username: user.username, email: user.email }
                });
            }
        );

    } catch (err) {
        console.error(err.message);
        // Handle Mongoose validation errors separately for clearer messages
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).send('Server error');
    }
});

// POST /api/auth/signin
router.post('/signin', async (req, res) => {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        // Check for existing user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Compare password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create JWT payload
        const payload = {
            user: {
                id: user.id
            }
        };

        // Sign the token
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: { id: user.id, username: user.username, email: user.email }
                });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router; 