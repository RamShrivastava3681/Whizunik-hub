const fetch = require('node-fetch').default || require('node-fetch');

async function createPendingUser() {
  try {
    const testUserRegistration = async () => {
    try {
        console.log('🧪 Testing user registration endpoint...');
        
        const response = await fetch('http://localhost:5003/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'testpassword123',
        username: 'Test User',
        role: 'salesman'
      })
    });

    const data = await response.json();
    console.log('Registration response:', data);

    if (data.success) {
      console.log('✅ Test user registered successfully with pending status!');
      console.log('📧 Email:', 'testuser@example.com');
      console.log('👤 Username:', 'Test User');
      console.log('📋 Role:', 'salesman');
      console.log('⏳ Status:', 'pending');
    } else {
      console.log('❌ Registration failed:', data.message);
    }
  } catch (error) {
    console.error('Error creating test user:', error);
  }
}

createPendingUser();