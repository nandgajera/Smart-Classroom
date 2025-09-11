const mongoose = require('mongoose');
const validator = require('validator');

const studentSchema = new mongoose.Schema({
  // Basic Information
  rollNo: {
    type: String,
    required: [true, 'Roll number is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    validate: {
      validator: function(v) {
        return /\+?[1-9]\d{1,14}$/.test(v);
      },
      message: 'Please provide a valid phone number'
    }
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['Male', 'Female', 'Other']
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  category: {
    type: String,
    enum: ['General', 'OBC', 'SC', 'ST', 'EWS', 'PwD'],
    required: [true, 'Category is required']
  },

  // Address Information
  address: {
    permanent: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' }
    },
    current: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' }
    }
  },

  // Family Information
  father: {
    name: { type: String, required: [true, 'Father name is required'] },
    occupation: String,
    phone: String,
    email: String,
    annualIncome: Number
  },
  mother: {
    name: { type: String, required: [true, 'Mother name is required'] },
    occupation: String,
    phone: String,
    email: String
  },
  guardian: {
    name: String,
    relation: String,
    phone: String,
    email: String
  },

  // Academic Information
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School is required']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  },
  currentSemester: {
    type: Number,
    required: [true, 'Current semester is required'],
    min: [1, 'Semester must be at least 1'],
    max: [20, 'Semester cannot exceed 20']
  },
  admissionDate: {
    type: Date,
    required: [true, 'Admission date is required']
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required']
  },
  section: {
    type: String,
    default: 'A',
    trim: true
  },

  // Academic Performance
  academicRecord: {
    cgpa: {
      type: Number,
      min: [0, 'CGPA cannot be negative'],
      max: [10, 'CGPA cannot exceed 10']
    },
    sgpa: [{
      semester: Number,
      gpa: Number,
      credits: Number,
      year: String
    }],
    backlogs: [{
      subject: String,
      semester: Number,
      attempts: Number,
      status: { type: String, enum: ['Pending', 'Cleared'] }
    }]
  },

  // Attendance Information
  attendance: {
    overall: {
      type: Number,
      min: [0, 'Attendance cannot be negative'],
      max: [100, 'Attendance cannot exceed 100%'],
      default: 0
    },
    subjects: [{
      subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
      },
      totalClasses: { type: Number, default: 0 },
      attendedClasses: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    }],
    lastUpdated: { type: Date, default: Date.now }
  },

  // Fee Information
  fees: {
    totalFee: { type: Number, required: [true, 'Total fee is required'] },
    paidAmount: { type: Number, default: 0 },
    pendingAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Paid', 'Pending', 'Overdue', 'Partial'],
      default: 'Pending'
    },
    dueDate: Date,
    paymentHistory: [{
      amount: Number,
      paymentDate: Date,
      paymentMethod: String,
      transactionId: String,
      receiptNo: String
    }],
    scholarships: [{
      name: String,
      amount: Number,
      type: String,
      year: String
    }]
  },

  // Documents
  documents: {
    status: {
      type: String,
      enum: ['Complete', 'Incomplete', 'Under Review'],
      default: 'Incomplete'
    },
    submitted: [{
      documentType: String,
      fileName: String,
      uploadDate: Date,
      verified: { type: Boolean, default: false },
      verifiedBy: String,
      verificationDate: Date,
      remarks: String
    }],
    required: [{
      documentType: String,
      mandatory: Boolean,
      submitted: { type: Boolean, default: false }
    }]
  },

  // Additional Information
  extracurricular: [{
    activity: String,
    role: String,
    year: String,
    achievements: [String]
  }],
  
  medicalInfo: {
    allergies: [String],
    chronicConditions: [String],
    medications: [String],
    emergencyContact: {
      name: String,
      relation: String,
      phone: String
    }
  },

  // System Information
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Graduated', 'Dropped', 'Suspended'],
    default: 'Active'
  },
  graduationDate: Date,
  lastLogin: Date,
  
  // Preferences and Settings
  preferences: {
    communication: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    language: { type: String, default: 'English' }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
studentSchema.index({ rollNo: 1 });
studentSchema.index({ email: 1 });
studentSchema.index({ school: 1, course: 1, currentSemester: 1 });
studentSchema.index({ academicYear: 1, isActive: 1 });
studentSchema.index({ 'fees.status': 1 });
studentSchema.index({ 'documents.status': 1 });

// Virtual for full name display
studentSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.rollNo})`;
});

// Virtual for age
studentSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Static method to find students by school, course, and semester
studentSchema.statics.findByAcademicInfo = function(schoolId, courseId, semester) {
  return this.find({
    school: schoolId,
    course: courseId,
    currentSemester: semester,
    isActive: true
  })
  .populate('school', 'name code')
  .populate('course', 'name code')
  .sort({ rollNo: 1 });
};

// Method to calculate pending fee amount
studentSchema.methods.calculatePendingFee = function() {
  this.fees.pendingAmount = this.fees.totalFee - this.fees.paidAmount;
  return this.fees.pendingAmount;
};

// Method to update fee status
studentSchema.methods.updateFeeStatus = function() {
  this.calculatePendingFee();
  
  if (this.fees.pendingAmount <= 0) {
    this.fees.status = 'Paid';
  } else if (this.fees.paidAmount > 0) {
    this.fees.status = 'Partial';
  } else if (this.fees.dueDate && this.fees.dueDate < new Date()) {
    this.fees.status = 'Overdue';
  } else {
    this.fees.status = 'Pending';
  }
};

// Pre-save middleware to update fee status and calculate pending amount
studentSchema.pre('save', function(next) {
  // Update fee calculations
  this.updateFeeStatus();
  
  // Update overall attendance
  if (this.attendance.subjects && this.attendance.subjects.length > 0) {
    const totalAttendance = this.attendance.subjects.reduce((sum, subject) => {
      return sum + (subject.percentage || 0);
    }, 0);
    this.attendance.overall = Math.round(totalAttendance / this.attendance.subjects.length);
  }
  
  next();
});

// Method to add payment
studentSchema.methods.addPayment = function(paymentData) {
  this.fees.paymentHistory.push(paymentData);
  this.fees.paidAmount += paymentData.amount;
  this.updateFeeStatus();
  return this.save();
};

// Method to update attendance for a subject
studentSchema.methods.updateSubjectAttendance = function(subjectId, totalClasses, attendedClasses) {
  const subjectAttendance = this.attendance.subjects.find(s => 
    s.subject.toString() === subjectId.toString()
  );
  
  if (subjectAttendance) {
    subjectAttendance.totalClasses = totalClasses;
    subjectAttendance.attendedClasses = attendedClasses;
    subjectAttendance.percentage = Math.round((attendedClasses / totalClasses) * 100);
  } else {
    this.attendance.subjects.push({
      subject: subjectId,
      totalClasses,
      attendedClasses,
      percentage: Math.round((attendedClasses / totalClasses) * 100)
    });
  }
  
  this.attendance.lastUpdated = new Date();
  return this.save();
};

module.exports = mongoose.model('Student', studentSchema);
