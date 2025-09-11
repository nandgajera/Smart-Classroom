const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { authenticate, authorize } = require('../middleware/auth');

// @desc    Get students with filters
// @route   GET /api/students
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      school, 
      course, 
      semester, 
      academicYear, 
      status, 
      feeStatus, 
      documentStatus,
      search,
      page = 1, 
      limit = 10 
    } = req.query;

    // Build query object
    let query = { isActive: true };
    
    if (school) query.school = school;
    if (course) query.course = course;
    if (semester) query.currentSemester = parseInt(semester);
    if (academicYear) query.academicYear = academicYear;
    if (status) query.status = status;
    if (feeStatus) query['fees.status'] = feeStatus;
    if (documentStatus) query['documents.status'] = documentStatus;
    
    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { rollNo: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(query)
      .populate('school', 'name code')
      .populate('course', 'name code')
      .populate('batch', 'name code')
      .sort({ rollNo: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Student.countDocuments(query);

    res.json({
      success: true,
      count: students.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: students
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Get students by academic info
// @route   GET /api/students/academic/:schoolId/:courseId/:semester
// @access  Private
router.get('/academic/:schoolId/:courseId/:semester', authenticate, async (req, res) => {
  try {
    const { schoolId, courseId, semester } = req.params;
    
    const students = await Student.findByAcademicInfo(
      schoolId, 
      courseId, 
      parseInt(semester)
    );

    // Calculate statistics
    const totalStudents = students.length;
    const avgAttendance = students.reduce((sum, student) => sum + student.attendance.overall, 0) / totalStudents || 0;
    const pendingFees = students.filter(s => s.fees.status === 'Pending' || s.fees.status === 'Overdue').length;
    const incompleteDocuments = students.filter(s => s.documents.status === 'Incomplete').length;

    res.json({
      success: true,
      count: totalStudents,
      statistics: {
        totalStudents,
        avgAttendance: Math.round(avgAttendance * 10) / 10,
        pendingFees,
        incompleteDocuments
      },
      data: students
    });
  } catch (error) {
    console.error('Error fetching students by academic info:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Get single student by ID
// @route   GET /api/students/:id
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('school', 'name code')
      .populate('course', 'name code duration')
      .populate('batch', 'name code')
      .populate('attendance.subjects.subject', 'name code');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Create new student
// @route   POST /api/students
// @access  Private (Admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const student = await Student.create(req.body);
    
    await student.populate([
      { path: 'school', select: 'name code' },
      { path: 'course', select: 'name code' }
    ]);

    res.status(201).json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Error creating student:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
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

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private (Admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    )
    .populate('school', 'name code')
    .populate('course', 'name code');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Error updating student:', error);
    
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

// @desc    Update student attendance
// @route   PUT /api/students/:id/attendance
// @access  Private (Admin, Faculty)
router.put('/:id/attendance', authenticate, authorize('admin', 'faculty'), async (req, res) => {
  try {
    const { subjectId, totalClasses, attendedClasses } = req.body;
    
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    await student.updateSubjectAttendance(subjectId, totalClasses, attendedClasses);
    
    await student.populate('attendance.subjects.subject', 'name code');

    res.json({
      success: true,
      data: student.attendance
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Add payment for student
// @route   POST /api/students/:id/payments
// @access  Private (Admin only)
router.post('/:id/payments', authenticate, authorize('admin'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const paymentData = {
      ...req.body,
      paymentDate: new Date()
    };

    await student.addPayment(paymentData);

    res.json({
      success: true,
      data: student.fees,
      message: 'Payment added successfully'
    });
  } catch (error) {
    console.error('Error adding payment:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Get student statistics
// @route   GET /api/students/statistics/overview
// @access  Private (Admin, HOD)
router.get('/statistics/overview', authenticate, authorize('admin', 'hod'), async (req, res) => {
  try {
    const { school, course, semester, academicYear } = req.query;
    
    let matchQuery = { isActive: true };
    if (school) matchQuery.school = school;
    if (course) matchQuery.course = course;
    if (semester) matchQuery.currentSemester = parseInt(semester);
    if (academicYear) matchQuery.academicYear = academicYear;

    const statistics = await Student.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalStudents: { $sum: 1 },
          avgAttendance: { $avg: '$attendance.overall' },
          totalFeeAmount: { $sum: '$fees.totalFee' },
          totalPaidAmount: { $sum: '$fees.paidAmount' },
          paidCount: { 
            $sum: { $cond: [{ $eq: ['$fees.status', 'Paid'] }, 1, 0] } 
          },
          pendingCount: { 
            $sum: { $cond: [{ $eq: ['$fees.status', 'Pending'] }, 1, 0] } 
          },
          overdueCount: { 
            $sum: { $cond: [{ $eq: ['$fees.status', 'Overdue'] }, 1, 0] } 
          },
          completeDocsCount: { 
            $sum: { $cond: [{ $eq: ['$documents.status', 'Complete'] }, 1, 0] } 
          },
          incompleteDocsCount: { 
            $sum: { $cond: [{ $eq: ['$documents.status', 'Incomplete'] }, 1, 0] } 
          }
        }
      }
    ]);

    const stats = statistics[0] || {
      totalStudents: 0,
      avgAttendance: 0,
      totalFeeAmount: 0,
      totalPaidAmount: 0,
      paidCount: 0,
      pendingCount: 0,
      overdueCount: 0,
      completeDocsCount: 0,
      incompleteDocsCount: 0
    };

    res.json({
      success: true,
      data: {
        ...stats,
        avgAttendance: Math.round(stats.avgAttendance * 10) / 10,
        feeCollectionRate: stats.totalFeeAmount > 0 ? 
          Math.round((stats.totalPaidAmount / stats.totalFeeAmount) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Delete student (soft delete)
// @route   DELETE /api/students/:id
// @access  Private (Admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { isActive: false, status: 'Inactive' },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: {},
      message: 'Student deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

module.exports = router;
