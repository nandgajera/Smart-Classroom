const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: [true, 'Faculty is required']
  },
  
  // Leave details
  leaveType: {
    type: String,
    enum: ['sick', 'personal', 'emergency', 'vacation', 'maternity', 'paternity', 'bereavement', 'other'],
    required: [true, 'Leave type is required']
  },
  
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  
  startTime: {
    type: String,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM'],
    default: '09:00'
  },
  
  endTime: {
    type: String,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM'],
    default: '17:00'
  },
  
  isFullDay: {
    type: Boolean,
    default: true
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
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
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
  
  // Impact on schedule
  affectedSessions: [{
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ScheduledSession'
    },
    replacementFaculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty'
    },
    replacementStatus: {
      type: String,
      enum: ['pending', 'arranged', 'cancelled'],
      default: 'pending'
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
  
  lastModified: {
    type: Date,
    default: Date.now
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
leaveRequestSchema.index({ faculty: 1, startDate: 1 });
leaveRequestSchema.index({ status: 1, submissionDate: -1 });
leaveRequestSchema.index({ leaveType: 1, status: 1 });

// Virtual for duration calculation
leaveRequestSchema.virtual('duration').get(function() {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }
  return 0;
});

// Virtual for status color (for frontend display)
leaveRequestSchema.virtual('statusColor').get(function() {
  const colors = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error',
    cancelled: 'default'
  };
  return colors[this.status] || 'default';
});

// Pre-save middleware
leaveRequestSchema.pre('save', function(next) {
  // Validate date range
  if (this.startDate && this.endDate && this.startDate > this.endDate) {
    return next(new Error('Start date cannot be after end date'));
  }
  
  // Update lastModified
  this.lastModified = new Date();
  
  next();
});

// Static methods
leaveRequestSchema.statics.findByFaculty = function(facultyId, options = {}) {
  const query = { faculty: facultyId, isActive: true };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.dateRange) {
    query.$or = [
      {
        startDate: {
          $gte: options.dateRange.start,
          $lte: options.dateRange.end
        }
      },
      {
        endDate: {
          $gte: options.dateRange.start,
          $lte: options.dateRange.end
        }
      }
    ];
  }
  
  return this.find(query)
    .populate('faculty', 'user')
    .populate('approvedBy', 'name email')
    .sort({ submissionDate: -1 });
};

leaveRequestSchema.statics.getPendingRequests = function() {
  return this.find({ status: 'pending', isActive: true })
    .populate('faculty', 'user')
    .sort({ submissionDate: -1 });
};

// Instance methods
leaveRequestSchema.methods.approve = function(approvedBy, comments = '') {
  this.status = 'approved';
  this.approvedBy = approvedBy;
  this.approvalDate = new Date();
  this.approvalComments = comments;
  return this.save();
};

leaveRequestSchema.methods.reject = function(rejectedBy, comments = '') {
  this.status = 'rejected';
  this.approvedBy = rejectedBy;
  this.approvalDate = new Date();
  this.approvalComments = comments;
  return this.save();
};

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
