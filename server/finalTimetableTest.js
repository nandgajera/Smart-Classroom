const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const User = require('./src/models/User');
const TimetableSchedulerDebug = require('./src/services/TimetableSchedulerDebug');
const Subject = require('./src/models/Subject');
const Faculty = require('./src/models/Faculty');
const Classroom = require('./src/models/Classroom');
const Batch = require('./src/models/Batch');

// Create a simple TimeSlot structure for testing
const timeSlots = [
  // Monday
  { day: 'monday', startTime: '09:00', endTime: '09:45', duration: 45 },
  { day: 'monday', startTime: '09:15', endTime: '10:00', duration: 45 },
  { day: 'monday', startTime: '09:30', endTime: '10:15', duration: 45 },
  { day: 'monday', startTime: '09:45', endTime: '10:30', duration: 45 },
  { day: 'monday', startTime: '10:00', endTime: '10:45', duration: 45 },
  { day: 'monday', startTime: '10:15', endTime: '11:00', duration: 45 },
  { day: 'monday', startTime: '10:30', endTime: '11:15', duration: 45 },
  { day: 'monday', startTime: '10:45', endTime: '11:30', duration: 45 },
  { day: 'monday', startTime: '11:00', endTime: '11:45', duration: 45 },
  { day: 'monday', startTime: '11:15', endTime: '12:00', duration: 45 },
  { day: 'monday', startTime: '11:30', endTime: '12:15', duration: 45 },
  { day: 'monday', startTime: '11:45', endTime: '12:30', duration: 45 },
  { day: 'monday', startTime: '13:30', endTime: '14:15', duration: 45 },
  { day: 'monday', startTime: '13:45', endTime: '14:30', duration: 45 },
  { day: 'monday', startTime: '14:00', endTime: '14:45', duration: 45 },
  { day: 'monday', startTime: '14:15', endTime: '15:00', duration: 45 },
  { day: 'monday', startTime: '14:30', endTime: '15:15', duration: 45 },
  { day: 'monday', startTime: '14:45', endTime: '15:30', duration: 45 },
  
  // Tuesday - add more slots
  { day: 'tuesday', startTime: '09:00', endTime: '09:45', duration: 45 },
  { day: 'tuesday', startTime: '10:00', endTime: '10:45', duration: 45 },
  { day: 'tuesday', startTime: '11:00', endTime: '11:45', duration: 45 },
  { day: 'tuesday', startTime: '13:30', endTime: '14:15', duration: 45 },
  { day: 'tuesday', startTime: '14:30', endTime: '15:15', duration: 45 },
  
  // Wednesday
  { day: 'wednesday', startTime: '09:00', endTime: '09:45', duration: 45 },
  { day: 'wednesday', startTime: '10:00', endTime: '10:45', duration: 45 },
  { day: 'wednesday', startTime: '11:00', endTime: '11:45', duration: 45 },
  { day: 'wednesday', startTime: '13:30', endTime: '14:15', duration: 45 },
  { day: 'wednesday', startTime: '14:30', endTime: '15:15', duration: 45 },
  
  // Thursday
  { day: 'thursday', startTime: '09:00', endTime: '09:45', duration: 45 },
  { day: 'thursday', startTime: '10:00', endTime: '10:45', duration: 45 },
  { day: 'thursday', startTime: '11:00', endTime: '11:45', duration: 45 },
  { day: 'thursday', startTime: '13:30', endTime: '14:15', duration: 45 },
  { day: 'thursday', startTime: '14:30', endTime: '15:15', duration: 45 },
  
  // Friday
  { day: 'friday', startTime: '09:00', endTime: '09:45', duration: 45 },
  { day: 'friday', startTime: '10:00', endTime: '10:45', duration: 45 },
  { day: 'friday', startTime: '11:00', endTime: '11:45', duration: 45 },
  { day: 'friday', startTime: '13:30', endTime: '14:15', duration: 45 },
  { day: 'friday', startTime: '14:30', endTime: '15:15', duration: 45 }
];

async function testTimetableGeneration() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔗 Connected to database');

    // Fetch all data
    const subjects = await Subject.find({ isActive: true });
    const faculty = await Faculty.find({ isActive: true }).populate('user', 'name email');
    const classrooms = await Classroom.find({ isActive: true });
    const batches = await Batch.find({ isActive: true }).populate('subjects.subject subjects.faculty');

    console.log(`\n📊 Data summary:`);
    console.log(`   Subjects: ${subjects.length}`);
    console.log(`   Faculty: ${faculty.length}`);
    console.log(`   Classrooms: ${classrooms.length}`);
    console.log(`   Batches: ${batches.length}`);
    console.log(`   Time Slots: ${timeSlots.length}`);
    
    // Initialize the scheduler
    const scheduler = new TimetableSchedulerDebug();
    
    // Generate timetable
    console.log('\n🎯 Starting timetable generation...');
    const startTime = Date.now();
    
    const schedule = [];
    const facultySchedule = new Map();
    const classroomSchedule = new Map(); 
    const batchSchedule = new Map();

    // Initialize schedules
    faculty.forEach(f => facultySchedule.set(f._id.toString(), new Set()));
    classrooms.forEach(c => classroomSchedule.set(c._id.toString(), new Set()));
    batches.forEach(b => batchSchedule.set(b._id.toString(), new Set()));

    let totalSessionsNeeded = 0;
    let successfullyScheduled = 0;
    let failedSessions = 0;

    // Process each batch
    for (const batch of batches) {
      console.log(`\n🎓 Processing batch: ${batch.name}`);
      
      for (const batchSubject of batch.subjects) {
        let subject;
        if (typeof batchSubject.subject === 'object' && batchSubject.subject._id) {
          subject = batchSubject.subject;
        } else {
          subject = subjects.find(s => s._id.toString() === batchSubject.subject.toString());
        }
        
        if (subject && batchSubject.faculty) {
          totalSessionsNeeded += subject.sessionsPerWeek;
          
          console.log(`  📚 ${subject.name} (${subject.sessionsPerWeek} sessions/week)`);
          
          // Simple scheduling - just assign to available time slots
          let scheduled = 0;
          for (const timeSlot of timeSlots) {
            if (scheduled >= subject.sessionsPerWeek) break;
            
            const timeSlotKey = `${timeSlot.day}-${timeSlot.startTime}-${timeSlot.endTime}`;
            
            // Check if this time slot works
            const facultyId = batchSubject.faculty.toString();
            const batchId = batch._id.toString();
            
            if (facultySchedule.get(facultyId)?.has(timeSlotKey) || 
                batchSchedule.get(batchId)?.has(timeSlotKey)) {
              continue;
            }
            
            // Find available classroom
            let assignedClassroom = null;
            for (const classroom of classrooms) {
              const classroomId = classroom._id.toString();
              if (!classroomSchedule.get(classroomId)?.has(timeSlotKey)) {
                // Check if classroom is suitable
                const requiredCapacity = subject.classroomRequirements?.minCapacity || batch.enrolledStudents;
                if (classroom.capacity >= requiredCapacity) {
                  assignedClassroom = classroom;
                  break;
                }
              }
            }
            
            if (assignedClassroom) {
              // Schedule the session
              schedule.push({
                batch: batch._id,
                subject: subject._id,
                faculty: batchSubject.faculty,
                classroom: assignedClassroom._id,
                day: timeSlot.day.toLowerCase(),
                startTime: timeSlot.startTime,
                endTime: timeSlot.endTime,
                duration: timeSlot.duration,
                sessionType: subject.type === 'theory' ? 'lecture' : 'lab',
                academicYear: batch.academicYear || '2024-25',
                semester: batch.semester || 3,
                department: batch.department || 'CSE',
                status: 'scheduled',
                isActive: true
              });
              
              // Mark time slot as occupied
              facultySchedule.get(facultyId).add(timeSlotKey);
              classroomSchedule.get(assignedClassroom._id.toString()).add(timeSlotKey);
              batchSchedule.get(batchId).add(timeSlotKey);
              
              scheduled++;
              successfullyScheduled++;
              
              console.log(`    ✅ Scheduled at ${timeSlot.day} ${timeSlot.startTime}-${timeSlot.endTime} in ${assignedClassroom.roomNumber}`);
            }
          }
          
          if (scheduled < subject.sessionsPerWeek) {
            failedSessions += (subject.sessionsPerWeek - scheduled);
            console.log(`    ❌ Only scheduled ${scheduled}/${subject.sessionsPerWeek} sessions`);
          }
        }
      }
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('\n🎉 TIMETABLE GENERATION COMPLETE!');
    console.log(`⏱️  Time taken: ${duration}ms`);
    console.log(`📊 Total sessions needed: ${totalSessionsNeeded}`);
    console.log(`✅ Successfully scheduled: ${successfullyScheduled}`);
    console.log(`❌ Failed to schedule: ${failedSessions}`);
    console.log(`📈 Success rate: ${((successfullyScheduled / totalSessionsNeeded) * 100).toFixed(1)}%`);
    
    if (schedule.length > 0) {
      console.log('\n📋 Sample scheduled sessions:');
      schedule.slice(0, 10).forEach((session, index) => {
        console.log(`${index + 1}. ${session.day} ${session.startTime}-${session.endTime}: ${session.sessionType}`);
      });
      
      if (schedule.length > 10) {
        console.log(`... and ${schedule.length - 10} more sessions`);
      }
      
      // Group by day
      const byDay = {};
      schedule.forEach(session => {
        if (!byDay[session.day]) byDay[session.day] = 0;
        byDay[session.day]++;
      });
      
      console.log('\n📅 Sessions by day:');
      Object.entries(byDay).forEach(([day, count]) => {
        console.log(`   ${day}: ${count} sessions`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
  }
}

testTimetableGeneration();
