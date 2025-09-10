const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Batch name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Batch code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  program: {
    type: String,
    enum: ['UG', 'PG', 'PhD'],
    required: [true, 'Program type is required']
  },
  semester: {
    type: Number,
    required: [true, 'Current semester is required'],
    min: [1, 'Semester must be at least 1'],
    max: [8, 'Semester cannot exceed 8']
  },
  section: {
    type: String,
    default: 'A',
    trim: true
  },
  enrolledStudents: {
    type: Number,
    required: [true, 'Number of enrolled students is required'],
    min: [1, 'Must have at least 1 enrolled student']
  },
  maxCapacity: {
    type: Number,
    required: [true, 'Maximum capacity is required'],
    min: [1, 'Maximum capacity must be at least 1']
  },
  subjects: [{
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty'
    },
    isElective: {
      type: Boolean,
      default: false
    },
    enrolledCount: {
      type: Number,
      default: 0
    }
  }],
  academicYear: {
    type: String,
    required: [true, 'Academic year is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  shift: {
    type: String,
    enum: ['morning', 'afternoon', 'evening'],
    default: 'morning'
  },
  classRepresentative: {
    name: String,
    email: String,
    phone: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  constraints: {
    maxClassesPerDay: {
      type: Number,
      default: 8
    },
    preferredTimeSlots: [{
      day: String,
      startTime: String,
      endTime: String
    }],
    blockedTimeSlots: [{
      day: String,
      startTime: String,
      endTime: String,
      reason: String
    }]
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
batchSchema.index({ code: 1 });
batchSchema.index({ department: 1, program: 1, semester: 1 });
batchSchema.index({ academicYear: 1, isActive: 1 });

// Virtual for batch identifier
batchSchema.virtual('identifier').get(function() {
  return `${this.program}-${this.department}-${this.semester}-${this.section}`;
});

// Static method to find batches by department and semester
batchSchema.statics.findByDepartmentAndSemester = function(department, semester, academicYear) {
  return this.find({
    department,
    semester,
    academicYear,
    isActive: true
  }).populate('subjects.subject subjects.faculty');
};

// Method to get total enrolled students across all subjects
batchSchema.methods.getTotalEnrollment = function() {
  return this.subjects.reduce((total, subject) => {
    return total + (subject.enrolledCount || this.enrolledStudents);
  }, 0) / this.subjects.length || this.enrolledStudents;
};

// Validation for start and end dates
batchSchema.pre('save', function(next) {
  if (this.startDate >= this.endDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

module.exports = mongoose.model('Batch', batchSchema);
