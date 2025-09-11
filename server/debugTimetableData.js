const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });
const User = require('./src/models/User');
const Faculty = require('./src/models/Faculty');
const Batch = require('./src/models/Batch');
const Subject = require('./src/models/Subject');

async function debugData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    console.log('\n=== FACULTY DEPARTMENTS ===');
    const faculty = await Faculty.find({}).populate('user');
    faculty.forEach(f => {
      console.log(`Faculty: ${f.user?.name}, Departments: ${JSON.stringify(f.departments)}`);
    });
    
    console.log('\n=== BATCHES AND SUBJECTS ===');
    const batches = await Batch.find({}).populate([
      { path: 'subjects.subject' },
      { path: 'subjects.faculty', populate: { path: 'user', select: 'name' } }
    ]);
    batches.forEach(b => {
      console.log(`Batch: ${b.name}, Department: ${b.department}`);
      b.subjects.forEach(s => {
        console.log(`  Subject: ${s.subject?.name}`);
        console.log(`    Faculty ID: ${s.faculty || 'None'}`);
        console.log(`    Faculty Name: ${s.faculty?.user?.name || 'None assigned'}`);
      });
    });
    
    console.log('\n=== SUBJECTS ===');
    const subjects = await Subject.find({});
    subjects.forEach(s => {
      console.log(`Subject: ${s.name}, Department: ${s.department}, Sessions/Week: ${s.sessionsPerWeek}`);
    });
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugData();
