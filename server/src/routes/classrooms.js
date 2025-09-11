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
      classrooms: classrooms, // Keep both for compatibility
      data: classrooms,
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

// @desc    Get classroom by ID
// @route   GET /api/classrooms/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    res.status(200).json({ success: true, data: classroom });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @desc    Create classroom
// @route   POST /api/classrooms
// @access  Private (Admin only)
router.post('/', async (req, res) => {
  try {
    const classroom = await Classroom.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Classroom created successfully',
      data: classroom
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// <<<<<<< HEAD
// @desc    Get single classroom
// @route   GET /api/classrooms/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return res.status(404).json({ success: false, message: 'Classroom not found' });
    }
    res.json({ success: true, classroom });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @desc    Update classroom
// @route   PUT /api/classrooms/:id
// @access  Private (Admin only)
router.put('/:id', async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
// =======
// // @desc    Update classroom
// // @route   PUT /api/classrooms/:id
// // @access  Private (Admin/HOD)
// router.put('/:id', authorize('admin', 'hod'), async (req, res) => {
//   try {
//     const classroom = await Classroom.findById(req.params.id);

// >>>>>>> 5a85c3e28a014e3c93a6517daa9bd4bb4eb511b1
    if (!classroom) {
      return res.status(404).json({ success: false, message: 'Classroom not found' });
    }

// <<<<<<< HEAD
    const updatedClassroom = await Classroom.findByIdAndUpdate(
// =======
//     const updated = await Classroom.findByIdAndUpdate(
// >>>>>>> 5a85c3e28a014e3c93a6517daa9bd4bb4eb511b1
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

// <<<<<<< HEAD
    res.json({
      success: true,
      message: 'Classroom updated successfully',
      classroom: updatedClassroom
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Delete classroom
// @route   DELETE /api/classrooms/:id
// @access  Private (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
// =======
    res.status(200).json({ success: true, message: 'Classroom updated successfully', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @desc    Delete classroom (soft delete)
// @route   DELETE /api/classrooms/:id
// @access  Private (Admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);

// >>>>>>> 5a85c3e28a014e3c93a6517daa9bd4bb4eb511b1
    if (!classroom) {
      return res.status(404).json({ success: false, message: 'Classroom not found' });
    }

// <<<<<<< HEAD
    await Classroom.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Classroom deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
// =======
//     await Classroom.findByIdAndUpdate(req.params.id, { isActive: false });

//     res.status(200).json({ success: true, message: 'Classroom deleted successfully' });
//   } catch (error) {
//     res.status(400).json({ success: false, message: error.message });
// >>>>>>> 5a85c3e28a014e3c93a6517daa9bd4bb4eb511b1
  }
});

module.exports = router;
