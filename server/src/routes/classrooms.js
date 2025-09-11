const express = require('express');
const Classroom = require('../models/Classroom');
const { authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all classrooms
// @route   GET /api/classrooms
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { department, type, building, capacity, page = 1, limit = 20 } = req.query;
    
    const query = { isActive: true };
    if (department) query.department = department;
    if (type) query.type = type;
    if (building) query.building = building;
    if (capacity) query.capacity = { $gte: parseInt(capacity) };

    const classrooms = await Classroom.find(query)
      .sort({ building: 1, floor: 1, roomNumber: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Classroom.countDocuments(query);

    res.status(200).json({
      success: true,
      classrooms,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Create classroom
// @route   POST /api/classrooms
// @access  Private (Admin only)
router.post('/', authorize('admin'), async (req, res) => {
  try {
    const classroom = await Classroom.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Classroom created successfully',
      classroom
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
