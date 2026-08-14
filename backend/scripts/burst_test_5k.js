const http = require('http');

const agent = new http.Agent({ keepAlive: true, maxSockets: 200 });

function sendRequest(path, method = 'GET', postData = null, headers = {}) {
  return new Promise((resolve) => {
    const dataString = postData ? JSON.stringify(postData) : null;
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      agent: agent,
      headers: {
        'Content-Type': 'application/json',
        ...(dataString && { 'Content-Length': Buffer.byteLength(dataString) }),
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

    if (dataString) req.write(dataString);
    req.end();
  });
}

async function runHighScaleTest() {
  console.log('=== STARTING 5,000 CONCURRENT POST + 500 CONCURRENT GET TEST ===');
  const startTime = Date.now();

  const totalPosts = 5000;
  const totalGets = 500;
  const animeIdCount = 50;

  const postPromises = [];
  for (let i = 0; i < totalPosts; i++) {
    const animeId = `artwork_scale_${i % animeIdCount}`;
    const cookie = `sw_visitor_id=scale_user_${i}`;
    const mockIp = `10.0.${Math.floor(i / 250)}.${i % 250}`;
    postPromises.push(sendRequest('/api/anime/likes', 'POST', { animeId, action: 'like' }, { 'Cookie': cookie, 'X-Forwarded-For': mockIp }));
  }

  const getPromises = [];
  for (let i = 0; i < totalGets; i++) {
    const animeId = `artwork_scale_${i % animeIdCount}`;
    const mockIp = `10.1.0.${i % 250}`;
    getPromises.push(sendRequest(`/api/anime/likes?animeId=${animeId}`, 'GET', null, { 'X-Forwarded-For': mockIp }));
  }

  // Execute all 5,500 requests concurrently
  const [postResults, getResults] = await Promise.all([
    Promise.all(postPromises),
    Promise.all(getPromises)
  ]);

  const duration = Date.now() - startTime;

  let post200 = 0, post429 = 0, postOther = 0;
  postResults.forEach(r => {
    if (r.statusCode === 200) post200++;
    else if (r.statusCode === 429) post429++;
    else postOther++;
  });

  let get200 = 0, get429 = 0, getOther = 0;
  getResults.forEach(r => {
    if (r.statusCode === 200) get200++;
    else if (r.statusCode === 429) get429++;
    else getOther++;
  });

  console.log(`\n--- HIGH-SCALE BURST RESULTS (Completed in ${duration}ms) ---`);
  console.log(`POST Writes -> HTTP 200 (Allowed): ${post200} | HTTP 429 (Rate-Limited): ${post429} | Failed: ${postOther}`);
  console.log(`GET Reads   -> HTTP 200 (Allowed): ${get200} | HTTP 429 (Rate-Limited): ${get429} | Failed: ${getOther}`);

  // Wait 5.5s for interval DB worker to flush to SQLite, then check DB status
  console.log('\nWaiting 5.5s for background in-memory buffer flush to SQLite DB...');
  await new Promise(r => setTimeout(r, 5500));

  console.log('=== TEST COMPLETE ===');
}

runHighScaleTest();
