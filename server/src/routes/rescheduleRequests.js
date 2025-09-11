const express = require('express');
const router = express.Router();
const RescheduleRequest = require('../models/RescheduleRequest');
const ScheduledSession = require('../models/ScheduledSession');
const Faculty = require('../models/Faculty');
const Classroom = require('../models/Classroom');
const { auth, facultyAuth, adminAuth } = require('../middleware/auth');

// @route   GET /api/reschedule-requests
// @desc    Get all reschedule requests for a faculty member
// @access  Private (Faculty)
router.get('/', auth, facultyAuth, async (req, res) => {
  try {
    const { status, dateRange, limit = 10, page = 1 } = req.query;
    
    // Find faculty record
    const faculty = await Faculty.findOne({ user: req.user._id });
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty profile not found' });
    }

    // Build query options
    const options = {};
    if (status) options.status = status;
    if (dateRange) {
      const [start, end] = dateRange.split(',');
      options.dateRange = {
        start: new Date(start),
        end: new Date(end)
      };
    }

    // Get reschedule requests with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const rescheduleRequests = await RescheduleRequest.findByFaculty(faculty._id, options)
      .limit(parseInt(limit))
      .skip(skip);

    // Get total count for pagination
    const total = await RescheduleRequest.countDocuments({
      faculty: faculty._id,
      isActive: true,
      ...(status && { status }),
      ...(options.dateRange && {
        $or: [
          { originalDate: { $gte: options.dateRange.start, $lte: options.dateRange.end } },
          { requestedDate: { $gte: options.dateRange.start, $lte: options.dateRange.end } }
        ]
      })
    });

    res.json({
      success: true,
      data: rescheduleRequests,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Get reschedule requests error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching reschedule requests',
      error: error.message 
    });
  }
});

// @route   GET /api/reschedule-requests/:id
// @desc    Get a specific reschedule request
// @access  Private (Faculty)
router.get('/:id', auth, facultyAuth, async (req, res) => {
  try {
    const rescheduleRequest = await RescheduleRequest.findById(req.params.id)
      .populate('faculty', 'user')
      .populate('originalSession')
      .populate('originalClassroom', 'roomNumber type capacity')
      .populate('requestedClassroom', 'roomNumber type capacity')
      .populate('approvedBy', 'name email')
      .populate('affectedParties.faculty', 'user')
      .populate('affectedParties.batch', 'name');

    if (!rescheduleRequest) {
      return res.status(404).json({ message: 'Reschedule request not found' });
    }

    // Check if faculty owns this request
    const faculty = await Faculty.findOne({ user: req.user._id });
    if (rescheduleRequest.faculty.toString() !== faculty._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      success: true,
      data: rescheduleRequest
    });
  } catch (error) {
    console.error('Get reschedule request error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching reschedule request',
      error: error.message 
    });
  }
});

// @route   POST /api/reschedule-requests
// @desc    Create a new reschedule request
// @access  Private (Faculty)
router.post('/', auth, facultyAuth, async (req, res) => {
  try {
    const {
      originalSessionId,
      requestedDate,
      requestedStartTime,
      requestedEndTime,
      requestedClassroomId,
      rescheduleType,
      reason,
      priority,
      alternativeOptions
    } = req.body;

    // Find faculty record
    const faculty = await Faculty.findOne({ user: req.user._id }).populate('user', 'name email');
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty profile not found' });
    }

    // Validate original session exists and belongs to faculty
    const originalSession = await ScheduledSession.findById(originalSessionId)
      .populate('subject', 'name')
      .populate('batch', 'name')
      .populate('classroom', 'roomNumber');

    if (!originalSession) {
      return res.status(404).json({ message: 'Original session not found' });
    }

    if (originalSession.faculty.toString() !== faculty._id.toString()) {
      return res.status(403).json({ message: 'You can only reschedule your own sessions' });
    }

    // Check if there's already a pending request for this session
    const existingRequest = await RescheduleRequest.findOne({
      originalSession: originalSessionId,
      status: 'pending',
      isActive: true
    });

    if (existingRequest) {
      return res.status(400).json({ 
        message: 'There is already a pending reschedule request for this session' 
      });
    }

    // Validate requested classroom if specified
    let requestedClassroom = null;
    if (requestedClassroomId) {
      requestedClassroom = await Classroom.findById(requestedClassroomId);
      if (!requestedClassroom) {
        return res.status(404).json({ message: 'Requested classroom not found' });
      }
    }

    // Check for conflicts in requested time slot
    const conflictingRequests = await RescheduleRequest.findConflictingRequests(
      new Date(requestedDate),
      requestedStartTime,
      requestedEndTime,
      requestedClassroomId
    );

    if (conflictingRequests.length > 0) {
      return res.status(409).json({
        message: 'The requested time slot conflicts with another reschedule request',
        conflicts: conflictingRequests
      });
    }

    // Create reschedule request
    const rescheduleRequest = new RescheduleRequest({
      faculty: faculty._id,
      originalSession: originalSessionId,
      originalDate: originalSession.day ? 
        new Date(`${originalSession.day} ${originalSession.startTime}`) : 
        new Date(),
      originalStartTime: originalSession.startTime,
      originalEndTime: originalSession.endTime,
      originalClassroom: originalSession.classroom._id,
      requestedDate: new Date(requestedDate),
      requestedStartTime,
      requestedEndTime,
      requestedClassroom: requestedClassroomId,
      rescheduleType,
      reason,
      priority: priority || 'medium',
      alternativeOptions: alternativeOptions || [],
      submissionDate: new Date()
    });

    await rescheduleRequest.save();

    // Populate the response
    await rescheduleRequest.populate([
      { path: 'faculty', select: 'user' },
      { path: 'originalSession' },
      { path: 'originalClassroom', select: 'roomNumber type' },
      { path: 'requestedClassroom', select: 'roomNumber type' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Reschedule request submitted successfully',
      data: rescheduleRequest
    });
  } catch (error) {
    console.error('Create reschedule request error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while creating reschedule request',
      error: error.message 
    });
  }
});

// @route   PUT /api/reschedule-requests/:id
// @desc    Update a reschedule request (only if pending)
// @access  Private (Faculty)
router.put('/:id', auth, facultyAuth, async (req, res) => {
  try {
    const rescheduleRequest = await RescheduleRequest.findById(req.params.id);
    
    if (!rescheduleRequest) {
      return res.status(404).json({ message: 'Reschedule request not found' });
    }

    // Check if faculty owns this request
    const faculty = await Faculty.findOne({ user: req.user._id });
    if (rescheduleRequest.faculty.toString() !== faculty._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only allow updates for pending requests
    if (rescheduleRequest.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Cannot update a reschedule request that is not pending' 
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'requestedDate', 'requestedStartTime', 'requestedEndTime',
      'requestedClassroom', 'rescheduleType', 'reason', 'priority',
      'alternativeOptions'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        rescheduleRequest[field] = req.body[field];
      }
    });

    rescheduleRequest.lastModified = new Date();

    await rescheduleRequest.save();
    await rescheduleRequest.populate([
      { path: 'faculty', select: 'user' },
      { path: 'originalSession' },
      { path: 'originalClassroom', select: 'roomNumber type' },
      { path: 'requestedClassroom', select: 'roomNumber type' }
    ]);

    res.json({
      success: true,
      message: 'Reschedule request updated successfully',
      data: rescheduleRequest
    });
  } catch (error) {
    console.error('Update reschedule request error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating reschedule request',
      error: error.message 
    });
  }
});

// @route   DELETE /api/reschedule-requests/:id
// @desc    Cancel/Delete a reschedule request
// @access  Private (Faculty)
router.delete('/:id', auth, facultyAuth, async (req, res) => {
  try {
    const rescheduleRequest = await RescheduleRequest.findById(req.params.id);
    
    if (!rescheduleRequest) {
      return res.status(404).json({ message: 'Reschedule request not found' });
    }

    // Check if faculty owns this request
    const faculty = await Faculty.findOne({ user: req.user._id });
    if (rescheduleRequest.faculty.toString() !== faculty._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only allow cancellation for pending or approved requests
    if (!['pending', 'approved'].includes(rescheduleRequest.status)) {
      return res.status(400).json({ 
        message: 'Cannot cancel this reschedule request' 
      });
    }

    rescheduleRequest.status = 'cancelled';
    rescheduleRequest.lastModified = new Date();
    await rescheduleRequest.save();

    res.json({
      success: true,
      message: 'Reschedule request cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel reschedule request error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while cancelling reschedule request',
      error: error.message 
    });
  }
});

// @route   GET /api/reschedule-requests/sessions
// @desc    Get faculty's scheduled sessions for reschedule requests
// @access  Private (Faculty)
router.get('/sessions', auth, facultyAuth, async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    
    const faculty = await Faculty.findOne({ user: req.user._id });
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty profile not found' });
    }

    // Build date filter
    const dateFilter = {};
    if (fromDate) dateFilter.$gte = new Date(fromDate);
    if (toDate) dateFilter.$lte = new Date(toDate);

    const sessions = await ScheduledSession.find({
      faculty: faculty._id,
      isActive: true,
      ...(Object.keys(dateFilter).length > 0 && { 
        // Assuming we have a date field in ScheduledSession
        createdAt: dateFilter 
      })
    })
    .populate('subject', 'name code')
    .populate('batch', 'name')
    .populate('classroom', 'roomNumber type')
    .sort({ day: 1, startTime: 1 });

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Get faculty sessions error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching sessions',
      error: error.message 
    });
  }
});

// @route   GET /api/reschedule-requests/admin/pending
// @desc    Get all pending reschedule requests (Admin only)
// @access  Private (Admin)
router.get('/admin/pending', auth, adminAuth, async (req, res) => {
  try {
    const pendingRequests = await RescheduleRequest.getPendingRequests();
    
    res.json({
      success: true,
      data: pendingRequests
    });
  } catch (error) {
    console.error('Get pending reschedule requests error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching pending requests',
      error: error.message 
    });
  }
});

// @route   POST /api/reschedule-requests/:id/approve
// @desc    Approve a reschedule request (Admin only)
// @access  Private (Admin)
router.post('/:id/approve', auth, adminAuth, async (req, res) => {
  try {
    const { comments, approvedSchedule } = req.body;
    
    const rescheduleRequest = await RescheduleRequest.findById(req.params.id);
    if (!rescheduleRequest) {
      return res.status(404).json({ message: 'Reschedule request not found' });
    }

    if (rescheduleRequest.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Only pending requests can be approved' 
      });
    }

    await rescheduleRequest.approve(req.user._id, approvedSchedule, comments);
    await rescheduleRequest.populate([
      { path: 'faculty', select: 'user' },
      { path: 'originalSession' },
      { path: 'originalClassroom', select: 'roomNumber type' },
      { path: 'requestedClassroom', select: 'roomNumber type' }
    ]);

    res.json({
      success: true,
      message: 'Reschedule request approved successfully',
      data: rescheduleRequest
    });
  } catch (error) {
    console.error('Approve reschedule request error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while approving reschedule request',
      error: error.message 
    });
  }
});

// @route   POST /api/reschedule-requests/:id/reject
// @desc    Reject a reschedule request (Admin only)
// @access  Private (Admin)
router.post('/:id/reject', auth, adminAuth, async (req, res) => {
  try {
    const { comments } = req.body;
    
    if (!comments || comments.trim().length === 0) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }
    
    const rescheduleRequest = await RescheduleRequest.findById(req.params.id);
    if (!rescheduleRequest) {
      return res.status(404).json({ message: 'Reschedule request not found' });
    }

    if (rescheduleRequest.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Only pending requests can be rejected' 
      });
    }

    await rescheduleRequest.reject(req.user._id, comments);
    await rescheduleRequest.populate([
      { path: 'faculty', select: 'user' },
      { path: 'originalSession' },
      { path: 'originalClassroom', select: 'roomNumber type' },
      { path: 'requestedClassroom', select: 'roomNumber type' }
    ]);

    res.json({
      success: true,
      message: 'Reschedule request rejected',
      data: rescheduleRequest
    });
  } catch (error) {
    console.error('Reject reschedule request error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while rejecting reschedule request',
      error: error.message 
    });
  }
});

// @route   GET /api/reschedule-requests/statistics
// @desc    Get reschedule request statistics for faculty
// @access  Private (Faculty)
router.get('/statistics', auth, facultyAuth, async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ user: req.user._id });
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty profile not found' });
    }

    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31);

    const statistics = await RescheduleRequest.aggregate([
      {
        $match: {
          faculty: faculty._id,
          isActive: true,
          submissionDate: { $gte: yearStart, $lte: yearEnd }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      totalRequests: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
      completed: 0
    };

    statistics.forEach(stat => {
      stats.totalRequests += stat.count;
      stats[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get reschedule statistics error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching statistics',
      error: error.message 
    });
  }
});

module.exports = router;
