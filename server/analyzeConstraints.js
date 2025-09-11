const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const User = require('./src/models/User');
const Faculty = require('./src/models/Faculty');
const Subject = require('./src/models/Subject');
const Classroom = require('./src/models/Classroom');
const Batch = require('./src/models/Batch');

async function analyzeConstraints() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔍 Analyzing data constraints...\n');
    
    // 1. Subject Constraints Analysis
    console.log('📚 SUBJECT CONSTRAINTS ANALYSIS:');
    const subjects = await Subject.find({});
    console.log(`Total subjects: ${subjects.length}\n`);
    
    let subjectIssues = 0;
    subjects.forEach((subject, index) => {
      console.log(`${index + 1}. ${subject.name} (${subject.code})`);
      
      // Check code format (should be 5-10 chars)
      if (subject.code.length < 5 || subject.code.length > 10) {
        console.log(`   ❌ Code length issue: "${subject.code}" (${subject.code.length} chars, should be 5-10)`);
        subjectIssues++;
      } else {
        console.log(`   ✅ Code: ${subject.code} (${subject.code.length} chars)`);
      }
      
      // Check credits (1-5)
      if (subject.credits < 1 || subject.credits > 5) {
        console.log(`   ❌ Credits issue: ${subject.credits} (should be 1-5)`);
        subjectIssues++;
      } else {
        console.log(`   ✅ Credits: ${subject.credits}`);
      }
      
      // Check sessions per week (1-6)
      if (subject.sessionsPerWeek < 1 || subject.sessionsPerWeek > 6) {
        console.log(`   ❌ Sessions/week issue: ${subject.sessionsPerWeek} (should be 1-6)`);
        subjectIssues++;
      } else {
        console.log(`   ✅ Sessions/week: ${subject.sessionsPerWeek}`);
      }
      
      // Check session duration (45-180 minutes)
      if (subject.sessionDuration < 45 || subject.sessionDuration > 180) {
        console.log(`   ❌ Duration issue: ${subject.sessionDuration} mins (should be 45-180)`);
        subjectIssues++;
      } else {
        console.log(`   ✅ Duration: ${subject.sessionDuration} mins`);
      }
      
      // Check minCapacity based on type
      const minCap = subject.classroomRequirements?.minCapacity;
      if (subject.type === 'theory' && (minCap < 30 || minCap > 150)) {
        console.log(`   ❌ Theory minCapacity issue: ${minCap} (should be 30-150)`);
        subjectIssues++;
      } else if (subject.type === 'lab' && (minCap < 20 || minCap > 50)) {
        console.log(`   ❌ Lab minCapacity issue: ${minCap} (should be 20-50)`);
        subjectIssues++;
      } else {
        console.log(`   ✅ MinCapacity: ${minCap} for ${subject.type}`);
      }
      
      console.log('');
    });
    
    // 2. Faculty Constraints Analysis
    console.log('👨‍🏫 FACULTY CONSTRAINTS ANALYSIS:');
    const faculty = await Faculty.find({}).populate('user', 'name email');
    console.log(`Total faculty: ${faculty.length}\n`);
    
    let facultyIssues = 0;
    faculty.forEach((f, index) => {
      console.log(`${index + 1}. ${f.user?.name || 'Unknown'}`);
      
      // Check weekly load limit (should be reasonable for 20 sessions/week max)
      const weeklyLimit = f.teachingInfo?.weeklyLoadLimit || 0;
      if (weeklyLimit < 6 || weeklyLimit > 20) {
        console.log(`   ❌ Weekly load issue: ${weeklyLimit} hours (should be 6-20)`);
        facultyIssues++;
      } else {
        console.log(`   ✅ Weekly load limit: ${weeklyLimit} hours`);
      }
      
      // Check max classes per day
      const maxDaily = f.teachingInfo?.maxClassesPerDay || 0;
      if (maxDaily < 3 || maxDaily > 8) {
        console.log(`   ❌ Max classes/day issue: ${maxDaily} (should be 3-8)`);
        facultyIssues++;
      } else {
        console.log(`   ✅ Max classes/day: ${maxDaily}`);
      }
      
      // Check departments
      const depts = f.departments || [];
      if (depts.length === 0) {
        console.log(`   ❌ No departments assigned`);
        facultyIssues++;
      } else {
        console.log(`   ✅ Departments: ${depts.join(', ')}`);
      }
      
      console.log('');
    });
    
    // 3. Classroom Constraints Analysis
    console.log('🏫 CLASSROOM CONSTRAINTS ANALYSIS:');
    const classrooms = await Classroom.find({});
    console.log(`Total classrooms: ${classrooms.length}\n`);
    
    let classroomIssues = 0;
    classrooms.forEach((room, index) => {
      console.log(`${index + 1}. ${room.roomNumber} (${room.type})`);
      
      // Check capacity ranges by type
      let capacityOk = true;
      if (room.type === 'lecture_hall' && (room.capacity < 50 || room.capacity > 150)) {
        console.log(`   ❌ Lecture hall capacity issue: ${room.capacity} (should be 50-150)`);
        capacityOk = false;
        classroomIssues++;
      } else if (room.type === 'computer_lab' && (room.capacity < 20 || room.capacity > 50)) {
        console.log(`   ❌ Lab capacity issue: ${room.capacity} (should be 20-50)`);
        capacityOk = false;
        classroomIssues++;
      } else if (room.type === 'tutorial_room' && (room.capacity < 10 || room.capacity > 50)) {
        console.log(`   ❌ Tutorial room capacity issue: ${room.capacity} (should be 10-50)`);
        capacityOk = false;
        classroomIssues++;
      }
      
      if (capacityOk) {
        console.log(`   ✅ Capacity: ${room.capacity} (appropriate for ${room.type})`);
      }
      
      // Check facilities
      const facilities = room.facilities || [];
      console.log(`   ✅ Facilities: ${facilities.join(', ') || 'None'}`);
      
      console.log('');
    });
    
    // 4. Batch/Program Analysis
    console.log('🎓 BATCH/PROGRAM CONSTRAINTS ANALYSIS:');
    const batches = await Batch.find({}).populate('subjects.subject subjects.faculty');
    console.log(`Total batches: ${batches.length}\n`);
    
    let batchIssues = 0;
    batches.forEach((batch, index) => {
      console.log(`${index + 1}. ${batch.name}`);
      
      // Check enrollment vs capacity
      if (batch.enrolledStudents > batch.maxCapacity) {
        console.log(`   ❌ Over-enrollment: ${batch.enrolledStudents}/${batch.maxCapacity}`);
        batchIssues++;
      } else {
        console.log(`   ✅ Enrollment: ${batch.enrolledStudents}/${batch.maxCapacity}`);
      }
      
      // Check subject assignments
      console.log(`   Subjects: ${batch.subjects.length}`);
      batch.subjects.forEach((s, si) => {
        const subject = s.subject;
        const faculty = s.faculty;
        console.log(`     ${si + 1}. ${subject?.name || 'Unknown'} - Faculty: ${faculty?.user?.name || 'UNASSIGNED'}`);
        
        if (!faculty) {
          console.log(`        ❌ No faculty assigned to ${subject?.name}`);
          batchIssues++;
        }
      });
      
      console.log('');
    });
    
    // Summary
    console.log('📊 CONSTRAINT ANALYSIS SUMMARY:');
    console.log(`❌ Subject constraint issues: ${subjectIssues}`);
    console.log(`❌ Faculty constraint issues: ${facultyIssues}`);
    console.log(`❌ Classroom constraint issues: ${classroomIssues}`);
    console.log(`❌ Batch constraint issues: ${batchIssues}`);
    console.log(`\nTotal issues found: ${subjectIssues + facultyIssues + classroomIssues + batchIssues}`);
    
    if (subjectIssues + facultyIssues + classroomIssues + batchIssues === 0) {
      console.log('✅ All constraints satisfied!');
    } else {
      console.log('❌ Constraint violations found - this will prevent timetable generation');
    }
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

analyzeConstraints();
