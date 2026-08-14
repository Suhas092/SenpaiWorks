const http = require('http');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function sendPostRequest(path, postData) {
  return new Promise((resolve) => {
    const dataString = JSON.stringify(postData);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
      });
    });

    req.on('error', (err) => resolve({ statusCode: 500, data: { error: err.message } }));
    req.write(dataString);
    req.end();
  });
}

async function runSecurityTests() {
  console.log('=== STARTING SECURITY VERIFICATION TESTS ===\n');

  // Ensure test user exists in SQLite DB
  await prisma.user.upsert({
    where: { email: 'suhas_secure@example.com' },
    update: { username: 'suhas_official' },
    create: { email: 'suhas_secure@example.com', username: 'suhas_official', name: 'Suhas Official' }
  });

  // TEST 1: XSS Injection Test
  console.log('--- TEST 1: XSS Payload Injection (<script>alert(1)</script>) ---');
  const xssResponse = await sendPostRequest('/api/anime/comments', {
    animeId: 'xss_test_artwork',
    userKey: 'suhas_official',
    text: '<script>alert(1)</script>'
  });

  console.log('API Response Status:', xssResponse.statusCode);
  console.log('Returned Comment Object:', xssResponse.data);
  const isXssSanitized = xssResponse.data.text === '&lt;script&gt;alert(1)&lt;/script&gt;';
  console.log('XSS Sanitization Verdict:', isXssSanitized ? 'PASSED (Harmful tags escaped to plain text)' : 'FAILED');

  // TEST 2: Identity Forgery Test
  console.log('\n--- TEST 2: Identity Forgery Attempt (Spoofing Username field) ---');
  const spoofResponse = await sendPostRequest('/api/anime/comments', {
    animeId: 'forgery_test_artwork',
    userKey: 'suhas_official',          // Verified session/account key
    username: 'SpoofedAdminElonMusk',   // Fake spoofed username field
    text: 'Testing identity verification'
  });

  console.log('API Response Status:', spoofResponse.statusCode);
  console.log('Returned Author Username:', spoofResponse.data.username);
  const isIdentityVerified = spoofResponse.data.username === 'suhas_official';
  console.log('Identity Forgery Protection Verdict:', isIdentityVerified ? 'PASSED (Spoofed username overridden by DB user identity)' : 'FAILED');

  console.log('\n=== ALL SECURITY VERIFICATION TESTS COMPLETE ===');
}

runSecurityTests();
