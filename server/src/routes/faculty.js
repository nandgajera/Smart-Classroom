const express = require('express');
const Faculty = require('../models/Faculty');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const faculty = await Faculty.find().populate('user', 'name email department');
    res.json({ success: true, faculty });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
