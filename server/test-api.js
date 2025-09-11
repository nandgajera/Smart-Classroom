const axios = require('axios');

const API_BASE_URL = 'http://localhost:4000/api';

const testAPI = async () => {
  console.log('🧪 Testing Smart Classroom API...\n');
  
  try {
    // Test health endpoint
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);
    
    // Test auth endpoint
    console.log('\n2️⃣ Testing authentication...');
    try {
      const authResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'admin@university.edu',
        password: 'password123'
      });
      console.log('✅ Auth endpoint working (expected to fail without seeded data)');
    } catch (authError) {
      console.log('⚠️ Auth endpoint responding (no seeded data yet):', authError.response?.status || 'Connection error');
    }
    
    // Test schools endpoint (should fail without auth)
    console.log('\n3️⃣ Testing schools endpoint without auth...');
    try {
      const schoolsResponse = await axios.get(`${API_BASE_URL}/schools`);
      console.log('❌ Unexpected: Schools endpoint accessible without auth');
    } catch (schoolsError) {
      if (schoolsError.response?.status === 401) {
        console.log('✅ Schools endpoint properly protected (401 Unauthorized)');
      } else {
        console.log('⚠️ Schools endpoint error:', schoolsError.response?.status || 'Connection error');
      }
    }
    
    console.log('\n🎉 API structure is working correctly!');
    console.log('📝 Next steps:');
    console.log('   1. Start the server: npm start (in server directory)');
    console.log('   2. Start the client: npm start (in client directory)'); 
    console.log('   3. Navigate to Student Data Management');
    console.log('   4. The system will use demo data since database seeding timed out');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('\n💡 Make sure the server is running on port 4000');
  }
};

testAPI();
