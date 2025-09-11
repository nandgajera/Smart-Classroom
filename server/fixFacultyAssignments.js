const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const User = require('./src/models/User');
const Faculty = require('./src/models/Faculty');
const Subject = require('./src/models/Subject');
const Batch = require('./src/models/Batch');

async function assignFacultyToSubjects() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔗 Connected to database');
    
    // Get all faculty and subjects
    const faculty = await Faculty.find({}).populate('user', 'name email');
    const subjects = await Subject.find({});
    const batches = await Batch.find({}).populate('subjects.subject');
    
    console.log(`📊 Found ${faculty.length} faculty, ${subjects.length} subjects, ${batches.length} batches`);
    
    // Create a simple assignment strategy - assign faculty to subjects based on department
    const facultyAssignments = {};
    
    // For CSE subjects, assign to CSE faculty
    const cseFaculty = faculty.filter(f => f.departments.includes('CSE'));
    console.log(`👨‍🏫 CSE Faculty available: ${cseFaculty.map(f => f.user?.name).join(', ')}`);
    
    // Assign faculty to each subject type
    const subjectFacultyMap = {
      'CS301': cseFaculty[0]?._id, // Data Structures - Dr. John Smith
      'CS302': cseFaculty[1]?._id, // Database Management - Prof. Sarah Johnson  
      'CS303': cseFaculty[1]?._id, // Database Lab - Prof. Sarah Johnson (same as theory)
      'CS304': cseFaculty[0]?._id, // Object Oriented Programming - Dr. John Smith
      'CS305': cseFaculty[0]?._id, // OOP Lab - Dr. John Smith (same as theory)
      'MA301': cseFaculty[2]?._id || cseFaculty[0]?._id, // Discrete Mathematics - Assistant Professor 3 or fallback
    };
    
    console.log('\n🎯 Faculty assignments:');
    Object.entries(subjectFacultyMap).forEach(([code, facultyId]) => {
      const assignedFaculty = faculty.find(f => f._id.toString() === facultyId?.toString());
      console.log(`   ${code}: ${assignedFaculty?.user?.name || 'UNASSIGNED'}`);
    });
    
    // Update batches with faculty assignments
    for (const batch of batches) {
      console.log(`\n📚 Updating batch: ${batch.name}`);
      let updated = false;
      
      for (let i = 0; i < batch.subjects.length; i++) {
        const batchSubject = batch.subjects[i];
        const subject = batchSubject.subject;
        
        if (subject && subjectFacultyMap[subject.code]) {
          const oldFaculty = batchSubject.faculty;
          const newFaculty = subjectFacultyMap[subject.code];
          
          if (!oldFaculty || oldFaculty.toString() !== newFaculty.toString()) {
            batch.subjects[i].faculty = newFaculty;
            const assignedFaculty = faculty.find(f => f._id.toString() === newFaculty.toString());
            console.log(`   ✅ Assigned ${subject.name} to ${assignedFaculty?.user?.name}`);
            updated = true;
          } else {
            console.log(`   ℹ️ ${subject.name} already assigned to faculty`);
          }
        } else {
          console.log(`   ❌ No faculty mapping found for ${subject?.code || 'unknown'}`);
        }
      }
      
      if (updated) {
        await batch.save();
        console.log(`   💾 Saved updates for ${batch.name}`);
      }
    }
    
    console.log('\n✅ Faculty assignment completed!');
    
    // Verify assignments
    console.log('\n🔍 Verification:');
    const updatedBatches = await Batch.find({}).populate('subjects.subject subjects.faculty');
    
    for (const batch of updatedBatches) {
      console.log(`\n${batch.name}:`);
      batch.subjects.forEach((batchSubject, index) => {
        const subject = batchSubject.subject;
        const faculty = batchSubject.faculty;
        console.log(`  ${index + 1}. ${subject?.name} - ${faculty?.user?.name || 'UNASSIGNED'}`);
      });
    }
    
    await mongoose.connection.close();
    console.log('\n🎉 Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

assignFacultyToSubjects();
