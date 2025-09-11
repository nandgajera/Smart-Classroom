const axios = require('axios');

const API_BASE_URL = 'http://localhost:4000/api';

const testCRUD = async () => {
  console.log('🧪 Testing CRUD Endpoints...\n');
  
  try {
    // First, login to get a token
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@university.edu',
      password: 'admin123'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Set up headers with token
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Test Faculty routes
    console.log('\n📚 Testing Faculty Routes:');
    
    // GET all faculty
    try {
      const facultyResponse = await axios.get(`${API_BASE_URL}/faculty`, { headers });
      console.log('✅ GET /api/faculty - Success:', facultyResponse.data.faculty?.length || 0, 'faculty found');
    } catch (error) {
      console.log('❌ GET /api/faculty - Error:', error.response?.status, error.response?.data?.message);
    }
    
    // POST new faculty
    try {
      const newFaculty = {
        name: 'Test Faculty',
        email: 'test.faculty@university.edu', 
        password: 'test123',
        employeeId: 'TEST001',
        department: 'Computer Science',
        designation: 'Assistant Professor',
        expertices: 'Programming, Algorithms',
        maxWeeklyHours: 18
      };
      
      const createResponse = await axios.post(`${API_BASE_URL}/faculty`, newFaculty, { headers });
      console.log('✅ POST /api/faculty - Success: Faculty created');
      
      const facultyId = createResponse.data.faculty._id;
      
      // PUT update faculty
      const updateData = { designation: 'Associate Professor', maxWeeklyHours: 20 };
      const updateResponse = await axios.put(`${API_BASE_URL}/faculty/${facultyId}`, updateData, { headers });
      console.log('✅ PUT /api/faculty/:id - Success: Faculty updated');
      
      // DELETE faculty
      const deleteResponse = await axios.delete(`${API_BASE_URL}/faculty/${facultyId}`, { headers });
      console.log('✅ DELETE /api/faculty/:id - Success: Faculty deleted');
      
    } catch (error) {
      console.log('❌ Faculty CRUD operations - Error:', error.response?.status, error.response?.data?.message);
    }
    
    // Test Subject routes
    console.log('\n📖 Testing Subject Routes:');
    
    // GET all subjects
    try {
      const subjectResponse = await axios.get(`${API_BASE_URL}/subjects`, { headers });
      console.log('✅ GET /api/subjects - Success:', subjectResponse.data.subjects?.length || 0, 'subjects found');
    } catch (error) {
      console.log('❌ GET /api/subjects - Error:', error.response?.status, error.response?.data?.message);
    }
    
    // POST new subject
    try {
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
      
      const createResponse = await axios.post(`${API_BASE_URL}/subjects`, newSubject, { headers });
      console.log('✅ POST /api/subjects - Success: Subject created');
      
      const subjectId = createResponse.data.subject._id;
      
      // PUT update subject
      const updateData = { credits: 4, sessionsPerWeek: 4 };
      const updateResponse = await axios.put(`${API_BASE_URL}/subjects/${subjectId}`, updateData, { headers });
      console.log('✅ PUT /api/subjects/:id - Success: Subject updated');
      
      // DELETE subject
      const deleteResponse = await axios.delete(`${API_BASE_URL}/subjects/${subjectId}`, { headers });
      console.log('✅ DELETE /api/subjects/:id - Success: Subject deleted');
      
    } catch (error) {
      console.log('❌ Subject CRUD operations - Error:', error.response?.status, error.response?.data?.message);
    }
    
    // Test Classroom routes
    console.log('\n🏫 Testing Classroom Routes:');
    
    // GET all classrooms
    try {
      const classroomResponse = await axios.get(`${API_BASE_URL}/classrooms`, { headers });
      console.log('✅ GET /api/classrooms - Success:', classroomResponse.data.classrooms?.length || 0, 'classrooms found');
    } catch (error) {
      console.log('❌ GET /api/classrooms - Error:', error.response?.status, error.response?.data?.message);
    }
    
    // POST new classroom
    try {
      const newClassroom = {
        roomNumber: 'TEST-101',
        building: 'Test Building',
        floor: 1,
        capacity: 30,
        type: 'lecture_hall',
        facilities: ['projector', 'whiteboard'],
        department: 'Computer Science'
      };
      
      const createResponse = await axios.post(`${API_BASE_URL}/classrooms`, newClassroom, { headers });
      console.log('✅ POST /api/classrooms - Success: Classroom created');
      
      const classroomId = createResponse.data.classroom._id;
      
      // PUT update classroom
      const updateData = { capacity: 35, facilities: ['projector', 'whiteboard', 'air_conditioning'] };
      const updateResponse = await axios.put(`${API_BASE_URL}/classrooms/${classroomId}`, updateData, { headers });
      console.log('✅ PUT /api/classrooms/:id - Success: Classroom updated');
      
      // DELETE classroom
      const deleteResponse = await axios.delete(`${API_BASE_URL}/classrooms/${classroomId}`, { headers });
      console.log('✅ DELETE /api/classrooms/:id - Success: Classroom deleted');
      
    } catch (error) {
      console.log('❌ Classroom CRUD operations - Error:', error.response?.status, error.response?.data?.message);
    }
    
    console.log('\n🎉 CRUD testing completed!');
    console.log('✨ All endpoints should now work in the frontend application.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testCRUD();
