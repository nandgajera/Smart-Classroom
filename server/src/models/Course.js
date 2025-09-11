const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true,
    maxlength: [200, 'Course name cannot exceed 200 characters']
  },
  code: {
    type: String,
    required: [true, 'Course code is required'],
    uppercase: true,
    trim: true,
    maxlength: [15, 'Course code cannot exceed 15 characters']
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School is required']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  duration: {
    years: {
      type: Number,
      required: [true, 'Course duration in years is required'],
      min: [1, 'Duration must be at least 1 year'],
      max: [10, 'Duration cannot exceed 10 years']
    },
    semesters: {
      type: Number,
      required: [true, 'Total semesters is required'],
      min: [1, 'Must have at least 1 semester'],
      max: [20, 'Cannot exceed 20 semesters']
    }
  },
  degreeType: {
    type: String,
    required: [true, 'Degree type is required'],
    enum: ['Diploma', 'Bachelor', 'Master', 'Doctorate', 'Certificate']
  },
  level: {
    type: String,
    enum: ['UG', 'PG', 'PhD', 'Diploma'],
    required: [true, 'Course level is required']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  eligibilityCriteria: {
    minimumMarks: Number,
    requiredQualification: String,
    ageLimit: {
      minimum: Number,
      maximum: Number
    },
    additionalRequirements: [String]
  },
  fees: {
    tuitionFee: Number,
    admissionFee: Number,
    developmentFee: Number,
    otherFees: Number,
    totalFee: Number,
    currency: {
      type: String,
      default: 'INR'
    }
  },
  intake: {
    totalSeats: {
      type: Number,
      required: [true, 'Total seats is required'],
      min: [1, 'Must have at least 1 seat']
    },
    reservedSeats: {
      sc: Number,
      st: Number,
      obc: Number,
      ews: Number,
      pwd: Number
    }
  },
  curriculum: [{
    semester: Number,
    subjects: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    }]
  }],
  coordinator: {
    name: String,
    email: String,
    phone: String,
    designation: String
  },
  accreditation: {
    body: String,
    grade: String,
    validUntil: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for school and course code
courseSchema.index({ school: 1, code: 1 }, { unique: true });
courseSchema.index({ school: 1, isActive: 1 });
courseSchema.index({ level: 1, degreeType: 1 });

// Virtual for total students enrolled
courseSchema.virtual('totalStudents', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'course',
  count: true
});

// Static method to find courses by school
courseSchema.statics.findBySchool = function(schoolId) {
  return this.find({ school: schoolId, isActive: true })
    .populate('school', 'name code')
    .sort({ name: 1 });
};

// Method to get semester numbers array
courseSchema.methods.getSemesterNumbers = function() {
  return Array.from({ length: this.duration.semesters }, (_, i) => i + 1);
};

// Pre-save middleware to calculate total fee
courseSchema.pre('save', function(next) {
  if (this.fees) {
    this.fees.totalFee = 
      (this.fees.tuitionFee || 0) +
      (this.fees.admissionFee || 0) +
      (this.fees.developmentFee || 0) +
      (this.fees.otherFees || 0);
  }
  next();
});

module.exports = mongoose.model('Course', courseSchema);
