const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: [true, 'Room number is required'],
    unique: true,
    trim: true
  },
  building: {
    type: String,
    required: [true, 'Building is required'],
    trim: true
  },
  floor: {
    type: Number,
    required: [true, 'Floor is required'],
    min: [0, 'Floor cannot be negative']
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1']
  },
  type: {
    type: String,
    enum: ['lecture_hall', 'laboratory', 'seminar_room', 'auditorium', 'computer_lab', 'tutorial_room'],
    required: [true, 'Classroom type is required']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  facilities: [{
    type: String,
    enum: ['projector', 'whiteboard', 'computer', 'audio_system', 'video_conferencing', 'air_conditioning', 'internet']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  maintenanceSchedule: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    startTime: String,
    endTime: String,
    description: String
  }],
  restrictions: {
    allowedDepartments: [String],
    blockedTimeSlots: [{
      day: String,
      startTime: String,
      endTime: String,
      reason: String
    }]
  },
  location: {
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    description: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
classroomSchema.index({ roomNumber: 1 });
classroomSchema.index({ department: 1, type: 1 });
classroomSchema.index({ capacity: 1 });
classroomSchema.index({ building: 1, floor: 1 });

// Virtual for full room identifier
classroomSchema.virtual('fullName').get(function() {
  return `${this.building}-${this.roomNumber}`;
});

// Static method to find available rooms
classroomSchema.statics.findAvailableRooms = function(day, startTime, endTime, capacity, type, department) {
  const query = {
    isActive: true,
    capacity: { $gte: capacity }
  };
  
  if (type) query.type = type;
  if (department) query['restrictions.allowedDepartments'] = { $in: [department] };
  
  return this.find(query);
};

// Method to check if room is available at specific time
classroomSchema.methods.isAvailable = function(day, startTime, endTime) {
  // Check maintenance schedule
  const maintenance = this.maintenanceSchedule.find(m => 
    m.day === day && 
    ((startTime >= m.startTime && startTime < m.endTime) ||
     (endTime > m.startTime && endTime <= m.endTime))
  );
  
  if (maintenance) return false;
  
  // Check blocked time slots
  const blocked = this.restrictions.blockedTimeSlots.find(b =>
    b.day === day &&
    ((startTime >= b.startTime && startTime < b.endTime) ||
     (endTime > b.startTime && endTime <= b.endTime))
  );
  
  return !blocked;
};

module.exports = mongoose.model('Classroom', classroomSchema);
