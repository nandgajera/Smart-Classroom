const express = require('express');
const Subject = require('../models/Subject');
const { authorize } = require('../middleware/auth');
const router = express.Router();

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { department, program, semester, type, page = 1, limit = 50 } = req.query;
    
    const query = { isActive: true };
    if (department) query.department = department;
    if (program) query.program = program;
    if (semester) query.semester = parseInt(semester);
    if (type) query.type = type;

    const subjects = await Subject.find(query)
      .sort({ department: 1, program: 1, semester: 1, name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Subject.countDocuments(query);

    res.json({ 
      success: true, 
      subjects,
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

// @desc    Get single subject
// @route   GET /api/subjects/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }
    res.json({ success: true, subject });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @desc    Create subject
// @route   POST /api/subjects
// @access  Private (Admin/HOD only)
router.post('/', async (req, res) => {
  try {
    const subject = await Subject.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      subject
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
router.put('/:id', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const updatedSubject = await Subject.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Subject updated successfully',
      subject: updatedSubject
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    await Subject.findByIdAndDelete(req.params.id);

    res.json({
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
