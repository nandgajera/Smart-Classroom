const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Batch = require('./src/models/Batch');

async function verifyAssignments() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔗 Connected to database');
    
    // Get batches without population first to see raw data
    const batches = await Batch.find({});
    
    console.log('📊 Raw batch data:');
    batches.forEach((batch, index) => {
      console.log(`\n${index + 1}. ${batch.name}`);
      batch.subjects.forEach((batchSubject, si) => {
        console.log(`   Subject ${si + 1}: ${batchSubject.subject} - Faculty: ${batchSubject.faculty || 'NULL'}`);
      });
    });
    
    await mongoose.connection.close();
    console.log('\n🎉 Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verifyAssignments();
