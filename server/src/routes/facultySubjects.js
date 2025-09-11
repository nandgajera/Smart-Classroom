const express = require('express');
const mongoose = require('mongoose');
const FacultySubject = require('../models/FacultySubject');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const Classroom = require('../models/Classroom');
const Batch = require('../models/Batch');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all faculty subject assignments
// @route   GET /api/faculty-subjects
// @access  Private (Admin, HOD)
router.get('/', authenticate, authorize('admin', 'hod'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      academicYear = '2024-25',
      semester,
      faculty,
      subject,
      status = 'active'
    } = req.query;

    const query = { academicYear, status };
    if (semester) query.semester = semester;
    if (faculty) query.faculty = faculty;
    if (subject) query.subject = subject;

    const assignments = await FacultySubject.find(query)
      .populate('faculty', 'user professionalInfo.designation')
      .populate({
        path: 'faculty',
        populate: { path: 'user', select: 'name email' }
      })
      .populate('subject', 'name code credits type')
      .populate('classroom', 'roomNumber building capacity type')
      .populate('batch', 'name course semester')
      .populate('assignedBy', 'name email')
      .sort({ assignedDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await FacultySubject.countDocuments(query);

    res.status(200).json({
      success: true,
      data: assignments,
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

// @desc    Create new faculty subject assignment
// @route   POST /api/faculty-subjects
// @access  Private (Admin, HOD)
router.post('/', authenticate, authorize('admin', 'hod'), async (req, res) => {
  try {
    const {
      faculty,
      subject,
      classroom,
      batch,
      academicYear,
      semester,
      schedule,
      notes
    } = req.body;

    // Validate faculty exists
    const facultyMember = await Faculty.findById(faculty);
    if (!facultyMember) {
      return res.status(404).json({
        success: false,
        message: 'Faculty member not found'
      });
    }

    // Validate subject exists
    const subjectDoc = await Subject.findById(subject);
    if (!subjectDoc) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Validate classroom exists
    const classroomDoc = await Classroom.findById(classroom);
    if (!classroomDoc) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    // Check for time conflicts for faculty
    for (const slot of schedule) {
      const conflict = await FacultySubject.checkTimeConflict(
        faculty,
        slot.day,
        slot.startTime,
        slot.endTime
      );

      if (conflict) {
        return res.status(400).json({
          success: false,
          message: `Faculty has a time conflict on ${slot.day} from ${slot.startTime} to ${slot.endTime}`
        });
      }
    }

    // Check if assignment already exists
    const existingAssignment = await FacultySubject.findOne({
      faculty,
      subject,
      academicYear,
      semester,
      status: 'active'
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: 'This faculty is already assigned to this subject for the current semester'
      });
    }

    // Calculate workload
    const totalHours = schedule.reduce((total, slot) => {
      const startTime = new Date(`2000-01-01 ${slot.startTime}`);
      const endTime = new Date(`2000-01-01 ${slot.endTime}`);
      const hours = (endTime - startTime) / (1000 * 60 * 60);
      return total + hours;
    }, 0);

    const assignment = await FacultySubject.create({
      faculty,
      subject,
      classroom,
      batch,
      academicYear,
      semester,
      schedule,
      assignedBy: req.user.id,
      workload: {
        hoursPerWeek: totalHours,
        sessionsPerWeek: schedule.length
      },
      notes
    });

    const populatedAssignment = await FacultySubject.findById(assignment._id)
      .populate('faculty', 'user professionalInfo.designation')
      .populate({
        path: 'faculty',
        populate: { path: 'user', select: 'name email' }
      })
      .populate('subject', 'name code credits type')
      .populate('classroom', 'roomNumber building capacity type')
      .populate('batch', 'name course semester')
      .populate('assignedBy', 'name email');

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

// @desc    Update faculty subject assignment
// @route   PUT /api/faculty-subjects/:id
// @access  Private (Admin, HOD)
router.put('/:id', authenticate, authorize('admin', 'hod'), async (req, res) => {
  try {
    const assignment = await FacultySubject.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const { schedule, classroom, notes, status } = req.body;

    // If updating schedule, check for conflicts
    if (schedule) {
      for (const slot of schedule) {
        const conflict = await FacultySubject.checkTimeConflict(
          assignment.faculty,
          slot.day,
          slot.startTime,
          slot.endTime,
          req.params.id
        );

        if (conflict) {
          return res.status(400).json({
            success: false,
            message: `Faculty has a time conflict on ${slot.day} from ${slot.startTime} to ${slot.endTime}`
          });
        }
      }

      // Recalculate workload
      const totalHours = schedule.reduce((total, slot) => {
        const startTime = new Date(`2000-01-01 ${slot.startTime}`);
        const endTime = new Date(`2000-01-01 ${slot.endTime}`);
        const hours = (endTime - startTime) / (1000 * 60 * 60);
        return total + hours;
      }, 0);

      req.body.workload = {
        hoursPerWeek: totalHours,
        sessionsPerWeek: schedule.length
      };
    }

    const updatedAssignment = await FacultySubject.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('faculty', 'user professionalInfo.designation')
      .populate({
        path: 'faculty',
        populate: { path: 'user', select: 'name email' }
      })
      .populate('subject', 'name code credits type')
      .populate('classroom', 'roomNumber building capacity type')
      .populate('batch', 'name course semester')
      .populate('assignedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Assignment updated successfully',
      data: updatedAssignment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Delete faculty subject assignment
// @route   DELETE /api/faculty-subjects/:id
// @access  Private (Admin, HOD)
router.delete('/:id', authenticate, authorize('admin', 'hod'), async (req, res) => {
  try {
    const assignment = await FacultySubject.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Soft delete - mark as inactive
    await FacultySubject.findByIdAndUpdate(req.params.id, { status: 'inactive' });

    res.status(200).json({
      success: true,
      message: 'Assignment removed successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get faculty workload summary
// @route   GET /api/faculty-subjects/workload/:facultyId
// @access  Private (Admin, HOD)
router.get('/workload/:facultyId', authenticate, authorize('admin', 'hod'), async (req, res) => {
  try {
    const { academicYear = '2024-25', semester } = req.query;

    const workloadSummary = await FacultySubject.getFacultyWorkload(
      req.params.facultyId,
      academicYear,
      semester
    );

    const assignments = await FacultySubject.find({
      faculty: req.params.facultyId,
      academicYear,
      ...(semester && { semester }),
      status: 'active'
    })
      .populate('subject', 'name code credits type')
      .populate('classroom', 'roomNumber building')
      .select('subject classroom workload schedule semester');

    res.status(200).json({
      success: true,
      data: {
        summary: workloadSummary[0] || { totalHours: 0, totalSessions: 0, subjectCount: 0 },
        assignments,
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

// @desc    Get available faculty for subject assignment
// @route   GET /api/faculty-subjects/available-faculty
// @access  Private (Admin, HOD)
router.get('/available-faculty', authenticate, authorize('admin', 'hod'), async (req, res) => {
  try {
    const { subjectId, day, startTime, endTime, academicYear = '2024-25' } = req.query;

    if (!subjectId || !day || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Subject ID, day, start time, and end time are required'
      });
    }

    // Get subject details
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Find faculty members who meet the criteria
    const query = {
      isActive: true,
      departments: { $in: [subject.department] },
      'teachingInfo.specialization': { $in: [subject.department, ...subject.facultyRequirements?.specialization || []] }
    };

    const allFaculty = await Faculty.find(query)
      .populate('user', 'name email');

    // Filter out faculty who have conflicts at this time
    const availableFaculty = [];
    
    for (const faculty of allFaculty) {
      const conflict = await FacultySubject.checkTimeConflict(
        faculty._id,
        day,
        startTime,
        endTime
      );

      if (!conflict) {
        // Check if faculty is available at this time
        const availability = faculty.teachingInfo.availability.find(a => a.day === day);
        if (availability && startTime >= availability.startTime && endTime <= availability.endTime) {
          // Get current workload
          const workload = await FacultySubject.getFacultyWorkload(faculty._id, academicYear);
          const currentLoad = workload[0] || { totalHours: 0, totalSessions: 0, subjectCount: 0 };
          
          availableFaculty.push({
            ...faculty.toObject(),
            currentWorkload: currentLoad
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      data: availableFaculty,
      subject: {
        name: subject.name,
        code: subject.code,
        department: subject.department
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
