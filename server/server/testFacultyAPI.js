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

async function testFacultyAPI() {
    try {
        console.log('🧪 Testing Faculty API endpoints...\n');

        // First, let's try to get a valid admin token for testing
        // We'll use a mock token for now - in practice you'd login first
        const adminToken = 'mock-admin-token'; // Replace with actual token

        console.log('1. Testing GET /api/faculty (list all faculty)');
        try {
            const response = await axios.get(`${API_BASE_URL}/faculty`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            console.log('✅ Faculty list retrieved successfully');
            console.log(`   Found ${response.data.data?.length || 0} faculty members`);
            
            if (response.data.data?.length > 0) {
                const sampleFaculty = response.data.data[0];
                console.log(`   Sample faculty: ${sampleFaculty.user?.name} (${sampleFaculty._id})`);
                
                // Test getting single faculty details
                console.log('\n2. Testing GET /api/faculty/:id (single faculty details)');
                try {
                    const detailResponse = await axios.get(`${API_BASE_URL}/faculty/${sampleFaculty._id}`, {
                        headers: { Authorization: `Bearer ${adminToken}` }
                    });
                    console.log('✅ Faculty details retrieved successfully');
                    console.log(`   Faculty name: ${detailResponse.data.data.user?.name}`);
                    console.log(`   Email: ${detailResponse.data.data.user?.email}`);
                    console.log(`   Departments: ${detailResponse.data.data.departments?.join(', ')}`);
                } catch (error) {
                    console.log('❌ Error getting faculty details:', error.response?.data?.message || error.message);
                }
            }
        } catch (error) {
            console.log('❌ Error getting faculty list:', error.response?.data?.message || error.message);
        }

        console.log('\n3. Testing POST /api/faculty (create new faculty)');
        try {
            const createResponse = await axios.post(`${API_BASE_URL}/faculty`, testFacultyData, {
                headers: { 
                    Authorization: `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ Faculty created successfully');
            console.log(`   Created faculty: ${createResponse.data.data.user?.name}`);
            console.log(`   Faculty ID: ${createResponse.data.data._id}`);
            console.log(`   User ID: ${createResponse.data.data.user?._id}`);
            
            // Clean up - delete the test faculty (if delete endpoint exists)
            const createdFacultyId = createResponse.data.data._id;
            console.log(`\n4. Cleaning up test faculty (ID: ${createdFacultyId})`);
            // Note: Assuming there's a delete endpoint - adjust if needed
            try {
                await axios.delete(`${API_BASE_URL}/faculty/${createdFacultyId}`, {
                    headers: { Authorization: `Bearer ${adminToken}` }
                });
                console.log('✅ Test faculty deleted successfully');
            } catch (deleteError) {
                console.log('⚠️  Could not delete test faculty (delete endpoint may not exist)');
            }
            
        } catch (error) {
            console.log('❌ Error creating faculty:', error.response?.data?.message || error.message);
            if (error.response?.data?.details) {
                console.log('   Details:', error.response.data.details);
            }
        }

    } catch (error) {
        console.log('❌ General test error:', error.message);
    }
}

// Test without auth first to see API structure
async function testFacultyAPIWithoutAuth() {
    try {
        console.log('🔍 Testing API without auth to check error responses...\n');
        
        const response = await axios.get(`${API_BASE_URL}/faculty`);
        console.log('Unexpected: Got response without auth token');
    } catch (error) {
        console.log('Expected: API requires authentication');
        console.log(`Status: ${error.response?.status}`);
        console.log(`Message: ${error.response?.data?.message || error.message}`);
    }
}

// Run tests
console.log('🚀 Starting Faculty API Tests\n');
testFacultyAPIWithoutAuth().then(() => {
    console.log('\n' + '='.repeat(50) + '\n');
    return testFacultyAPI();
}).then(() => {
    console.log('\n✅ All tests completed');
}).catch(error => {
    console.log('\n❌ Test suite failed:', error.message);
});
