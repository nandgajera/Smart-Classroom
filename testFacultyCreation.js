const axios = require('axios');

const API_BASE_URL = 'http://localhost:4000/api';

async function testFacultyCreation() {
  try {
    console.log('🧪 Testing Faculty Creation...');
    
    // Step 1: Login as admin
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // Set default headers
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Step 2: Test faculty creation with proper data structure
    console.log('\n2. Testing Faculty Creation...');
    
    // Generate unique email using timestamp
    const timestamp = Date.now();
    const newFacultyData = {
      userData: {
        name: 'Dr. Test Faculty',
        email: `test.faculty.${timestamp}@university.edu`,
        password: 'password123',
        department: 'Computer Science'
      },
      facultyData: {
        departments: ['Computer Science'],
        professionalInfo: {
          designation: 'Assistant Professor',
          employeeId: `FAC${timestamp}` // Non-empty employee ID with timestamp
        },
        personalInfo: {
          gender: 'Male',
          bloodGroup: 'B+',
          maritalStatus: 'Single'
        },
        academicInfo: {
          experience: {
            totalExperience: 5,
            teachingExperience: 3
          }
        },
        teachingInfo: {
          specialization: ['Machine Learning', 'Data Structures'],
          maxClassesPerDay: 6,
          weeklyLoadLimit: 18
        }
      }
    };
    
    const createResponse = await axios.post(`${API_BASE_URL}/faculty`, newFacultyData);
    console.log(`✅ Faculty created: ${createResponse.data.message}`);
    console.log('Faculty ID:', createResponse.data.data._id);
    console.log('Faculty Name:', createResponse.data.data.user.name);
    
    // Step 3: Test faculty creation with different employeeId
    console.log('\n3. Testing Faculty Creation with different Employee ID...');
    
    const newFacultyData2 = {
      userData: {
        name: 'Dr. Test Faculty 2',
        email: `test.faculty2.${timestamp}@university.edu`,
        password: 'password123',
        department: 'Mechanical Engineering'
      },
      facultyData: {
        professionalInfo: {
          designation: 'Professor',
          employeeId: `MECH${timestamp}` // Different unique employee ID
        },
        teachingInfo: {
          specialization: ['Thermodynamics'],
          maxClassesPerDay: 4
        }
      }
    };
    
    const createResponse2 = await axios.post(`${API_BASE_URL}/faculty`, newFacultyData2);
    console.log(`✅ Second faculty created: ${createResponse2.data.message}`);
    console.log('Second Faculty ID:', createResponse2.data.data._id);
    
    // Step 4: Test duplicate email (should fail gracefully)
    console.log('\n4. Testing Duplicate Email (should fail)...');
    
    try {
      await axios.post(`${API_BASE_URL}/faculty`, {
        userData: {
          name: 'Duplicate User',
          email: `test.faculty.${timestamp}@university.edu`, // Same email as first
          password: 'password123',
          department: 'Electronics'
        },
        facultyData: {
          professionalInfo: {
            designation: 'Lecturer'
          }
        }
      });
    } catch (error) {
      console.log(`✅ Duplicate email properly rejected: ${error.response.data.message}`);
    }
    
    // Step 5: Test fetching all faculty
    console.log('\n5. Testing Faculty List API...');
    
    const listResponse = await axios.get(`${API_BASE_URL}/faculty`);
    console.log(`✅ Retrieved ${listResponse.data.data.length} faculty members`);
    console.log(`Total faculty count: ${listResponse.data.pagination.totalItems}`);
    
    // Show sample data of created faculty
    const createdFaculty = listResponse.data.data.filter(f => 
      f.user.email.includes(timestamp)
    );
    console.log(`Found ${createdFaculty.length} newly created faculty in the list`);
    
    console.log('\n🎉 All faculty creation tests completed!');
    
  } catch (error) {
    console.error('❌ Faculty creation test failed:', error.response?.data?.message || error.message);
    console.error('Response status:', error.response?.status);
    console.error('Full error response:', error.response?.data);
  }
}

testFacultyCreation();
