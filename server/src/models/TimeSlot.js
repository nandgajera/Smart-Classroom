const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    required: [true, 'Day is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM']
  },
  duration: {
    type: Number, // in minutes
    required: [true, 'Duration is required'],
    min: [15, 'Duration must be at least 15 minutes']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // For institutional constraints
  type: {
    type: String,
    enum: ['regular', 'lunch_break', 'break', 'special'],
    default: 'regular'
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required']
  },
  constraints: {
    maxConcurrentClasses: {
      type: Number,
      default: 100 // Institution capacity limit
    },
    preferredFor: [String], // departments that prefer this slot
    restrictedFor: [String] // departments restricted from this slot
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
timeSlotSchema.index({ day: 1, startTime: 1 });
timeSlotSchema.index({ academicYear: 1, isActive: 1 });
timeSlotSchema.index({ duration: 1 });

// Virtual for slot identifier
timeSlotSchema.virtual('identifier').get(function() {
  return `${this.day}-${this.startTime}-${this.endTime}`;
});

// Method to check if time slot overlaps with another
timeSlotSchema.methods.overlapsWith = function(other) {
  if (this.day !== other.day) return false;
  
  const thisStart = this.timeToMinutes(this.startTime);
  const thisEnd = this.timeToMinutes(this.endTime);
  const otherStart = this.timeToMinutes(other.startTime);
  const otherEnd = this.timeToMinutes(other.endTime);
  
  return (thisStart < otherEnd) && (otherStart < thisEnd);
};

// Helper method to convert time string to minutes
timeSlotSchema.methods.timeToMinutes = function(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Static method to find available slots for a given duration
timeSlotSchema.statics.findByDuration = function(duration, academicYear, day = null) {
  const query = {
    duration,
    academicYear,
    isActive: true
  };
  
  if (day) query.day = day;
  
  return this.find(query).sort({ day: 1, startTime: 1 });
};

// Static method to generate standard time slots
timeSlotSchema.statics.generateStandardSlots = async function(academicYear, config = {}) {
  const defaults = {
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startTime: '09:00',
    endTime: '17:00',
    slotDurations: [45, 60, 90, 120], // in minutes
    lunchBreak: { startTime: '12:30', endTime: '13:30' }
  };
  
  const settings = { ...defaults, ...config };
  const slots = [];
  
  for (const day of settings.workingDays) {
    for (const duration of settings.slotDurations) {
      const dayStartMinutes = this.prototype.timeToMinutes(settings.startTime);
      const dayEndMinutes = this.prototype.timeToMinutes(settings.endTime);
      const lunchStartMinutes = this.prototype.timeToMinutes(settings.lunchBreak.startTime);
      const lunchEndMinutes = this.prototype.timeToMinutes(settings.lunchBreak.endTime);
      
      for (let startMinutes = dayStartMinutes; startMinutes + duration <= dayEndMinutes; startMinutes += 15) {
        const endMinutes = startMinutes + duration;
        
        // Skip lunch break slots
        if (startMinutes < lunchEndMinutes && endMinutes > lunchStartMinutes) {
          continue;
        }
        
        const startTime = this.prototype.minutesToTime(startMinutes);
        const endTime = this.prototype.minutesToTime(endMinutes);
        
        slots.push({
          day,
          startTime,
          endTime,
          duration,
          academicYear,
          type: 'regular'
        });
      }
    }
    
    // Add lunch break slot
    slots.push({
      day,
      startTime: settings.lunchBreak.startTime,
      endTime: settings.lunchBreak.endTime,
      duration: this.prototype.timeToMinutes(settings.lunchBreak.endTime) - 
               this.prototype.timeToMinutes(settings.lunchBreak.startTime),
      academicYear,
      type: 'lunch_break'
    });
  }
  
  return slots;
};

// Helper method to convert minutes to time string
timeSlotSchema.methods.minutesToTime = function(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Validation for start and end times
timeSlotSchema.pre('save', function(next) {
  const startMinutes = this.timeToMinutes(this.startTime);
  const endMinutes = this.timeToMinutes(this.endTime);
  
  if (startMinutes >= endMinutes) {
    return next(new Error('End time must be after start time'));
  }
  
  const calculatedDuration = endMinutes - startMinutes;
  if (this.duration !== calculatedDuration) {
    this.duration = calculatedDuration;
  }
  
  next();
});

module.exports = mongoose.model('TimeSlot', timeSlotSchema);
