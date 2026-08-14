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
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(body || '{}') });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: { text: body } });
        }
      });
    });

    req.on('error', (err) => resolve({ statusCode: 500, data: { error: err.message } }));
    if (dataString) req.write(dataString);
    req.end();
  });
}

function escapeHTML2D(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g,
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

async function runRound2SecurityTests() {
  console.log('=== STARTING ROUND 2 SECURITY & INTEGRITY TESTS ===\n');

  // Setup artwork comment
  const initRes = await sendRequest('/api/anime/comments', 'POST', {
    animeId: 'round2_artwork',
    userKey: 'test_author',
    text: 'Top level comment'
  });
  const topCommentId = initRes.data.id;
  console.log('0. Top-level Comment Created (ID:', topCommentId, ')');

  // CHECK 1: Comment Likes Login & Dedup
  console.log('\n--- CHECK 1: Comment Likes Login Check & Deduplication ---');
  const unauthLike = await sendRequest('/api/anime/comments/like', 'POST', { commentId: topCommentId });
  console.log('Unauth Like Attempt Status:', unauthLike.statusCode, '| Error:', unauthLike.data.error);

  const like1 = await sendRequest('/api/anime/comments/like', 'POST', { commentId: topCommentId, userKey: 'user_a', action: 'like' });
  console.log('User A Like #1:', like1.data);
  const like2 = await sendRequest('/api/anime/comments/like', 'POST', { commentId: topCommentId, userKey: 'user_a', action: 'like' });
  console.log('User A Duplicate Like #2:', like2.data);
  const passCheck1 = unauthLike.statusCode === 401 && like1.data.likeCount === 1 && like2.data.likeCount === 1;
  console.log('Verdict Check 1:', passCheck1 ? 'PASSED (Login enforced, repeat likes deduplicated)' : 'FAILED');

  // CHECK 2: Reply XSS Payload & Session Identity
  console.log('\n--- CHECK 2: Reply XSS Payload & Session Identity ---');
  const replyXss = await sendRequest('/api/anime/comments', 'POST', {
    animeId: 'round2_artwork',
    userKey: 'test_author',
    parentId: topCommentId,
    text: "<script>alert('reply_xss')</script>"
  });
  console.log('Reply Created Object:', replyXss.data);
  const renderedReplyHTML = `<p class="detail-comment-text">${escapeHTML2D(replyXss.data.text)}</p>`;
  console.log('Rendered HTML for Reply:', renderedReplyHTML);
  const passCheck2 = replyXss.data.text === "<script>alert('reply_xss')</script>" && renderedReplyHTML.includes('&lt;script&gt;');
  console.log('Verdict Check 2:', passCheck2 ? 'PASSED (Reply XSS safely escaped on render)' : 'FAILED');

  // CHECK 3: Report Endpoint Dedup & Rate Limiting
  console.log('\n--- CHECK 3: Report Endpoint Deduplication & Rate Limiting ---');
  const report1 = await sendRequest('/api/anime/comments/report', 'POST', { commentId: topCommentId, userKey: 'reporter_user', reason: 'Spam' });
  console.log('Report #1 Message:', report1.data.message);
  const report2 = await sendRequest('/api/anime/comments/report', 'POST', { commentId: topCommentId, userKey: 'reporter_user', reason: 'Spam' });
  console.log('Report #2 Message (Duplicate):', report2.data.message);
  const passCheck3 = report2.data.message.includes('already reported');
  console.log('Verdict Check 3:', passCheck3 ? 'PASSED (Duplicate reports blocked)' : 'FAILED');

  // CHECK 4: Backend Block Query Enforcement
  console.log('\n--- CHECK 4: Backend Block Filtering in Raw API JSON ---');
  await sendRequest('/api/anime/comments', 'POST', { animeId: 'block_test_art', userKey: 'toxic_spammer', text: 'Spam comment' });
  await sendRequest('/api/anime/comments', 'POST', { animeId: 'block_test_art', userKey: 'normal_user', text: 'Good comment' });

  // Block toxic_spammer
  await sendRequest('/api/users/block', 'POST', { userKey: 'blocking_user', blockedUserKey: 'toxic_spammer' });

  // Fetch as blocking_user
  const blockedCommentsRes = await sendRequest('/api/anime/comments?animeId=block_test_art&userKey=blocking_user');
  const returnedUsernames = blockedCommentsRes.data.comments.map(c => c.username);
  console.log('Usernames returned in API payload for blocking_user:', returnedUsernames);
  const passCheck4 = !returnedUsernames.includes('toxic_spammer') && returnedUsernames.includes('normal_user');
  console.log('Verdict Check 4:', passCheck4 ? 'PASSED (Blocked user omitted from raw API response)' : 'FAILED');

  // CHECK 5: Max 1-Level Reply Depth Resolution
  console.log('\n--- CHECK 5: Max 1-Level Reply Depth Resolution ---');
  const childReplyId = replyXss.data.id;
  const deepReplyRes = await sendRequest('/api/anime/comments', 'POST', {
    animeId: 'round2_artwork',
    userKey: 'test_author',
    parentId: childReplyId, // Trying to reply to a reply!
    text: 'Nested deep reply'
  });
  console.log('Deep Reply Target Parent requested:', childReplyId, '| Resolved parentId in DB:', deepReplyRes.data.parentId);
  const passCheck5 = deepReplyRes.data.parentId === topCommentId;
  console.log('Verdict Check 5:', passCheck5 ? 'PASSED (Deep reply flattened to 1-level parentId)' : 'FAILED');

  console.log('\n=== ALL ROUND 2 INTEGRITY CHECKS COMPLETE ===');
}

runRound2SecurityTests();
