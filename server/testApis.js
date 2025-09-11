const axios = require('axios');

const API_BASE_URL = 'http://localhost:4000/api';

async function testAPIs() {
  try {
    console.log('🧪 Testing Admin APIs...');
    
    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Admin login failed');
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // Set default headers
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Step 2: Test subjects API
    console.log('\n2. Testing Subjects API...');
    
    // GET subjects
    console.log('  - GET /api/subjects');
    const subjectsResponse = await axios.get(`${API_BASE_URL}/subjects`);
    console.log(`  ✅ GET subjects: ${subjectsResponse.data.subjects?.length || 0} subjects found`);
    
    // POST new subject
    console.log('  - POST /api/subjects');
    const newSubject = {
      code: 'TEST101',
      name: 'Test Subject',
      department: 'Computer Science',
      credits: 3,
      type: 'theory',
      semester: 1,
      program: 'UG',
      sessionsPerWeek: 3,
      sessionDuration: 60,
      academicYear: '2024-25'
    };
    
    const createSubjectResponse = await axios.post(`${API_BASE_URL}/subjects`, newSubject);
    console.log(`  ✅ POST subject: ${createSubjectResponse.data.message}`);
    const subjectId = createSubjectResponse.data.data._id;
    
    // PUT update subject
    console.log('  - PUT /api/subjects/:id');
    const updateSubjectResponse = await axios.put(`${API_BASE_URL}/subjects/${subjectId}`, {
      ...newSubject,
      name: 'Updated Test Subject'
    });
    console.log(`  ✅ PUT subject: ${updateSubjectResponse.data.message}`);
    
    // Step 3: Test classrooms API
    console.log('\n3. Testing Classrooms API...');
    
    // GET classrooms
    console.log('  - GET /api/classrooms');
    const classroomsResponse = await axios.get(`${API_BASE_URL}/classrooms`);
    console.log(`  ✅ GET classrooms: ${classroomsResponse.data.classrooms?.length || classroomsResponse.data.data?.length || 0} classrooms found`);
    
    // POST new classroom
    console.log('  - POST /api/classrooms');
    const newClassroom = {
      roomNumber: 'TEST-101',
      building: 'Test Building',
      floor: 1,
      capacity: 50,
      type: 'lecture_hall',
      department: 'Computer Science',
      facilities: ['projector', 'whiteboard'],
      isActive: true
    };
    
    const createClassroomResponse = await axios.post(`${API_BASE_URL}/classrooms`, newClassroom);
    console.log(`  ✅ POST classroom: ${createClassroomResponse.data.message}`);
    const classroomId = createClassroomResponse.data.data._id;
    
    // PUT update classroom
    console.log('  - PUT /api/classrooms/:id');
    const updateClassroomResponse = await axios.put(`${API_BASE_URL}/classrooms/${classroomId}`, {
      ...newClassroom,
      capacity: 60
    });
    console.log(`  ✅ PUT classroom: ${updateClassroomResponse.data.message}`);
    
    // Step 4: Test faculty API
    console.log('\n4. Testing Faculty API...');
    
    // GET faculty
    console.log('  - GET /api/faculty');
    const facultyResponse = await axios.get(`${API_BASE_URL}/faculty`);
    console.log(`  ✅ GET faculty: ${facultyResponse.data.data?.length || 0} faculty found`);
    
    console.log('\n🎉 All API tests completed successfully!');
    
  } catch (error) {
    console.error('❌ API Test failed:', error.response?.data?.message || error.message);
    console.error('Response status:', error.response?.status);
    console.error('Response data:', error.response?.data);
  }
}

testAPIs();
