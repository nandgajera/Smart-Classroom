const mongoose = require('mongoose');

const facultyLeaveSchema = new mongoose.Schema({
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  leaveType: {
    type: String,
    enum: ['sick', 'casual', 'earned', 'maternity', 'paternity', 'emergency', 'conference', 'other'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  halfDay: {
    isHalfDay: {
      type: Boolean,
      default: false
    },
    session: {
      type: String,
      enum: ['morning', 'afternoon'],
      required: function() { return this.halfDay.isHalfDay; }
    }
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedDate: {
    type: Date
  },
  reviewComments: {
    type: String,
    trim: true
  },
  attachments: [{
    fileName: String,
    filePath: String,
    fileType: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  substituteArrangements: [{
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    },
    originalDate: Date,
    originalTime: {
      startTime: String,
      endTime: String
    },
    substituteDate: Date,
    substituteTime: {
      startTime: String,
      endTime: String
    },
    substituteFaculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty'
    },
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom'
    },
    status: {
      type: String,
      enum: ['arranged', 'pending', 'cancelled'],
      default: 'pending'
    }
  }],
  totalDays: {
    type: Number,
    required: true
  },
  academicYear: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Indexes
facultyLeaveSchema.index({ faculty: 1, academicYear: 1 });
facultyLeaveSchema.index({ status: 1, appliedDate: -1 });
facultyLeaveSchema.index({ startDate: 1, endDate: 1 });

// Pre-save middleware to calculate total days
facultyLeaveSchema.pre('save', function(next) {
  if (this.isModified('startDate') || this.isModified('endDate') || this.isModified('halfDay.isHalfDay')) {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    
    let totalDays = 0;
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      // Skip weekends (assuming Saturday and Sunday are weekends)
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
        totalDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // If it's a half day, count as 0.5
    if (this.halfDay.isHalfDay) {
      totalDays = 0.5;
    }
    
    this.totalDays = totalDays;
  }
  next();
});

// Static method to get faculty leave balance
facultyLeaveSchema.statics.getLeaveBalance = async function(facultyId, academicYear) {
  const leaves = await this.find({
    faculty: facultyId,
    academicYear,
    status: 'approved'
  });

  const balance = {
    sick: { taken: 0, available: 10 },
    casual: { taken: 0, available: 12 },
    earned: { taken: 0, available: 15 },
    total: { taken: 0, available: 37 }
  };

  leaves.forEach(leave => {
    if (balance[leave.leaveType]) {
      balance[leave.leaveType].taken += leave.totalDays;
    }
    balance.total.taken += leave.totalDays;
  });

  // Calculate remaining
  Object.keys(balance).forEach(type => {
    balance[type].remaining = Math.max(0, balance[type].available - balance[type].taken);
  });

  return balance;
};

// Static method to check leave conflicts
facultyLeaveSchema.statics.checkConflict = function(facultyId, startDate, endDate, excludeLeaveId = null) {
  const query = {
    faculty: facultyId,
    status: { $in: ['approved', 'pending'] },
    $or: [
      {
        startDate: { $lte: endDate },
        endDate: { $gte: startDate }
      }
    ]
  };

  if (excludeLeaveId) {
    query._id = { $ne: excludeLeaveId };
  }

  return this.findOne(query);
};

module.exports = mongoose.model('FacultyLeave', facultyLeaveSchema);
