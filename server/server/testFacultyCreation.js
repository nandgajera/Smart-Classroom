const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test data for creating faculty
const testFacultyData = {
    userData: {
        name: 'Test Faculty Member',
        email: 'test.faculty@example.com',
        password: 'testpass123',
        department: 'Computer Science'
    },
    facultyData: {
        departments: ['Computer Science'],
        professionalInfo: {
            designation: 'Assistant Professor',
            employeeId: 'EMP001'
        },
        personalInfo: {},
        academicInfo: {
            experience: {
                totalExperience: 5,
                teachingExperience: 3
            }
        },
        teachingInfo: {
            specialization: ['Database Systems'],
            maxClassesPerDay: 6,
            weeklyLoadLimit: 18
        }
    }
};

// Login credentials from seed data
const adminCredentials = {
    email: 'admin@gmail.com',
    password: 'admin123'
};

async function testFacultyCreation() {
    try {
        console.log('🔐 Step 1: Login with admin credentials to get authentication token');
        let authToken;
        try {
            const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, adminCredentials);
            authToken = loginResponse.data.token;
            console.log('✅ Login successful');
            console.log(`   User: ${loginResponse.data.user.name} (${loginResponse.data.user.role})`);
            console.log(`   Token: ${authToken.substring(0, 15)}...`);
        } catch (error) {
            console.log('❌ Login failed:', error.response?.data?.message || error.message);
            return;
        }

        console.log('\n📝 Step 2: Testing POST /api/faculty (create new faculty)');
        let createdFaculty;
        try {
            const createResponse = await axios.post(`${API_BASE_URL}/faculty`, testFacultyData, {
                headers: { 
                    Authorization: `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            createdFaculty = createResponse.data.data;
            console.log('✅ Faculty created successfully');
            console.log('   Response structure:');
            console.log(`   - success: ${createResponse.data.success}`);
            console.log(`   - message: ${createResponse.data.message}`);
            console.log('   - data:');
            console.log(`     - _id: ${createdFaculty._id}`);
            console.log(`     - user._id: ${createdFaculty.user?._id || 'Missing user ID'}`);
            console.log(`     - user.name: ${createdFaculty.user?.name || 'Missing user name'}`);
            console.log(`     - user.email: ${createdFaculty.user?.email || 'Missing user email'}`);
            console.log(`     - departments: ${createdFaculty.departments?.join(', ') || 'Missing departments'}`);
            
            // Check if user record is properly linked
            if (!createdFaculty.user || !createdFaculty.user._id) {
                console.log('⚠️ Issue detected: User record not properly linked to faculty');
            }
        } catch (error) {
            console.log('❌ Faculty creation failed:', error.response?.data?.message || error.message);
            if (error.response?.data?.details) {
                console.log('   Details:', error.response.data.details);
            }
            return;
        }

        console.log('\n🔎 Step 3: Testing GET /api/faculty/:id (fetch created faculty details)');
        try {
            const detailResponse = await axios.get(`${API_BASE_URL}/faculty/${createdFaculty._id}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            
            const fetchedFaculty = detailResponse.data.data;
            console.log('✅ Faculty details retrieved successfully');
            console.log('   Response structure:');
            console.log(`   - success: ${detailResponse.data.success}`);
            console.log(`   - data:`);
            console.log(`     - _id: ${fetchedFaculty._id}`);
            console.log(`     - user.name: ${fetchedFaculty.user?.name || 'Missing user name'}`);
            console.log(`     - user.email: ${fetchedFaculty.user?.email || 'Missing user email'}`);
            console.log(`     - departments: ${fetchedFaculty.departments?.join(', ') || 'Missing departments'}`);
            
            // Verify fields match what was sent
            const fieldsMatch = 
                fetchedFaculty.user?.name === testFacultyData.userData.name &&
                fetchedFaculty.user?.email === testFacultyData.userData.email &&
                fetchedFaculty.departments?.includes(testFacultyData.userData.department);
                
            if (!fieldsMatch) {
                console.log('⚠️ Issue detected: Retrieved faculty data does not match created data');
                console.log('   Expected:');
                console.log(`   - name: ${testFacultyData.userData.name}`);
                console.log(`   - email: ${testFacultyData.userData.email}`);
                console.log(`   - department: ${testFacultyData.userData.department}`);
            } else {
                console.log('✅ Retrieved faculty data matches created data');
            }
            
            // Check if user record is properly populated
            if (!fetchedFaculty.user || !fetchedFaculty.user._id) {
                console.log('⚠️ Issue detected: User record not properly populated in faculty details');
            }
        } catch (error) {
            console.log('❌ Error getting faculty details:', error.response?.data?.message || error.message);
        }

    } catch (error) {
        console.log('❌ General test error:', error.message);
    }
}

// Run the tests
console.log('🚀 Starting Faculty Creation Test\n');
testFacultyCreation().then(() => {
    console.log('\n✅ Faculty creation test completed');
}).catch(error => {
    console.log('\n❌ Test suite failed:', error.message);
});
