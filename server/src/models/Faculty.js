const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  specialization: [{ type: String }],
  designation: { type: String, enum: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Adjunct'] },
  maxClassesPerDay: { type: Number, default: 6 },
  weeklyLoadLimit: { type: Number, default: 18 },
  availability: [{
    day: { type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] },
    startTime: String, // "09:00"
    endTime: String    // "17:00"
  }],
  leaveProbability: { type: Number, min: 0, max: 1, default: 0.05 },
  blockedTimeSlots: [{ day: String, startTime: String, endTime: String, reason: String }],
  departments: [{ type: String }],
  tags: [{ type: String }] // lab_instructor, mentor, etc.
}, { timestamps: true });

facultySchema.index({ 'departments': 1 });
facultySchema.index({ 'specialization': 1 });

module.exports = mongoose.model('Faculty', facultySchema);

