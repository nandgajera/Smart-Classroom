const axios = require('axios');

const API_BASE_URL = 'http://localhost:4000/api';

async function testFacultyDetails() {
  try {
    console.log('🔍 Testing Faculty Details API...');
    
    // Step 1: Login as admin
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Step 2: Get all faculty to find our test faculty
    const listResponse = await axios.get(`${API_BASE_URL}/faculty`);
    console.log(`\n2. Retrieved ${listResponse.data.data.length} faculty members`);
    
    // Find recently created faculty (look for timestamp in email)
    const recentFaculty = listResponse.data.data.find(f => 
      f.user.email.includes('@university.edu')
    );
    
    if (!recentFaculty) {
      console.log('⚠️ No test faculty found');
      return;
    }
    
    console.log(`\n3. Testing details for: ${recentFaculty.user.name}`);
    console.log(`   Email: ${recentFaculty.user.email}`);
    console.log(`   Employee ID: ${recentFaculty.professionalInfo.employeeId || 'Not set'}`);
    console.log(`   Department: ${recentFaculty.user.department}`);
    
    // Step 3: Get detailed faculty information
    const detailResponse = await axios.get(`${API_BASE_URL}/faculty/${recentFaculty._id}`);
    const faculty = detailResponse.data.data;
    
    console.log('\n4. Faculty Details:');
    console.log(`   Name: ${faculty.user.name}`);
    console.log(`   Email: ${faculty.user.email}`);
    console.log(`   Role: ${faculty.user.role}`);
    console.log(`   Designation: ${faculty.professionalInfo.designation}`);
    console.log(`   Employee ID: ${faculty.professionalInfo.employeeId || 'Not set'}`);
    console.log(`   Departments: ${faculty.departments.join(', ')}`);
    console.log(`   Specialization: ${faculty.teachingInfo?.specialization?.join(', ') || 'Not set'}`);
    console.log(`   Max Classes/Day: ${faculty.teachingInfo?.maxClassesPerDay || 'Not set'}`);
    console.log(`   Weekly Load Limit: ${faculty.teachingInfo?.weeklyLoadLimit || 'Not set'}`);
    
    // Step 4: Test faculty timetable endpoint
    console.log('\n5. Testing Faculty Timetable...');
    try {
      const timetableResponse = await axios.get(`${API_BASE_URL}/faculty/${recentFaculty._id}/timetable`);
      console.log(`✅ Timetable retrieved: ${timetableResponse.data.data.length} time slots`);
    } catch (error) {
      console.log(`ℹ️ Timetable: ${error.response?.data?.message || 'No timetable data'}`);
    }
    
    // Step 5: Test faculty performance endpoint
    console.log('\n6. Testing Faculty Performance...');
    try {
      const performanceResponse = await axios.get(`${API_BASE_URL}/faculty/${recentFaculty._id}/performance`);
      console.log(`✅ Performance data retrieved`);
      console.log(`   Overall Rating: ${performanceResponse.data.data.overallRating || 'No ratings yet'}`);
    } catch (error) {
      console.log(`ℹ️ Performance: ${error.response?.data?.message || 'No performance data'}`);
    }
    
    console.log('\n🎉 Faculty details test completed!');
    
  } catch (error) {
    console.error('❌ Faculty details test failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Full error response:', error.response.data);
    }
  }
}

testFacultyDetails();
