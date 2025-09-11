const mongoose = require('mongoose');

const facultySubjectSchema = new mongoose.Schema({
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
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
    required: false
  },
  academicYear: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  schedule: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      required: true
    },
    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/ // HH:MM format
    },
    endTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/ // HH:MM format
    }
  }],
  assignedDate: {
    type: Date,
    default: Date.now
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed'],
    default: 'active'
  },
  workload: {
    hoursPerWeek: {
      type: Number,
      required: true,
      min: 0
    },
    sessionsPerWeek: {
      type: Number,
      required: true,
      min: 0
    }
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes
facultySubjectSchema.index({ faculty: 1, academicYear: 1, semester: 1 });
facultySubjectSchema.index({ subject: 1, academicYear: 1 });
facultySubjectSchema.index({ classroom: 1, academicYear: 1 });

// Compound index to prevent duplicate assignments
facultySubjectSchema.index(
  { faculty: 1, subject: 1, academicYear: 1, semester: 1 },
  { unique: true }
);

// Virtual for total weekly hours
facultySubjectSchema.virtual('totalWeeklyHours').get(function() {
  return this.workload.hoursPerWeek;
});

// Static method to get faculty workload
facultySubjectSchema.statics.getFacultyWorkload = function(facultyId, academicYear, semester) {
  return this.aggregate([
    {
      $match: {
        faculty: facultyId,
        academicYear,
        semester: semester || { $exists: true },
        status: 'active'
      }
    },
    {
      $group: {
        _id: '$faculty',
        totalHours: { $sum: '$workload.hoursPerWeek' },
        totalSessions: { $sum: '$workload.sessionsPerWeek' },
        subjectCount: { $sum: 1 }
      }
    }
  ]);
};

// Static method to check time conflicts
facultySubjectSchema.statics.checkTimeConflict = function(facultyId, day, startTime, endTime, excludeAssignmentId = null) {
  const query = {
    faculty: facultyId,
    'schedule.day': day,
    status: 'active',
    $or: [
      {
        'schedule.startTime': { $lt: endTime },
        'schedule.endTime': { $gt: startTime }
      }
    ]
  };

  if (excludeAssignmentId) {
    query._id = { $ne: excludeAssignmentId };
  }

  return this.findOne(query);
};

module.exports = mongoose.model('FacultySubject', facultySubjectSchema);
