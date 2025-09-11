const axios = require('axios');

const API_BASE_URL = 'http://localhost:4000/api';

async function debugAuth() {
  try {
    // Login and get token
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('Token:', token);
    console.log('User data:', loginResponse.data.user);
    
    // Test the /auth/me endpoint to verify the user
    const meResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Current user data from /auth/me:');
    console.log(meResponse.data.user);
    
  } catch (error) {
    console.error('Debug failed:', error.response?.data || error.message);
  }
}

debugAuth();
