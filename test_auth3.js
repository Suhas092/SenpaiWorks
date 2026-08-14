const http = require('http');
async function testLogin() {
  const loginPayload = JSON.stringify({
    email: 'newuser1@example.com',
    password: 'password123'
  });

  const resLogin = await fetch('http://127.0.0.1:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: loginPayload
  });
  
  const loginData = await resLogin.json();
  console.log('Login Result:', loginData);
}
testLogin();
