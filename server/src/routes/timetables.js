const express = require('express');
const Timetable = require('../models/Timetable');
const TimetableScheduler = require('../algorithms/TimetableScheduler');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Generate new timetable
// @route   POST /api/timetables/generate
// @access  Private (Admin/HOD)
router.post('/generate', authenticate, authorize('admin', 'hod'), async (req, res) => {
  try {
    const {
      name,
      academicYear,
      semester,
      department,
      constraints
    } = req.body;

    // Initialize scheduler
    const scheduler = new TimetableScheduler();
    
    // Generate timetable using advanced constraint satisfaction algorithm
    const generationResult = await scheduler.generateTimetable({
      academicYear,
      semester,
      department,
      constraints
    });

    // Create timetable document
    const timetable = await Timetable.create({
      name,
      academicYear,
      semester,
      department,
      schedule: generationResult.schedule,
      generatedBy: req.user._id,
      algorithm: 'constraint_satisfaction',
      optimizationScore: generationResult.score,
      constraints: constraints || {},
      conflicts: generationResult.conflicts || [],
      statistics: generationResult.statistics || {}
    });

    await timetable.populate([
      'generatedBy',
      'schedule.subject',
      'schedule.faculty',
      'schedule.classroom',
      'schedule.batch'
    ]);

    res.status(201).json({
      success: true,
      message: 'Timetable generated successfully',
      timetable,
      generationMetrics: {
        totalSlots: generationResult.schedule.length,
        conflicts: generationResult.conflicts.length,
        score: generationResult.score,
        generationTime: generationResult.generationTime
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get all timetables
// @route   GET /api/timetables
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      department, 
      academicYear, 
      semester, 
      status,
      page = 1,
      limit = 10
    } = req.query;

    const query = { isActive: true };
    
    if (department) query.department = department;
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = parseInt(semester);
    if (status) query.status = status;

    // Apply department filter for non-admin users
    if (req.user.role === 'faculty' || req.user.role === 'hod') {
      query.department = req.user.department;
    }

    const timetables = await Timetable.find(query)
      .populate('generatedBy approvedBy', 'name email')
      .sort({ generationDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-schedule'); // Exclude schedule for list view

    const total = await Timetable.countDocuments(query);

    res.status(200).json({
      success: true,
      timetables,
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

// @desc    Get single timetable
// @route   GET /api/timetables/:id
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id)
      .populate('generatedBy approvedBy', 'name email role')
      .populate([
        {
          path: 'schedule.subject',
          select: 'code name type credits sessionDuration'
        },
        {
          path: 'schedule.faculty',
          populate: { path: 'user', select: 'name email' }
        },
        {
          path: 'schedule.classroom',
          select: 'roomNumber building capacity type'
        },
        {
          path: 'schedule.batch',
          select: 'name code program semester section enrolledStudents'
        }
      ]);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'faculty' && timetable.department !== req.user.department) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      timetable
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Update timetable status
// @route   PATCH /api/timetables/:id/status
// @access  Private (Admin/HOD)
router.patch('/:id/status', authenticate, authorize('admin', 'hod'), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['draft', 'pending_approval', 'approved', 'published', 'archived'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const timetable = await Timetable.findById(req.params.id);
    
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }

    timetable.status = status;
    
    if (status === 'approved') {
      timetable.approvedBy = req.user._id;
      timetable.approvalDate = new Date();
    }
    
    if (status === 'published') {
      timetable.publishedDate = new Date();
    }

    await timetable.save();

    res.status(200).json({
      success: true,
      message: `Timetable ${status} successfully`,
      timetable
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Delete timetable
// @route   DELETE /api/timetables/:id
// @access  Private (Admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);
    
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }

    // Soft delete
    timetable.isActive = false;
    await timetable.save();

    res.status(200).json({
      success: true,
      message: 'Timetable deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get conflicts for a timetable
// @route   GET /api/timetables/:id/conflicts
// @access  Private
router.get('/:id/conflicts', authenticate, async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);
    
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }

    // Detect and update conflicts
    const conflicts = timetable.detectConflicts();
    await timetable.save();

    res.status(200).json({
      success: true,
      conflicts,
      summary: {
        total: conflicts.length,
        critical: conflicts.filter(c => c.severity === 'critical').length,
        high: conflicts.filter(c => c.severity === 'high').length,
        medium: conflicts.filter(c => c.severity === 'medium').length,
        low: conflicts.filter(c => c.severity === 'low').length
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
