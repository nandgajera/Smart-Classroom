const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    required: true
  },
  startTime: {
    type: String,
    required: true // Format: "09:00"
  },
  endTime: {
    type: String,
    required: true // Format: "10:30"
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: true
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  sessionType: {
    type: String,
    enum: ['lecture', 'lab', 'tutorial', 'seminar', 'exam'],
    default: 'lecture'
  },
  notes: {
    type: String,
    trim: true
  }
});

const timetableSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Timetable name is required'],
    trim: true
  },
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
    required: [true, 'Department is required'],
    trim: true
  },
  schedule: [timeSlotSchema],
  
  // Generation metadata
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  generationDate: {
    type: Date,
    default: Date.now
  },
  algorithm: {
    type: String,
    enum: ['constraint_satisfaction', 'genetic_algorithm', 'manual'],
    default: 'constraint_satisfaction'
  },
  optimizationScore: {
    type: Number,
    min: 0,
    max: 100
  },
  
  // Status and approval
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'published', 'archived'],
    default: 'draft'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: {
    type: Date
  },
  publishedDate: {
    type: Date
  },
  
  // Constraints and preferences used in generation
  constraints: {
    workingDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    }],
    workingHours: {
      startTime: { type: String, default: '09:00' },
      endTime: { type: String, default: '17:00' }
    },
    maxClassesPerDay: { type: Number, default: 8 },
    lunchBreak: {
      startTime: { type: String, default: '12:30' },
      endTime: { type: String, default: '13:30' }
    }
  },
  
  // Conflicts and issues
  conflicts: [{
    type: {
      type: String,
      enum: ['faculty_clash', 'classroom_clash', 'batch_clash', 'resource_unavailable']
    },
    description: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    affectedSlots: [String], // References to time slot IDs
    resolved: {
      type: Boolean,
      default: false
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedDate: Date
  }],
  
  // Statistics
  statistics: {
    totalClasses: { type: Number, default: 0 },
    utilizationRate: { type: Number, default: 0 },
    facultyWorkload: [{
      faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
      hoursPerWeek: { type: Number, default: 0 }
    }],
    classroomUtilization: [{
      classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' },
      utilizationPercentage: { type: Number, default: 0 }
    }]
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Backup and versioning
  version: {
    type: Number,
    default: 1
  },
  parentTimetable: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Timetable'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
timetableSchema.index({ academicYear: 1, semester: 1, department: 1 });
timetableSchema.index({ status: 1, isActive: 1 });
timetableSchema.index({ generatedBy: 1, generationDate: -1 });
timetableSchema.index({ 'schedule.day': 1, 'schedule.startTime': 1 });

// Virtual for total weekly hours
timetableSchema.virtual('totalWeeklyHours').get(function() {
  return this.schedule.reduce((total, slot) => {
    const startMinutes = this.timeToMinutes(slot.startTime);
    const endMinutes = this.timeToMinutes(slot.endTime);
    return total + (endMinutes - startMinutes);
  }, 0) / 60; // Convert to hours
});

// Helper method to convert time string to minutes
timetableSchema.methods.timeToMinutes = function(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Static method to find active timetables
timetableSchema.statics.findActive = function(department, academicYear, semester) {
  const query = { isActive: true };
  if (department) query.department = department;
  if (academicYear) query.academicYear = academicYear;
  if (semester) query.semester = semester;
  
  return this.find(query)
    .populate('generatedBy approvedBy')
    .populate('schedule.subject schedule.faculty schedule.classroom schedule.batch')
    .sort({ generationDate: -1 });
};

// Method to detect conflicts in schedule
timetableSchema.methods.detectConflicts = function() {
  const conflicts = [];
  const timeSlotMap = new Map();
  
  this.schedule.forEach((slot, index) => {
    const key = `${slot.day}-${slot.startTime}-${slot.endTime}`;
    
    // Check for faculty conflicts
    const facultyKey = `faculty-${slot.faculty}-${key}`;
    if (timeSlotMap.has(facultyKey)) {
      conflicts.push({
        type: 'faculty_clash',
        description: `Faculty has conflicting classes at ${slot.day} ${slot.startTime}-${slot.endTime}`,
        severity: 'high',
        affectedSlots: [timeSlotMap.get(facultyKey), index]
      });
    } else {
      timeSlotMap.set(facultyKey, index);
    }
    
    // Check for classroom conflicts
    const classroomKey = `classroom-${slot.classroom}-${key}`;
    if (timeSlotMap.has(classroomKey)) {
      conflicts.push({
        type: 'classroom_clash',
        description: `Classroom has conflicting bookings at ${slot.day} ${slot.startTime}-${slot.endTime}`,
        severity: 'high',
        affectedSlots: [timeSlotMap.get(classroomKey), index]
      });
    } else {
      timeSlotMap.set(classroomKey, index);
    }
    
    // Check for batch conflicts
    const batchKey = `batch-${slot.batch}-${key}`;
    if (timeSlotMap.has(batchKey)) {
      conflicts.push({
        type: 'batch_clash',
        description: `Batch has conflicting classes at ${slot.day} ${slot.startTime}-${slot.endTime}`,
        severity: 'high',
        affectedSlots: [timeSlotMap.get(batchKey), index]
      });
    } else {
      timeSlotMap.set(batchKey, index);
    }
  });
  
  this.conflicts = conflicts;
  return conflicts;
};

// Pre-save middleware to calculate statistics
timetableSchema.pre('save', function(next) {
  this.statistics.totalClasses = this.schedule.length;
  next();
});

module.exports = mongoose.model('Timetable', timetableSchema);
