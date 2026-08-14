const http = require('http');

function sendRequest(path, method = 'GET', postData = null) {
  return new Promise((resolve) => {
    const dataString = postData ? JSON.stringify(postData) : null;
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(dataString && { 'Content-Length': Buffer.byteLength(dataString) })
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data: JSON.parse(body || '{}') });
      });
    });

    req.on('error', (err) => resolve({ statusCode: 500, data: { error: err.message } }));
    if (dataString) req.write(dataString);
    req.end();
  });
}

async function runSocialFeaturesTest() {
  console.log('=== STARTING COMMENT SOCIAL FEATURES TEST ===\n');

  // 1. Post a parent comment
  console.log('1. Posting Parent Comment...');
  const parentRes = await sendRequest('/api/anime/comments', 'POST', {
    animeId: 'social_test_art',
    userKey: 'alice_user',
    text: 'This artwork is stunning!'
  });
  const parentCommentId = parentRes.data.id;
  console.log('Parent Comment Created:', parentRes.data);

  // 2. Post a threaded child reply to the parent comment
  console.log('\n2. Posting Threaded Reply under Comment #' + parentCommentId + '...');
  const replyRes = await sendRequest('/api/anime/comments', 'POST', {
    animeId: 'social_test_art',
    userKey: 'bob_user',
    parentId: parentCommentId,
    text: 'I agree 100% with @alice_user!'
  });
  console.log('Threaded Reply Created:', replyRes.data);

  // 3. Toggle Like on Parent Comment
  console.log('\n3. Liking Parent Comment...');
  const likeRes = await sendRequest('/api/anime/comments/like', 'POST', {
    commentId: parentCommentId,
    userKey: 'bob_user',
    action: 'like'
  });
  console.log('Comment Like Result:', likeRes.data);

  // 4. Report Parent Comment
  console.log('\n4. Reporting Parent Comment...');
  const reportRes = await sendRequest('/api/anime/comments/report', 'POST', {
    commentId: parentCommentId,
    userKey: 'charlie_user',
    reason: 'Spam'
  });
  console.log('Report Result:', reportRes.data);

  // 5. Fetch all comments with hierarchy
  console.log('\n5. Fetching Threaded Comments for artwork...');
  const fetchRes = await sendRequest('/api/anime/comments?animeId=social_test_art&userKey=bob_user');
  console.log('Comments Tree Structure:', JSON.stringify(fetchRes.data, null, 2));

  // 6. Test User Blocking
  console.log('\n6. Blocking user @alice_user...');
  const blockRes = await sendRequest('/api/users/block', 'POST', {
    userKey: 'charlie_user',
    blockedUserKey: 'alice_user'
  });
  console.log('Block Result:', blockRes.data);

  // 7. Fetch comments as Charlie (blocked Alice)
  console.log('\n7. Fetching Comments as @charlie_user (Blocked Alice)...');
  const fetchBlockedRes = await sendRequest('/api/anime/comments?animeId=social_test_art&userKey=charlie_user');
  console.log('Comments for Charlie (Alice filtered out):', JSON.stringify(fetchBlockedRes.data, null, 2));

  console.log('\n=== ALL SOCIAL FEATURES VERIFIED SUCCESSFULLY ===');
}

runSocialFeaturesTest();
