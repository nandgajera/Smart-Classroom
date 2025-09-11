const express = require('express');
const User = require('../models/User');
const { authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/', authorize('admin'), async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).select('-password');
    res.json({ success: true, users });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
