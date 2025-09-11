const axios = require('axios');

const API_BASE_URL = 'http://localhost:4000/api';

const testLogin = async () => {
  console.log('🧪 Testing New Login Credentials...\n');
  
  const testCredentials = [
    { email: 'admin@university.edu', password: 'admin123' },
    { email: 'admin@gmail.com', password: 'admin123' },
    { email: 'hod@university.edu', password: 'hod123' },
    { email: 'faculty@university.edu', password: 'faculty123' },
  ];

  for (const cred of testCredentials) {
    try {
      console.log(`Testing login with: ${cred.email}`);
      const response = await axios.post(`${API_BASE_URL}/auth/login`, cred);
      
      if (response.data.success) {
        console.log('✅ Login successful!');
        console.log('   User:', response.data.user.name);
        console.log('   Role:', response.data.user.role);
        console.log('   Department:', response.data.user.department);
        console.log('   Token:', response.data.token ? 'Present' : 'Missing');
        console.log('');
      }
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 401) {
        console.log(`❌ Invalid credentials for ${cred.email}`);
        console.log('   Error:', error.response.data.message);
      } else {
        console.log(`⚠️ Error for ${cred.email}:`, error.message);
      }
      console.log('');
    }
  }
};

testLogin();
