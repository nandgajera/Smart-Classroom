const express = require('express');
const Subject = require('../models/Subject');
const { authorize } = require('../middleware/auth');
const router = express.Router();

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { department, semester, program, type, page = 1, limit = 20 } = req.query;
    
    const query = { isActive: true };
    if (department) query.department = department;
    if (semester) query.semester = semester;
    if (program) query.program = program;
    if (type) query.type = type;

    const subjects = await Subject.find(query)
      .populate('prerequisites', 'name code')
      .sort({ department: 1, semester: 1, name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Subject.countDocuments(query);

    res.status(200).json({
      success: true,
      subjects: subjects, // Keep both for compatibility
      data: subjects,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @desc    Get subject by ID
// @route   GET /api/subjects/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('prerequisites', 'name code');
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    res.status(200).json({
      success: true,
      data: subject
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @desc    Create new subject
// @route   POST /api/subjects
// @access  Private (Admin/HOD only)
router.post('/', authorize('admin', 'hod'), async (req, res) => {
  try {
    const subject = await Subject.create(req.body);
    
    const populatedSubject = await Subject.findById(subject._id)
      .populate('prerequisites', 'name code');
    
    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: populatedSubject
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private (Admin/HOD only)
router.put('/:id', authorize('admin', 'hod'), async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    const updatedSubject = await Subject.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('prerequisites', 'name code');

    res.status(200).json({
      success: true,
      message: 'Subject updated successfully',
      data: updatedSubject
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Delete subject (soft delete)
// @route   DELETE /api/subjects/:id
// @access  Private (Admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    await Subject.findByIdAndUpdate(req.params.id, { isActive: false });

    res.status(200).json({
      success: true,
      message: 'Subject deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
