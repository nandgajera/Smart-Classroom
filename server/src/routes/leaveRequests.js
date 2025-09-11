const express = require('express');
const router = express.Router();
const LeaveRequest = require('../models/LeaveRequest');
const Faculty = require('../models/Faculty');
const { auth, facultyAuth, adminAuth } = require('../middleware/auth');

// @route   GET /api/leave-requests
// @desc    Get all leave requests for a faculty member
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

    // Get leave requests with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const leaveRequests = await LeaveRequest.findByFaculty(faculty._id, options)
      .limit(parseInt(limit))
      .skip(skip);

    // Get total count for pagination
    const total = await LeaveRequest.countDocuments({
      faculty: faculty._id,
      isActive: true,
      ...(status && { status }),
      ...(options.dateRange && {
        $or: [
          { startDate: { $gte: options.dateRange.start, $lte: options.dateRange.end } },
          { endDate: { $gte: options.dateRange.start, $lte: options.dateRange.end } }
        ]
      })
    });

    res.json({
      success: true,
      data: leaveRequests,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Get leave requests error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching leave requests',
      error: error.message 
    });
  }
});

// @route   GET /api/leave-requests/:id
// @desc    Get a specific leave request
// @access  Private (Faculty)
router.get('/:id', auth, facultyAuth, async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id)
      .populate('faculty', 'user')
      .populate('approvedBy', 'name email')
      .populate('affectedSessions.session')
      .populate('affectedSessions.replacementFaculty', 'user');

    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Check if faculty owns this request
    const faculty = await Faculty.findOne({ user: req.user._id });
    if (leaveRequest.faculty.toString() !== faculty._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      success: true,
      data: leaveRequest
    });
  } catch (error) {
    console.error('Get leave request error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching leave request',
      error: error.message 
    });
  }
});

// @route   POST /api/leave-requests
// @desc    Create a new leave request
// @access  Private (Faculty)
router.post('/', auth, facultyAuth, async (req, res) => {
  try {
    const {
      leaveType,
      startDate,
      endDate,
      startTime,
      endTime,
      isFullDay,
      reason,
      priority,
      documents
    } = req.body;

    // Find faculty record
    const faculty = await Faculty.findOne({ user: req.user._id }).populate('user', 'name email');
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty profile not found' });
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return res.status(400).json({ message: 'Start date cannot be after end date' });
    }

    // Check for overlapping leave requests
    const overlappingRequests = await LeaveRequest.find({
      faculty: faculty._id,
      status: { $in: ['pending', 'approved'] },
      isActive: true,
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });

    if (overlappingRequests.length > 0) {
      return res.status(400).json({ 
        message: 'You already have a leave request for this period',
        conflicts: overlappingRequests
      });
    }

    // Create leave request
    const leaveRequest = new LeaveRequest({
      faculty: faculty._id,
      leaveType,
      startDate: start,
      endDate: end,
      startTime: startTime || '09:00',
      endTime: endTime || '17:00',
      isFullDay: isFullDay !== undefined ? isFullDay : true,
      reason,
      priority: priority || 'medium',
      documents: documents || [],
      submissionDate: new Date()
    });

    await leaveRequest.save();

    // Populate the response
    await leaveRequest.populate('faculty', 'user');

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: leaveRequest
    });
  } catch (error) {
    console.error('Create leave request error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while creating leave request',
      error: error.message 
    });
  }
});

// @route   PUT /api/leave-requests/:id
// @desc    Update a leave request (only if pending)
// @access  Private (Faculty)
router.put('/:id', auth, facultyAuth, async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);
    
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Check if faculty owns this request
    const faculty = await Faculty.findOne({ user: req.user._id });
    if (leaveRequest.faculty.toString() !== faculty._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only allow updates for pending requests
    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Cannot update a leave request that is not pending' 
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'leaveType', 'startDate', 'endDate', 'startTime', 
      'endTime', 'isFullDay', 'reason', 'priority', 'documents'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        leaveRequest[field] = req.body[field];
      }
    });

    leaveRequest.lastModified = new Date();

    await leaveRequest.save();
    await leaveRequest.populate('faculty', 'user');

    res.json({
      success: true,
      message: 'Leave request updated successfully',
      data: leaveRequest
    });
  } catch (error) {
    console.error('Update leave request error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating leave request',
      error: error.message 
    });
  }
});

// @route   DELETE /api/leave-requests/:id
// @desc    Cancel/Delete a leave request
// @access  Private (Faculty)
router.delete('/:id', auth, facultyAuth, async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);
    
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Check if faculty owns this request
    const faculty = await Faculty.findOne({ user: req.user._id });
    if (leaveRequest.faculty.toString() !== faculty._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only allow cancellation for pending or approved requests
    if (!['pending', 'approved'].includes(leaveRequest.status)) {
      return res.status(400).json({ 
        message: 'Cannot cancel this leave request' 
      });
    }

    leaveRequest.status = 'cancelled';
    leaveRequest.lastModified = new Date();
    await leaveRequest.save();

    res.json({
      success: true,
      message: 'Leave request cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel leave request error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while cancelling leave request',
      error: error.message 
    });
  }
});

// @route   GET /api/leave-requests/admin/pending
// @desc    Get all pending leave requests (Admin only)
// @access  Private (Admin)
router.get('/admin/pending', auth, adminAuth, async (req, res) => {
  try {
    const pendingRequests = await LeaveRequest.getPendingRequests();
    
    res.json({
      success: true,
      data: pendingRequests
    });
  } catch (error) {
    console.error('Get pending leave requests error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching pending requests',
      error: error.message 
    });
  }
});

// @route   POST /api/leave-requests/:id/approve
// @desc    Approve a leave request (Admin only)
// @access  Private (Admin)
router.post('/:id/approve', auth, adminAuth, async (req, res) => {
  try {
    const { comments } = req.body;
    
    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Only pending requests can be approved' 
      });
    }

    await leaveRequest.approve(req.user._id, comments);
    await leaveRequest.populate('faculty', 'user');

    res.json({
      success: true,
      message: 'Leave request approved successfully',
      data: leaveRequest
    });
  } catch (error) {
    console.error('Approve leave request error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while approving leave request',
      error: error.message 
    });
  }
});

// @route   POST /api/leave-requests/:id/reject
// @desc    Reject a leave request (Admin only)
// @access  Private (Admin)
router.post('/:id/reject', auth, adminAuth, async (req, res) => {
  try {
    const { comments } = req.body;
    
    if (!comments || comments.trim().length === 0) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }
    
    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Only pending requests can be rejected' 
      });
    }

    await leaveRequest.reject(req.user._id, comments);
    await leaveRequest.populate('faculty', 'user');

    res.json({
      success: true,
      message: 'Leave request rejected',
      data: leaveRequest
    });
  } catch (error) {
    console.error('Reject leave request error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while rejecting leave request',
      error: error.message 
    });
  }
});

// @route   GET /api/leave-requests/statistics
// @desc    Get leave request statistics for faculty
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

    const statistics = await LeaveRequest.aggregate([
      {
        $match: {
          faculty: faculty._id,
          isActive: true,
          startDate: { $gte: yearStart, $lte: yearEnd }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalDays: {
            $sum: {
              $add: [
                {
                  $divide: [
                    { $subtract: ['$endDate', '$startDate'] },
                    86400000 // milliseconds in a day
                  ]
                },
                1
              ]
            }
          }
        }
      }
    ]);

    const stats = {
      totalRequests: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
      totalLeaveDays: 0
    };

    statistics.forEach(stat => {
      stats.totalRequests += stat.count;
      stats[stat._id] = stat.count;
      if (stat._id === 'approved') {
        stats.totalLeaveDays += Math.round(stat.totalDays);
      }
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get leave statistics error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching statistics',
      error: error.message 
    });
  }
});

module.exports = router;
