const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'School name is required'],
    trim: true,
    maxlength: [200, 'School name cannot exceed 200 characters']
  },
  code: {
    type: String,
    required: [true, 'School code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [10, 'School code cannot exceed 10 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  dean: {
    name: String,
    email: String,
    phone: String
  },
  establishedYear: {
    type: Number,
    min: [1900, 'Established year cannot be before 1900'],
    max: [new Date().getFullYear(), 'Established year cannot be in the future']
  },
  address: {
    building: String,
    campus: String,
    city: String,
    state: String,
    pincode: String
  },
  contact: {
    phone: String,
    email: String,
    website: String
  },
  departments: [{
    name: String,
    code: String,
    head: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
schoolSchema.index({ code: 1 });
schoolSchema.index({ name: 1 });
schoolSchema.index({ isActive: 1 });

// Virtual for total courses
schoolSchema.virtual('totalCourses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'school',
  count: true
});

// Static method to find active schools
schoolSchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

module.exports = mongoose.model('School', schoolSchema);
