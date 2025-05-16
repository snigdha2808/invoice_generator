const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const protect = require('../middleware/authMiddleware'); // We will create this next

// @route   POST api/auth/register
// @desc    Register a new user/organization
// @access  Public
router.post('/register', async (req, res) => {
  const { organizationName, email, password, companyAddress, companyEmail, companyPhone } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      organizationName,
      email,
      password,
      companyAddress,
      companyEmail,
      companyPhone
    });

    await user.save();

    // Create token
    const payload = {
      user: {
        id: user.id,
        organizationName: user.organizationName
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET, // Make sure to add JWT_SECRET to your .env file
      { expiresIn: '5d' }, // Token expires in 5 days
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ token, user: { id: user.id, organizationName: user.organizationName, email: user.email } });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email }).select('+password'); // Need to select password explicitly
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        organizationName: user.organizationName
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET, // Use the same secret
      { expiresIn: '5d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, organizationName: user.organizationName, email: user.email } });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/me
// @desc    Get current logged-in user
// @access  Private
router.get('/me', protect, async (req, res) => {
  console.log('DEBUG: /api/auth/me route handler reached');
  try {
    // req.user is set by the protect middleware
    const user = await User.findById(req.user.id).select('-password');
    console.log('DEBUG: /me - User found from req.user.id:', user ? user.id : 'null');
    if (!user) {
        console.log('DEBUG: /me - User not found, sending 404');
        return res.status(404).json({ msg: 'User not found' });
    }
    console.log('DEBUG: /me - Sending user data');
    res.json(user);
  } catch (err) {
    console.error('DEBUG: /me - Error in route handler:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
