const mongoose = require('mongoose');
const Faculty = require('./src/models/Faculty');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/smart_classroom', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function cleanupEmptyEmployeeIds() {
  try {
    console.log('🧹 Cleaning up empty employeeId values...');
    
    // Find all faculty with empty string employeeId
    const facultiesWithEmptyId = await Faculty.find({ 
      'professionalInfo.employeeId': '' 
    });
    
    console.log(`Found ${facultiesWithEmptyId.length} faculty records with empty employeeId`);
    
    // Update all empty string employeeIds to null
    const result = await Faculty.updateMany(
      { 'professionalInfo.employeeId': '' },
      { $set: { 'professionalInfo.employeeId': null } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} faculty records`);
    
    // Also clean up any records with undefined employeeId
    const result2 = await Faculty.updateMany(
      { 'professionalInfo.employeeId': { $exists: false } },
      { $set: { 'professionalInfo.employeeId': null } }
    );
    
    console.log(`✅ Cleaned up ${result2.modifiedCount} records with missing employeeId`);
    
    mongoose.connection.close();
    console.log('🎉 Database cleanup completed!');
    
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    mongoose.connection.close();
  }
}

cleanupEmptyEmployeeIds();
