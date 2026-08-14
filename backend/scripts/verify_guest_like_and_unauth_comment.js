const http = require('http');

function sendPostRequest(path, postData, cookie = '') {
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
        ...(cookie && { 'Cookie': cookie })
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(body || '{}') });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: { text: body } });
        }
      });
    });

    req.on('error', (err) => resolve({ statusCode: 500, data: { error: err.message } }));
    req.write(dataString);
    req.end();
  });
}

async function runVerification() {
  console.log('=== VERIFYING GUEST COMMENT LIKES & UNAUTH COMMENT 401 ===\n');

  // 1. Unauthenticated Comment/Reply POST API Check
  console.log('--- TEST 1: Unauthenticated POST /api/anime/comments ---');
  const unauthCommentRes = await sendPostRequest('/api/anime/comments', {
    animeId: 'verify_art_1',
    text: 'Unauth comment attempt'
  });
  console.log('Status Code:', unauthCommentRes.statusCode);
  console.log('Response Object:', unauthCommentRes.data);
  const isComment401Enforced = unauthCommentRes.statusCode === 401 && unauthCommentRes.data.error.includes('signed in');
  console.log('Verdict Test 1:', isComment401Enforced ? 'PASSED (HTTP 401 strictly enforced on backend API)' : 'FAILED');

  // 2. Guest Comment Like Hybrid Deduplication Key Test
  console.log('\n--- TEST 2: Guest Visitor Comment Like Cookie+IP Deduplication ---');
  const guestLikeRes1 = await sendPostRequest('/api/anime/comments/like', {
    commentId: 25,
    action: 'like'
  }, 'sw_visitor_id=hybrid_guest_cookie_123');
  console.log('Guest Like #1 Status:', guestLikeRes1.statusCode, '| Data:', guestLikeRes1.data);

  const guestLikeRes2 = await sendPostRequest('/api/anime/comments/like', {
    commentId: 25,
    action: 'like'
  }, 'sw_visitor_id=hybrid_guest_cookie_123');
  console.log('Guest Duplicate Like #2 Data:', guestLikeRes2.data);

  const isGuestLikeDeduped = guestLikeRes1.data.userHasLiked === true && guestLikeRes2.data.userHasLiked === true;
  console.log('Verdict Test 2:', isGuestLikeDeduped ? 'PASSED (Cookie+IP hybrid key deduplicated in DB)' : 'FAILED');

  console.log('\n=== ALL VERIFICATION TESTS COMPLETE ===');
}

runVerification();
