const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const User = require('./src/models/User');
const TimeSlot = require('./src/models/TimeSlot');
const TimetableSchedulerDebug = require('./src/services/TimetableSchedulerDebug');
const Subject = require('./src/models/Subject');
const Faculty = require('./src/models/Faculty');
const Classroom = require('./src/models/Classroom');
const Batch = require('./src/models/Batch');

async function createTimeSlotsAndTest() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔗 Connected to database');

    // First, create time slots if they don't exist
    const existingSlots = await TimeSlot.find({});
    
    if (existingSlots.length === 0) {
      console.log('📅 Creating time slots...');
      
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const timeSlots = [];
      
      for (const day of days) {
        // Morning slots
        timeSlots.push({
          day: day,
          startTime: '09:00',
          endTime: '10:00',
          duration: 60,
          type: 'regular',
          isActive: true
        });
        
        timeSlots.push({
          day: day,
          startTime: '10:00',
          endTime: '11:00',
          duration: 60,
          type: 'regular',
          isActive: true
        });
        
        timeSlots.push({
          day: day,
          startTime: '11:15',
          endTime: '12:15',
          duration: 60,
          type: 'regular',
          isActive: true
        });
        
        // Lunch break 12:15-13:15
        
        // Afternoon slots
        timeSlots.push({
          day: day,
          startTime: '13:15',
          endTime: '14:15',
          duration: 60,
          type: 'regular',
          isActive: true
        });
        
        timeSlots.push({
          day: day,
          startTime: '14:15',
          endTime: '15:15',
          duration: 60,
          type: 'regular',
          isActive: true
        });
        
        timeSlots.push({
          day: day,
          startTime: '15:30',
          endTime: '16:30',
          duration: 60,
          type: 'regular',
          isActive: true
        });
        
        // Extended slots for labs (2 hours)
        timeSlots.push({
          day: day,
          startTime: '09:00',
          endTime: '11:00',
          duration: 120,
          type: 'lab',
          isActive: true
        });
        
        timeSlots.push({
          day: day,
          startTime: '11:15',
          endTime: '13:15',
          duration: 120,
          type: 'lab',
          isActive: true
        });
        
        timeSlots.push({
          day: day,
          startTime: '14:15',
          endTime: '16:15',
          duration: 120,
          type: 'lab',
          isActive: true
        });
      }
      
      await TimeSlot.insertMany(timeSlots);
      console.log(`✅ Created ${timeSlots.length} time slots`);
    } else {
      console.log(`✅ Found ${existingSlots.length} existing time slots`);
    }

    // Now fetch all data and test timetable generation
    console.log('\n🚀 Testing timetable generation...');
    
    const subjects = await Subject.find({ isActive: true });
    const faculty = await Faculty.find({ isActive: true }).populate('user', 'name email');
    const classrooms = await Classroom.find({ isActive: true });
    const batches = await Batch.find({ isActive: true }).populate('subjects.subject subjects.faculty');
    const timeSlots = await TimeSlot.find({ isActive: true });

    console.log(`📊 Data summary:`);
    console.log(`   Subjects: ${subjects.length}`);
    console.log(`   Faculty: ${faculty.length}`);
    console.log(`   Classrooms: ${classrooms.length}`);
    console.log(`   Batches: ${batches.length}`);
    console.log(`   Time Slots: ${timeSlots.length}`);
    
    // Initialize the debug scheduler
    const scheduler = new TimetableSchedulerDebug();
    
    // Generate timetable
    console.log('\n🎯 Generating timetable...');
    const result = await scheduler.generateTimetable(batches, subjects, faculty, classrooms, timeSlots);
    
    console.log('\n📈 FINAL RESULT:');
    console.log(`Success: ${result.success}`);
    console.log(`Scheduled sessions: ${result.statistics.scheduledSessions}/${result.statistics.totalSessions}`);
    console.log(`Failed sessions: ${result.statistics.failedSessions}`);
    
    if (result.schedule.length > 0) {
      console.log('\n✅ Timetable generated successfully!');
      console.log(`Generated ${result.schedule.length} scheduled sessions.`);
    } else {
      console.log('\n❌ No sessions were scheduled. Check the logs above for details.');
    }

    await mongoose.connection.close();
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
  }
}

createTimeSlotsAndTest();
