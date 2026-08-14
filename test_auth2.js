const http = require('http');

async function testAuthFlow() {
  // 1. Signup
  const signupPayload = JSON.stringify({
    email: 'newuser1@example.com',
    username: 'newuser1',
    password: 'password123'
  });

  const resSignup = await fetch('http://127.0.0.1:5000/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: signupPayload
  });
  
  const signupData = await resSignup.json();
  console.log('Signup Result:', signupData);

  if (!signupData.token) {
    console.error('No token returned on signup!');
    return;
  }

  // 2. Fetch Notifications with Token
  const resNotifs = await fetch('http://127.0.0.1:5000/api/notifications', {
    headers: { 'Authorization': 'Bearer ' + signupData.token }
  });
  
  const notifsData = await resNotifs.json();
  console.log('Notifications Result:', notifsData);
}

testAuthFlow();
