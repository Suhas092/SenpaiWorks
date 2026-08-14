const http = require('http');

function sendPostRequest(path, postData, headers = {}) {
  return new Promise((resolve) => {
    const dataString = JSON.stringify(postData);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString),
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body });
      });
    });

    req.on('error', (err) => {
      resolve({ statusCode: 500, body: err.message });
    });

    req.write(dataString);
    req.end();
  });
}

async function runBurstTest() {
  console.log('--- STARTING BURST TEST (100 CONCURRENT REQUESTS) ---');
  const startTime = Date.now();
  
  // Fire 100 concurrent POST /api/anime/likes requests
  const promises = [];
  for (let i = 0; i < 100; i++) {
    const fakeCookie = `sw_visitor_id=bot_tester_${i % 10}`;
    promises.push(sendPostRequest('/api/anime/likes', { animeId: 'artwork_test_burst', action: 'like' }, { 'Cookie': fakeCookie }));
  }

  const results = await Promise.all(promises);
  const duration = Date.now() - startTime;

  let status200 = 0;
  let status429 = 0;
  let statusOther = 0;

  results.forEach(r => {
    if (r.statusCode === 200) status200++;
    else if (r.statusCode === 429) status429++;
    else statusOther++;
  });

  console.log(`Test completed in ${duration}ms`);
  console.log(`HTTP 200 Successes: ${status200}`);
  console.log(`HTTP 429 Rate-Limited: ${status429}`);
  console.log(`Other Statuses: ${statusOther}`);
  console.log('Sample 200 response:', results.find(r => r.statusCode === 200)?.body);
  console.log('Sample 429 response:', results.find(r => r.statusCode === 429)?.body);
}

runBurstTest();
