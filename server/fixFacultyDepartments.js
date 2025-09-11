const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });
const Faculty = require('./src/models/Faculty');

async function fixFacultyDepartments() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    console.log('🔧 Updating faculty departments from "Computer Science" to "CSE"...');
    
    const result = await Faculty.updateMany(
      { departments: 'Computer Science' },
      { $set: { departments: ['CSE'] } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} faculty records`);
    
    // Verify the changes
    const updatedFaculty = await Faculty.find({}).populate('user', 'name');
    console.log('\n📋 Updated faculty departments:');
    updatedFaculty.forEach(f => {
      console.log(`  ${f.user?.name}: ${JSON.stringify(f.departments)}`);
    });
    
    await mongoose.connection.close();
    console.log('\n📤 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixFacultyDepartments();
