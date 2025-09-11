const axios = require('axios');
require('dotenv').config({ path: './server/.env' });

const API_BASE_URL = 'http://localhost:5000/api';

// Admin credentials (from our earlier tests)
const adminCredentials = {
  email: 'admin@test.com',
  password: 'admin123'
};

// Test timetable generation parameters
const timetableRequest = {
  name: 'CSE Semester 3 Timetable - Pilot',
  academicYear: '2024-25',
  semester: 3,
  department: 'CSE',
  constraints: {
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    workingHours: { startTime: '09:00', endTime: '17:00' },
    lunchBreak: { startTime: '12:30', endTime: '13:30' },
    maxClassesPerDay: 6,
    breakDuration: 15
  }
};

async function testTimetableGeneration() {
  try {
    console.log('🚀 Starting Timetable Generation Test\n');
    
    // Step 1: Login as admin
    console.log('🔐 Step 1: Admin Login');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, adminCredentials);
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }
    
    const authToken = loginResponse.data.token;
    const user = loginResponse.data.user;
    
    console.log('✅ Login successful');
    console.log(`   User: ${user.name} (${user.role})`);
    console.log(`   Token: ${authToken.substring(0, 20)}...`);
    
    // Step 2: Test timetable generation
    console.log('\n📅 Step 2: Generate Timetable');
    console.log('   Requesting timetable generation...');
    console.log(`   Department: ${timetableRequest.department}`);
    console.log(`   Academic Year: ${timetableRequest.academicYear}`);
    console.log(`   Semester: ${timetableRequest.semester}`);
    
    const startTime = Date.now();
    
    try {
      const timetableResponse = await axios.post(
        `${API_BASE_URL}/timetables/generate`, 
        timetableRequest,
        {
          headers: { 
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 seconds timeout
        }
      );
      
      const generationTime = Date.now() - startTime;
      
      if (timetableResponse.data.success) {
        console.log('✅ Timetable generation successful!');
        console.log(`   Generation time: ${generationTime}ms`);
        
        const timetable = timetableResponse.data.timetable;
        const metrics = timetableResponse.data.generationMetrics;
        
        console.log('\n📊 Timetable Details:');
        console.log(`   ID: ${timetable._id}`);
        console.log(`   Name: ${timetable.name}`);
        console.log(`   Status: ${timetable.status}`);
        console.log(`   Algorithm: ${timetable.algorithm}`);
        console.log(`   Optimization Score: ${timetable.optimizationScore}%`);
        
        console.log('\n📈 Generation Metrics:');
        console.log(`   Total Scheduled Sessions: ${metrics.totalSlots}`);
        console.log(`   Conflicts Found: ${metrics.conflicts}`);
        console.log(`   Quality Score: ${metrics.score}%`);
        console.log(`   Generation Time: ${metrics.generationTime}ms`);
        
        // Step 3: Display schedule sample
        console.log('\n📋 Schedule Sample (First 10 sessions):');
        if (timetable.schedule && timetable.schedule.length > 0) {
          const sampleSessions = timetable.schedule.slice(0, 10);
          sampleSessions.forEach((session, index) => {
            console.log(`   ${index + 1}. ${session.day} ${session.startTime}-${session.endTime}`);
            console.log(`      Subject: ${session.subject?.name || 'Unknown'}`);
            console.log(`      Faculty: ${session.faculty?.user?.name || 'Unknown'}`);
            console.log(`      Classroom: ${session.classroom?.roomNumber || 'Unknown'}`);
            console.log(`      Batch: ${session.batch?.code || 'Unknown'}`);
            console.log(`      Type: ${session.sessionType}`);
            console.log('');
          });
          
          console.log(`   ... and ${Math.max(0, timetable.schedule.length - 10)} more sessions`);
        } else {
          console.log('   No sessions scheduled');
        }
        
        // Step 4: Check for conflicts
        console.log('\n⚠️ Step 3: Check for Conflicts');
        if (timetable.conflicts && timetable.conflicts.length > 0) {
          console.log(`Found ${timetable.conflicts.length} conflicts:`);
          timetable.conflicts.forEach((conflict, index) => {
            console.log(`   ${index + 1}. ${conflict.type}: ${conflict.description} (${conflict.severity})`);
          });
        } else {
          console.log('✅ No conflicts found!');
        }
        
        // Step 5: Display statistics
        if (timetable.statistics) {
          console.log('\n📊 Statistics:');
          console.log(`   Total Classes: ${timetable.statistics.totalClasses}`);
          console.log(`   Utilization Rate: ${timetable.statistics.utilizationRate?.toFixed(2)}%`);
          
          if (timetable.statistics.dailyDistribution) {
            console.log('   Daily Distribution:');
            Object.entries(timetable.statistics.dailyDistribution).forEach(([day, count]) => {
              if (count > 0) {
                console.log(`     ${day}: ${count} sessions`);
              }
            });
          }
        }
        
        return timetable;
        
      } else {
        console.log('❌ Timetable generation failed');
        console.log('   Message:', timetableResponse.data.message);
        return null;
      }
      
    } catch (generationError) {
      console.log('❌ Timetable generation failed');
      console.log('   Error:', generationError.response?.data?.message || generationError.message);
      console.log('   Status:', generationError.response?.status);
      
      if (generationError.response?.data?.details) {
        console.log('   Details:', generationError.response.data.details);
      }
      
      return null;
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
    return null;
  }
}

// Additional test for fetching generated timetables
async function testTimetableFetch() {
  try {
    console.log('\n📋 Step 4: Fetch Timetables List');
    
    // Login again
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, adminCredentials);
    const authToken = loginResponse.data.token;
    
    const listResponse = await axios.get(`${API_BASE_URL}/timetables`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      params: {
        department: 'CSE',
        academicYear: '2024-25',
        semester: 3
      }
    });
    
    if (listResponse.data.success) {
      console.log('✅ Timetables fetched successfully');
      console.log(`   Found ${listResponse.data.timetables.length} timetables`);
      
      listResponse.data.timetables.forEach((timetable, index) => {
        console.log(`   ${index + 1}. ${timetable.name}`);
        console.log(`      Status: ${timetable.status}`);
        console.log(`      Created: ${new Date(timetable.generationDate).toLocaleString()}`);
        console.log(`      Score: ${timetable.optimizationScore}%`);
      });
    }
    
  } catch (error) {
    console.log('❌ Error fetching timetables:', error.response?.data?.message || error.message);
  }
}

// Run the tests
async function runAllTests() {
  const timetable = await testTimetableGeneration();
  
  if (timetable) {
    await testTimetableFetch();
  }
  
  console.log('\n✅ All tests completed');
}

runAllTests().catch(error => {
  console.error('\n❌ Test suite failed:', error.message);
  process.exit(1);
});
