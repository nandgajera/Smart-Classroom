const express = require('express');
const Faculty = require('../models/Faculty');
const User = require('../models/User');
const { authorize } = require('../middleware/auth');
const router = express.Router();

// @desc    Get all faculty
// @route   GET /api/faculty
// @access  Private
router.get('/', async (req, res) => {
  try {
    const faculty = await Faculty.find().populate('user', 'name email department employeeId isActive');
    res.json({ success: true, faculty });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @desc    Get single faculty
// @route   GET /api/faculty/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id).populate('user');
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }
    res.json({ success: true, faculty });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @desc    Create faculty
// @route   POST /api/faculty
// @access  Private (Admin/HOD only)
router.post('/', async (req, res) => {
  try {
    const { name, email, password, employeeId, department, designation, expertices, maxWeeklyHours, isActive } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Create user first
    const user = await User.create({
      name,
      email,
      password,
      role: 'faculty',
      department,
      employeeId,
      isActive: isActive !== undefined ? isActive : true
    });

    // Create faculty profile
    const faculty = await Faculty.create({
      user: user._id,
      designation: designation || 'Lecturer',
      expertices: Array.isArray(expertices) ? expertices : (expertices ? expertices.split(',').map(s => s.trim()) : []),
      maxWeeklyHours: maxWeeklyHours || 20,
      currentLoad: 0
    });

    const populatedFaculty = await Faculty.findById(faculty._id).populate('user', 'name email department employeeId isActive');

    res.status(201).json({
      success: true,
      message: 'Faculty created successfully',
      faculty: populatedFaculty
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @desc    Update faculty
// @route   PUT /api/faculty/:id
// @access  Private (Admin/HOD only)
router.put('/:id', async (req, res) => {
  try {
    const { name, email, employeeId, department, designation, expertices, maxWeeklyHours, isActive } = req.body;

    const faculty = await Faculty.findById(req.params.id).populate('user');
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }

    // Update user information
    const userUpdates = {};
    if (name) userUpdates.name = name;
    if (email) userUpdates.email = email;
    if (employeeId) userUpdates.employeeId = employeeId;
    if (department) userUpdates.department = department;
    if (isActive !== undefined) userUpdates.isActive = isActive;

    await User.findByIdAndUpdate(faculty.user._id, userUpdates);

    // Update faculty information
    const facultyUpdates = {};
    if (designation) facultyUpdates.designation = designation;
    if (expertices) {
      facultyUpdates.expertices = Array.isArray(expertices) ? expertices : expertices.split(',').map(s => s.trim());
    }
    if (maxWeeklyHours) facultyUpdates.maxWeeklyHours = maxWeeklyHours;

    await Faculty.findByIdAndUpdate(req.params.id, facultyUpdates);

    const updatedFaculty = await Faculty.findById(req.params.id).populate('user', 'name email department employeeId isActive');

    res.json({
      success: true,
      message: 'Faculty updated successfully',
      faculty: updatedFaculty
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @desc    Delete faculty
// @route   DELETE /api/faculty/:id
// @access  Private (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id).populate('user');
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }

    // Delete faculty record
    await Faculty.findByIdAndDelete(req.params.id);
    // Delete associated user
    await User.findByIdAndDelete(faculty.user._id);

    res.json({
      success: true,
      message: 'Faculty deleted successfully'
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;