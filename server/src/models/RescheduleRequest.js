const mongoose = require('mongoose');

const rescheduleRequestSchema = new mongoose.Schema({
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: [true, 'Faculty is required']
  },
  
  // Original session details
  originalSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ScheduledSession',
    required: [true, 'Original session is required']
  },
  
  originalDate: {
    type: Date,
    required: [true, 'Original date is required']
  },
  
  originalStartTime: {
    type: String,
    required: [true, 'Original start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM']
  },
  
  originalEndTime: {
    type: String,
    required: [true, 'Original end time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM']
  },
  
  originalClassroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom'
  },
  
  // Requested new schedule
  requestedDate: {
    type: Date,
    required: [true, 'Requested date is required']
  },
  
  requestedStartTime: {
    type: String,
    required: [true, 'Requested start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM']
  },
  
  requestedEndTime: {
    type: String,
    required: [true, 'Requested end time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM']
  },
  
  requestedClassroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom'
  },
  
  // Alternative options (if primary request is not available)
  alternativeOptions: [{
    date: {
      type: Date,
      required: true
    },
    startTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM']
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM']
    },
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom'
    },
    priority: {
      type: Number,
      default: 1
    }
  }],
  
  // Request details
  rescheduleType: {
    type: String,
    enum: ['emergency', 'planned', 'conflict', 'personal', 'administrative', 'technical', 'other'],
    required: [true, 'Reschedule type is required']
  },
  
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    trim: true,
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  
  // Status and approval
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed'],
    default: 'pending'
  },
  
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  approvalDate: {
    type: Date
  },
  
  approvalComments: {
    type: String,
    trim: true,
    maxlength: [300, 'Approval comments cannot exceed 300 characters']
  },
  
  // Final approved schedule (may differ from requested)
  approvedSchedule: {
    date: {
      type: Date
    },
    startTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM']
    },
    endTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM']
    },
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom'
    }
  },
  
  // Impact on other sessions/faculty
  affectedParties: [{
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty'
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch'
    },
    impactType: {
      type: String,
      enum: ['classroom_conflict', 'time_conflict', 'resource_conflict', 'notification_only']
    },
    notified: {
      type: Boolean,
      default: false
    },
    notificationDate: {
      type: Date
    }
  }],
  
  // Supporting documents
  documents: [{
    fileName: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Metadata
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  submissionDate: {
    type: Date,
    default: Date.now
  },
  
  completionDate: {
    type: Date
  },
  
  lastModified: {
    type: Date,
    default: Date.now
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Auto-approval settings
  autoApprove: {
    type: Boolean,
    default: false
  },
  
  autoApprovalReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
rescheduleRequestSchema.index({ faculty: 1, submissionDate: -1 });
rescheduleRequestSchema.index({ originalSession: 1 });
rescheduleRequestSchema.index({ status: 1, submissionDate: -1 });
rescheduleRequestSchema.index({ rescheduleType: 1, status: 1 });
rescheduleRequestSchema.index({ originalDate: 1, requestedDate: 1 });

// Virtual for status color (for frontend display)
rescheduleRequestSchema.virtual('statusColor').get(function() {
  const colors = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error',
    cancelled: 'default',
    completed: 'info'
  };
  return colors[this.status] || 'default';
});

// Virtual for time difference
rescheduleRequestSchema.virtual('timeDifference').get(function() {
  if (this.originalDate && this.requestedDate) {
    const diffTime = this.requestedDate - this.originalDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  return 0;
});

// Pre-save middleware
rescheduleRequestSchema.pre('save', function(next) {
  // Validate that requested time is different from original
  if (this.originalDate && this.requestedDate && 
      this.originalStartTime && this.requestedStartTime &&
      this.originalDate.toDateString() === this.requestedDate.toDateString() &&
      this.originalStartTime === this.requestedStartTime) {
    return next(new Error('Requested schedule must be different from original schedule'));
  }
  
  // Validate time ranges
  if (this.originalStartTime && this.originalEndTime && 
      this.originalStartTime >= this.originalEndTime) {
    return next(new Error('Original start time must be before end time'));
  }
  
  if (this.requestedStartTime && this.requestedEndTime && 
      this.requestedStartTime >= this.requestedEndTime) {
    return next(new Error('Requested start time must be before end time'));
  }
  
  // Update lastModified
  this.lastModified = new Date();
  
  next();
});

// Static methods
rescheduleRequestSchema.statics.findByFaculty = function(facultyId, options = {}) {
  const query = { faculty: facultyId, isActive: true };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.dateRange) {
    query.$or = [
      {
        originalDate: {
          $gte: options.dateRange.start,
          $lte: options.dateRange.end
        }
      },
      {
        requestedDate: {
          $gte: options.dateRange.start,
          $lte: options.dateRange.end
        }
      }
    ];
  }
  
  return this.find(query)
    .populate('faculty', 'user')
    .populate('originalSession')
    .populate('originalClassroom', 'roomNumber type')
    .populate('requestedClassroom', 'roomNumber type')
    .populate('approvedBy', 'name email')
    .sort({ submissionDate: -1 });
};

rescheduleRequestSchema.statics.getPendingRequests = function() {
  return this.find({ status: 'pending', isActive: true })
    .populate('faculty', 'user')
    .populate('originalSession')
    .populate('originalClassroom', 'roomNumber type')
    .populate('requestedClassroom', 'roomNumber type')
    .sort({ submissionDate: -1 });
};

rescheduleRequestSchema.statics.findConflictingRequests = function(date, startTime, endTime, classroomId) {
  return this.find({
    status: { $in: ['pending', 'approved'] },
    isActive: true,
    $or: [
      {
        requestedDate: date,
        requestedStartTime: { $lt: endTime },
        requestedEndTime: { $gt: startTime },
        requestedClassroom: classroomId
      },
      {
        'approvedSchedule.date': date,
        'approvedSchedule.startTime': { $lt: endTime },
        'approvedSchedule.endTime': { $gt: startTime },
        'approvedSchedule.classroom': classroomId
      }
    ]
  });
};

// Instance methods
rescheduleRequestSchema.methods.approve = function(approvedBy, approvedSchedule = null, comments = '') {
  this.status = 'approved';
  this.approvedBy = approvedBy;
  this.approvalDate = new Date();
  this.approvalComments = comments;
  
  if (approvedSchedule) {
    this.approvedSchedule = approvedSchedule;
  } else {
    // Use requested schedule as approved schedule
    this.approvedSchedule = {
      date: this.requestedDate,
      startTime: this.requestedStartTime,
      endTime: this.requestedEndTime,
      classroom: this.requestedClassroom
    };
  }
  
  return this.save();
};

rescheduleRequestSchema.methods.reject = function(rejectedBy, comments = '') {
  this.status = 'rejected';
  this.approvedBy = rejectedBy;
  this.approvalDate = new Date();
  this.approvalComments = comments;
  return this.save();
};

rescheduleRequestSchema.methods.complete = function() {
  this.status = 'completed';
  this.completionDate = new Date();
  return this.save();
};

module.exports = mongoose.model('RescheduleRequest', rescheduleRequestSchema);
