const express = require('express');
const mongoose = require('mongoose');
const Faculty = require('../models/Faculty');
const User = require('../models/User');
const FacultySubject = require('../models/FacultySubject');
const FacultyLeave = require('../models/FacultyLeave');
const FacultyFeedback = require('../models/FacultyFeedback');
const Subject = require('../models/Subject');
const Classroom = require('../models/Classroom');
const Batch = require('../models/Batch');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all faculty members
// @route   GET /api/faculty
// @access  Private (Admin, HOD)
router.get('/', authenticate, authorize('admin', 'hod'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      department,
      designation,
      isActive,
      search
    } = req.query;

    const query = {};
    
    if (department) query.departments = { $in: [department] };
    if (designation) query['professionalInfo.designation'] = designation;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const facultyMembers = await Faculty.find(query)
      .populate('user', 'name email')
      .populate('teachingInfo.preferredSubjects', 'name code')
      .sort({ 'professionalInfo.joiningDate': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // If search is provided, filter by name or email
    let filteredMembers = facultyMembers;
    if (search) {
      filteredMembers = facultyMembers.filter(faculty =>
        faculty.user.name.toLowerCase().includes(search.toLowerCase()) ||
        faculty.user.email.toLowerCase().includes(search.toLowerCase()) ||
        faculty.professionalInfo.employeeId?.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = await Faculty.countDocuments(query);

    res.status(200).json({
      success: true,
      data: filteredMembers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get faculty member by ID
// @route   GET /api/faculty/:id
// @access  Private (Admin, HOD, Faculty themselves)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id)
      .populate('user', 'name email department role')
      .populate('teachingInfo.preferredSubjects', 'name code department');

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty member not found'
      });
    }

    // Check if user has permission to view this faculty
    if (req.user.role === 'faculty' && faculty.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this faculty profile'
      });
    }

    res.status(200).json({
      success: true,
      data: faculty
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Create new faculty member
// @route   POST /api/faculty
// @access  Private (Admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { userData, facultyData } = req.body || {};

    if (!userData || !facultyData) {
      return res.status(400).json({ success: false, message: 'userData and facultyData are required' });
    }

    // Validate required user fields
    const requiredUserFields = ['name', 'email', 'password', 'department'];
    for (const field of requiredUserFields) {
      if (!userData[field] || String(userData[field]).trim() === '') {
        return res.status(400).json({ success: false, message: `Missing required field: userData.${field}` });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists' });
    }

    // Normalize faculty payload
    const normalizedFaculty = { ...facultyData };

    // Ensure departments include the user's department if none provided
    if (!Array.isArray(normalizedFaculty.departments) || normalizedFaculty.departments.length === 0) {
      normalizedFaculty.departments = [userData.department];
    }

    // Ensure professionalInfo exists
    normalizedFaculty.professionalInfo = {
      designation: 'Assistant Professor',
      ...normalizedFaculty.professionalInfo,
      joiningDate: new Date()
    };

    // If employeeId is empty string or falsy, set to null to satisfy unique+sparse
    if (!normalizedFaculty.professionalInfo.employeeId || String(normalizedFaculty.professionalInfo.employeeId).trim() === '') {
      normalizedFaculty.professionalInfo.employeeId = null;
    }

    // Create user first (role forced to faculty)
    const user = await User.create({
      ...userData,
      role: 'faculty'
    });

    // Create faculty profile linked to the user
    const faculty = await Faculty.create({
      user: user._id,
      ...normalizedFaculty
    });

    const populatedFaculty = await Faculty.findById(faculty._id)
      .populate('user', 'name email department role');

    res.status(201).json({
      success: true,
      message: 'Faculty member created successfully',
      data: populatedFaculty
    });
  } catch (error) {
    // Handle duplicate key errors nicely
    if (error.code === 11000) {
      const key = Object.keys(error.keyPattern || {})[0] || 'field';
      const dupMessage = key.includes('email')
        ? 'Email is already in use'
        : key.toLowerCase().includes('employeeid')
          ? 'Employee ID is already in use'
          : 'Duplicate value for a unique field';
      return res.status(400).json({ success: false, message: dupMessage });
    }

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get faculty timetable
// @route   GET /api/faculty/:id/timetable
// @access  Private (Admin, HOD, Faculty themselves)
router.get('/:id/timetable', authenticate, async (req, res) => {
  try {
    const { academicYear = '2024-25', semester } = req.query;

    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty member not found'
      });
    }

    // Check permissions
    if (req.user.role === 'faculty' && faculty.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this timetable'
      });
    }

    const query = {
      faculty: req.params.id,
      academicYear,
      status: 'active'
    };

    if (semester) query.semester = semester;

    const assignments = await FacultySubject.find(query)
      .populate('subject', 'name code type sessionsPerWeek sessionDuration')
      .populate('classroom', 'roomNumber building type')
      .populate('batch', 'name course semester');

    // Group by day and time
    const timetable = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: []
    };

    assignments.forEach(assignment => {
      assignment.schedule.forEach(slot => {
        timetable[slot.day].push({
          startTime: slot.startTime,
          endTime: slot.endTime,
          subject: assignment.subject,
          classroom: assignment.classroom,
          batch: assignment.batch,
          assignmentId: assignment._id
        });
      });
    });

    // Sort by time for each day
    Object.keys(timetable).forEach(day => {
      timetable[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    // Calculate workload summary
    const workloadSummary = await FacultySubject.getFacultyWorkload(req.params.id, academicYear, semester);

    res.status(200).json({
      success: true,
      data: {
        timetable,
        workloadSummary: workloadSummary[0] || { totalHours: 0, totalSessions: 0, subjectCount: 0 },
        academicYear,
        semester
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get faculty performance from feedback
// @route   GET /api/faculty/:id/performance
// @access  Private (Admin, HOD, Faculty themselves)
router.get('/:id/performance', authenticate, async (req, res) => {
  try {
    const { academicYear = '2024-25', semester } = req.query;

    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty member not found'
      });
    }

    // Check permissions
    if (req.user.role === 'faculty' && faculty.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this performance data'
      });
    }

    // Get overall performance
    const overallPerformance = await FacultyFeedback.getFacultyPerformance(
      req.params.id,
      academicYear,
      semester
    );

    // Get subject-wise performance
    const subjectWisePerformance = await FacultyFeedback.getSubjectWisePerformance(
      req.params.id,
      academicYear
    );

    // Get rating distribution
    const ratingDistribution = await FacultyFeedback.getRatingDistribution(
      req.params.id,
      academicYear
    );

    res.status(200).json({
      success: true,
      data: {
        overall: overallPerformance,
        subjectWise: subjectWisePerformance,
        distribution: ratingDistribution,
        academicYear,
        semester
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get faculty leave schedule
// @route   GET /api/faculty/:id/leaves
// @access  Private (Admin, HOD, Faculty themselves)
router.get('/:id/leaves', authenticate, async (req, res) => {
  try {
    const { academicYear = '2024-25', status } = req.query;

    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty member not found'
      });
    }

    // Check permissions
    if (req.user.role === 'faculty' && faculty.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this leave data'
      });
    }

    const query = {
      faculty: req.params.id,
      academicYear
    };

    if (status) query.status = status;

    const leaves = await FacultyLeave.find(query)
      .populate('reviewedBy', 'name')
      .populate('substituteArrangements.substituteFaculty', 'user')
      .populate('substituteArrangements.subject', 'name code')
      .populate('substituteArrangements.classroom', 'roomNumber building')
      .sort({ appliedDate: -1 });

    // Get leave balance
    const leaveBalance = await FacultyLeave.getLeaveBalance(req.params.id, academicYear);

    res.status(200).json({
      success: true,
      data: {
        leaves,
        balance: leaveBalance,
        academicYear
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Assign subject to faculty
// @route   POST /api/faculty/assign-subject
// @access  Private (Admin, HOD)
router.post('/assign-subject', authenticate, authorize('admin', 'hod'), async (req, res) => {
  try {
    const {
      facultyId,
      subjectId,
      batchId,
      classroomId,
      semester,
      academicYear = '2024-25',
      schedule = []
    } = req.body;

    // Validate required fields
    if (!facultyId || !subjectId || !batchId) {
      return res.status(400).json({
        success: false,
        message: 'Faculty ID, Subject ID, and Batch ID are required'
      });
    }

    // Check if faculty exists
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty member not found'
      });
    }

    // Check if subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Check if batch exists
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    // Check if classroom exists (if provided)
    let classroom = null;
    if (classroomId) {
      classroom = await Classroom.findById(classroomId);
      if (!classroom) {
        return res.status(404).json({
          success: false,
          message: 'Classroom not found'
        });
      }
    }

    // Check for existing assignment
    const existingAssignment = await FacultySubject.findOne({
      faculty: facultyId,
      subject: subjectId,
      batch: batchId,
      semester,
      academicYear,
      status: 'active'
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: 'This faculty is already assigned to teach this subject for this batch'
      });
    }

    // Create the assignment
    const assignment = await FacultySubject.create({
      faculty: facultyId,
      subject: subjectId,
      batch: batchId,
      classroom: classroomId || null,
      semester,
      academicYear,
      schedule: schedule.length > 0 ? schedule : [],
      status: 'active',
      assignedBy: req.user.id,
      assignedDate: new Date()
    });

    const populatedAssignment = await FacultySubject.findById(assignment._id)
      .populate('faculty', 'user professionalInfo')
      .populate('subject', 'name code type')
      .populate('batch', 'name course')
      .populate('classroom', 'roomNumber building type');

    res.status(201).json({
      success: true,
      message: 'Subject assigned to faculty successfully',
      data: populatedAssignment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
