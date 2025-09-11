const express = require('express');
const Batch = require('../models/Batch');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const batches = await Batch.find({ isActive: true })
      .populate('subjects.subject subjects.faculty');
    res.json({ success: true, batches });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
