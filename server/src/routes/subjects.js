const express = require('express');
const Subject = require('../models/Subject');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const subjects = await Subject.find({ isActive: true });
    res.json({ success: true, subjects });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
