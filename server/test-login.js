const axios = require('axios');

const API_BASE_URL = 'http://localhost:4000/api';

const testLogin = async () => {
  console.log('🧪 Testing Login API...\n');
  
  const testCredentials = [
    { email: 'admin@university.edu', password: 'password123' },
    { email: 'admin@university.com', password: 'admin123' },
    { email: 'admin@rru.edu', password: 'admin123' },
    { email: 'hod@university.edu', password: 'password123' },
  ];

  for (const cred of testCredentials) {
    try {
      console.log(`Testing login with: ${cred.email}`);
      const response = await axios.post(`${API_BASE_URL}/auth/login`, cred);
      
      if (response.data.success) {
        console.log('✅ Login successful!');
        console.log('User:', response.data.user);
        console.log('Token:', response.data.token ? 'Present' : 'Missing');
        break;
      }
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 401) {
        console.log(`❌ Invalid credentials for ${cred.email}`);
      } else {
        console.log(`⚠️ Error for ${cred.email}:`, error.message);
      }
    }
  }
  
  console.log('\n📝 If no login worked, you may need to:');
  console.log('   1. Seed the database with initial users');
  console.log('   2. Check MongoDB connection and data');
  console.log('   3. Use the correct admin credentials');
};

testLogin();
