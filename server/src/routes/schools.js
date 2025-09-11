const express = require('express');
const router = express.Router();
const School = require('../models/School');
const Course = require('../models/Course');
const { authenticate, authorize } = require('../middleware/auth');

// @desc    Get all schools
// @route   GET /api/schools
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const schools = await School.findActive()
      .populate('totalCourses');
    
    res.json({
      success: true,
      count: schools.length,
      data: schools
    });
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Get single school by ID
// @route   GET /api/schools/:id
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const school = await School.findById(req.params.id)
      .populate('totalCourses');

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    res.json({
      success: true,
      data: school
    });
  } catch (error) {
    console.error('Error fetching school:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Get courses by school ID
// @route   GET /api/schools/:id/courses
// @access  Private
router.get('/:id/courses', authenticate, async (req, res) => {
  try {
    const courses = await Course.findBySchool(req.params.id);

    res.json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Create new school
// @route   POST /api/schools
// @access  Private (Admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const school = await School.create(req.body);

    res.status(201).json({
      success: true,
      data: school
    });
  } catch (error) {
    console.error('Error creating school:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'School code already exists'
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Update school
// @route   PUT /api/schools/:id
// @access  Private (Admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const school = await School.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    res.json({
      success: true,
      data: school
    });
  } catch (error) {
    console.error('Error updating school:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Delete school
// @route   DELETE /api/schools/:id
// @access  Private (Admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    // Soft delete by setting isActive to false
    const school = await School.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    res.json({
      success: true,
      data: {},
      message: 'School deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting school:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

module.exports = router;
