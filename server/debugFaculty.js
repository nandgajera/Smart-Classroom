const mongoose = require('mongoose');
const Faculty = require('./src/models/Faculty');
require('dotenv').config({ path: './server/.env' });

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000
    });
    console.log('✅ Connected to MongoDB successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
};

const debugFacultyStructure = async () => {
  try {
    const facultyRecords = await Faculty.find({}).lean();
    
    console.log('Faculty Records Structure:');
    console.log('========================');
    
    for (let i = 0; i < facultyRecords.length; i++) {
      const faculty = facultyRecords[i];
      console.log(`\nFaculty ${i + 1}:`);
      console.log('Raw document:', JSON.stringify(faculty, null, 2));
      console.log('User field:', faculty.user);
      console.log('User field type:', typeof faculty.user);
      console.log('User field exists:', 'user' in faculty);
      console.log('User is null:', faculty.user === null);
      console.log('User is undefined:', faculty.user === undefined);
    }
    
  } catch (error) {
    console.error('❌ Error debugging faculty:', error.message);
  }
};

const main = async () => {
  const connected = await connectDB();
  if (connected) {
    await debugFacultyStructure();
    await mongoose.connection.close();
  }
};

main().catch(console.error);
