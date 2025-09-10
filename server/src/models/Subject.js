const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Subject code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  credits: {
    type: Number,
    required: [true, 'Credits are required'],
    min: [1, 'Credits must be at least 1'],
    max: [10, 'Credits cannot exceed 10']
  },
  type: {
    type: String,
    enum: ['theory', 'lab', 'tutorial', 'seminar', 'project'],
    required: [true, 'Subject type is required']
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: [1, 'Semester must be at least 1'],
    max: [8, 'Semester cannot exceed 8']
  },
  program: {
    type: String,
    enum: ['UG', 'PG', 'PhD'],
    required: [true, 'Program type is required']
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  sessionsPerWeek: {
    type: Number,
    required: [true, 'Sessions per week is required'],
    min: [1, 'Must have at least 1 session per week'],
    max: [10, 'Cannot exceed 10 sessions per week']
  },
  sessionDuration: {
    type: Number, // in minutes
    required: [true, 'Session duration is required'],
    enum: [45, 60, 90, 120, 180] // Common class durations
  },
  classroomRequirements: {
    type: {
      type: String,
      enum: ['lecture_hall', 'laboratory', 'seminar_room', 'auditorium', 'computer_lab', 'tutorial_room']
    },
    minCapacity: {
      type: Number,
      default: 30
    },
    facilities: [{
      type: String,
      enum: ['projector', 'whiteboard', 'computer', 'audio_system', 'video_conferencing', 'air_conditioning', 'internet']
    }]
  },
  facultyRequirements: {
    specialization: [String],
    minDesignation: {
      type: String,
      enum: ['Lecturer', 'Assistant Professor', 'Associate Professor', 'Professor']
    }
  },
  isElective: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required']
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
subjectSchema.index({ code: 1 });
subjectSchema.index({ department: 1, semester: 1, program: 1 });
subjectSchema.index({ type: 1 });
subjectSchema.index({ academicYear: 1, isActive: 1 });

// Virtual for total weekly hours
subjectSchema.virtual('weeklyHours').get(function() {
  return (this.sessionsPerWeek * this.sessionDuration) / 60; // Convert to hours
});

// Static method to find subjects by criteria
subjectSchema.statics.findByDepartmentAndSemester = function(department, semester, program) {
  return this.find({
    department,
    semester,
    program,
    isActive: true
  }).populate('prerequisites');
};

module.exports = mongoose.model('Subject', subjectSchema);
