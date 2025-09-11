const mongoose = require('mongoose');

const scheduledSessionSchema = new mongoose.Schema({
  // References to core entities
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: [true, 'Faculty is required']
  },
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: [true, 'Classroom is required']
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: [true, 'Batch is required']
  },
  timeSlot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimeSlot',
    required: [true, 'Time slot is required']
  },
  
  // Time information (denormalized for efficiency)
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    required: [true, 'Day is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM']
  },
  duration: {
    type: Number, // in minutes
    required: [true, 'Duration is required']
  },
  
  // Session details
  sessionType: {
    type: String,
    enum: ['lecture', 'lab', 'tutorial', 'seminar', 'exam', 'project'],
    default: 'lecture'
  },
  group: {
    type: String,
    default: 'A' // For lab splitting or group sessions
  },
  maxStudents: {
    type: Number,
    default: function() {
      return this.batch?.enrolledStudents || 60;
    }
  },
  actualStudents: {
    type: Number,
    default: 0
  },
  
  // Academic context
  academicYear: {
    type: String,
    required: [true, 'Academic year is required']
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: [1, 'Semester must be at least 1'],
    max: [8, 'Semester cannot exceed 8']
  },
  department: {
    type: String,
    required: [true, 'Department is required']
  },
  
  // Status and metadata
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'cancelled', 'rescheduled', 'completed'],
    default: 'scheduled'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Additional information
  notes: {
    type: String,
    trim: true
  },
  requirements: {
    equipment: [String],
    specialInstructions: String,
    attendanceRequired: {
      type: Boolean,
      default: true
    }
  },
  
  // Conflict resolution
  priority: {
    type: Number,
    default: 1,
    min: [1, 'Priority must be at least 1'],
    max: [10, 'Priority cannot exceed 10']
  },
  conflictsWith: [{
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ScheduledSession'
    },
    conflictType: {
      type: String,
      enum: ['faculty_clash', 'classroom_clash', 'batch_clash', 'resource_clash']
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    resolved: {
      type: Boolean,
      default: false
    }
  }],
  
  // Tracking and history
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  schedulingVersion: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
scheduledSessionSchema.index({ academicYear: 1, semester: 1, department: 1 });
scheduledSessionSchema.index({ day: 1, startTime: 1, endTime: 1 });
scheduledSessionSchema.index({ faculty: 1, day: 1, startTime: 1 });
scheduledSessionSchema.index({ classroom: 1, day: 1, startTime: 1 });
scheduledSessionSchema.index({ batch: 1, day: 1, startTime: 1 });
scheduledSessionSchema.index({ subject: 1, sessionType: 1 });
scheduledSessionSchema.index({ status: 1, isActive: 1 });

// Virtual for session identifier
scheduledSessionSchema.virtual('identifier').get(function() {
  return `${this.day}-${this.startTime}-${this.subject?.code || 'Unknown'}-${this.group}`;
});

// Virtual for duration in hours
scheduledSessionSchema.virtual('durationHours').get(function() {
  return this.duration / 60;
});

// Method to check if session overlaps with another
scheduledSessionSchema.methods.overlapsWith = function(other) {
  if (this.day !== other.day) return false;
  
  const thisStart = this.timeToMinutes(this.startTime);
  const thisEnd = this.timeToMinutes(this.endTime);
  const otherStart = this.timeToMinutes(other.startTime);
  const otherEnd = this.timeToMinutes(other.endTime);
  
  return (thisStart < otherEnd) && (otherStart < thisEnd);
};

// Helper method to convert time string to minutes
scheduledSessionSchema.methods.timeToMinutes = function(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Method to detect conflicts with other sessions
scheduledSessionSchema.methods.detectConflicts = async function() {
  const conflicts = [];
  
  // Find overlapping sessions
  const overlappingSessions = await this.constructor.find({
    _id: { $ne: this._id },
    day: this.day,
    academicYear: this.academicYear,
    semester: this.semester,
    isActive: true,
    $or: [
      {
        startTime: { $lt: this.endTime },
        endTime: { $gt: this.startTime }
      }
    ]
  }).populate('faculty classroom batch subject');
  
  for (const session of overlappingSessions) {
    // Faculty conflict
    if (session.faculty._id.equals(this.faculty)) {
      conflicts.push({
        session: session._id,
        conflictType: 'faculty_clash',
        severity: 'high'
      });
    }
    
    // Classroom conflict
    if (session.classroom._id.equals(this.classroom)) {
      conflicts.push({
        session: session._id,
        conflictType: 'classroom_clash',
        severity: 'high'
      });
    }
    
    // Batch conflict
    if (session.batch._id.equals(this.batch)) {
      conflicts.push({
        session: session._id,
        conflictType: 'batch_clash',
        severity: 'high'
      });
    }
  }
  
  this.conflictsWith = conflicts;
  return conflicts;
};

// Static method to find sessions by various criteria
scheduledSessionSchema.statics.findByFaculty = function(facultyId, academicYear, semester) {
  return this.find({
    faculty: facultyId,
    academicYear,
    semester,
    isActive: true
  }).populate('subject classroom batch timeSlot').sort({ day: 1, startTime: 1 });
};

scheduledSessionSchema.statics.findByClassroom = function(classroomId, academicYear, semester) {
  return this.find({
    classroom: classroomId,
    academicYear,
    semester,
    isActive: true
  }).populate('subject faculty batch timeSlot').sort({ day: 1, startTime: 1 });
};

scheduledSessionSchema.statics.findByBatch = function(batchId, academicYear, semester) {
  return this.find({
    batch: batchId,
    academicYear,
    semester,
    isActive: true
  }).populate('subject faculty classroom timeSlot').sort({ day: 1, startTime: 1 });
};

// Static method to find available time slots for scheduling
scheduledSessionSchema.statics.findAvailableSlots = async function(criteria) {
  const {
    facultyId,
    classroomId,
    batchId,
    day,
    duration,
    academicYear,
    semester
  } = criteria;
  
  const conflicts = await this.find({
    $or: [
      { faculty: facultyId },
      { classroom: classroomId },
      { batch: batchId }
    ],
    day,
    academicYear,
    semester,
    isActive: true
  }).select('startTime endTime');
  
  // This would need to be combined with TimeSlot model to find truly available slots
  return conflicts;
};

// Pre-save middleware to ensure data consistency
scheduledSessionSchema.pre('save', function(next) {
  const startMinutes = this.timeToMinutes(this.startTime);
  const endMinutes = this.timeToMinutes(this.endTime);
  
  if (startMinutes >= endMinutes) {
    return next(new Error('End time must be after start time'));
  }
  
  const calculatedDuration = endMinutes - startMinutes;
  if (this.duration !== calculatedDuration) {
    this.duration = calculatedDuration;
  }
  
  next();
});

// Pre-save middleware to detect and update conflicts
scheduledSessionSchema.pre('save', async function(next) {
  if (this.isModified('day') || this.isModified('startTime') || this.isModified('endTime') ||
      this.isModified('faculty') || this.isModified('classroom') || this.isModified('batch')) {
    await this.detectConflicts();
  }
  next();
});

module.exports = mongoose.model('ScheduledSession', scheduledSessionSchema);
