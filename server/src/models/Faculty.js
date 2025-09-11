const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  // Personal Information
  personalInfo: {
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
    maritalStatus: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed'] },
    nationality: { type: String, default: 'Indian' },
    religion: { type: String },
    category: { type: String, enum: ['General', 'OBC', 'SC', 'ST', 'EWS'] }
  },
  
  // Contact Information
  contactInfo: {
    personalPhone: { type: String },
    emergencyContact: {
      name: { type: String },
      relationship: { type: String },
      phone: { type: String }
    },
    address: {
      permanent: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        pincode: { type: String },
        country: { type: String, default: 'India' }
      },
      current: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        pincode: { type: String },
        country: { type: String, default: 'India' }
      }
    }
  },
  
  // Academic Information
  academicInfo: {
    qualification: [{
      degree: { type: String, required: true },
      specialization: { type: String },
      university: { type: String, required: true },
      year: { type: Number, required: true },
      percentage: { type: Number, min: 0, max: 100 },
      grade: { type: String }
    }],
    experience: {
      totalExperience: { type: Number, default: 0 }, // in years
      teachingExperience: { type: Number, default: 0 }, // in years
      industryExperience: { type: Number, default: 0 }, // in years
      researchExperience: { type: Number, default: 0 } // in years
    },
    publications: [{
      title: { type: String, required: true },
      journal: { type: String },
      year: { type: Number },
      doi: { type: String },
      type: { type: String, enum: ['Journal', 'Conference', 'Book', 'Chapter', 'Other'] }
    }],
    researchAreas: [{ type: String }],
    awards: [{
      title: { type: String, required: true },
      organization: { type: String },
      year: { type: Number },
      description: { type: String }
    }]
  },
  
  // Professional Information
  professionalInfo: {
    employeeId: { type: String, unique: true, sparse: true, default: null },
    joiningDate: { type: Date, required: true },
    designation: { type: String, enum: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Adjunct'], required: true },
    currentSalary: { type: Number },
    bankDetails: {
      accountNumber: { type: String },
      bankName: { type: String },
      ifscCode: { type: String },
      branch: { type: String }
    },
    panNumber: { type: String },
    aadhaarNumber: { type: String }
  },
  
  // Teaching Information
  teachingInfo: {
    specialization: [{ type: String }],
    maxClassesPerDay: { type: Number, default: 6 },
    weeklyLoadLimit: { type: Number, default: 18 },
    preferredSubjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
    availability: [{
      day: { type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] },
      startTime: String, // "09:00"
      endTime: String    // "17:00"
    }],
    leaveProbability: { type: Number, min: 0, max: 1, default: 0.05 },
    blockedTimeSlots: [{ day: String, startTime: String, endTime: String, reason: String }]
  },
  
  departments: [{ type: String }],
  tags: [{ type: String }], // lab_instructor, mentor, etc.
  
  // Status
  isActive: { type: Boolean, default: true },
  profilePicture: { type: String }, // URL to profile picture
  documents: [{
    type: { type: String, required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

facultySchema.index({ 'departments': 1 });
facultySchema.index({ 'specialization': 1 });

// Pre-save middleware to handle empty employeeId
facultySchema.pre('save', function(next) {
  if (this.professionalInfo && this.professionalInfo.employeeId === '') {
    this.professionalInfo.employeeId = null;
  }
  next();
});

module.exports = mongoose.model('Faculty', facultySchema);

