const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { authenticate, authorize } = require('../middleware/auth');

// @desc    Get all courses or filter by school
// @route   GET /api/courses
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { school, level, degreeType, active = true } = req.query;
    
    let query = {};
    if (school) query.school = school;
    if (level) query.level = level;
    if (degreeType) query.degreeType = degreeType;
    if (active === 'true') query.isActive = true;

    const courses = await Course.find(query)
      .populate('school', 'name code')
      .populate('totalStudents')
      .sort({ name: 1 });

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

// @desc    Get single course by ID
// @route   GET /api/courses/:id
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('school', 'name code address contact')
      .populate('curriculum.subjects')
      .populate('totalStudents');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Get course semesters
// @route   GET /api/courses/:id/semesters
// @access  Private
router.get('/:id/semesters', authenticate, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const semesters = course.getSemesterNumbers();

    res.json({
      success: true,
      data: {
        courseId: course._id,
        courseName: course.name,
        totalSemesters: course.duration.semesters,
        semesters: semesters
      }
    });
  } catch (error) {
    console.error('Error fetching course semesters:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Create new course
// @route   POST /api/courses
// @access  Private (Admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.create(req.body);
    
    await course.populate('school', 'name code');

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Error creating course:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Course code already exists for this school'
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

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('school', 'name code');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Error updating course:', error);
    
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

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    // Soft delete by setting isActive to false
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: {},
      message: 'Course deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

module.exports = router;
