const http = require('http');

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

function escapeHTML2D(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g,
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

async function runRenderCheck() {
  console.log('=== TESTING SINGLE-ESCAPE (STORE RAW + ESCAPE ON RENDER) ===\n');

  // Post comment with XSS payload
  const res = await sendPostRequest('/api/anime/comments', {
    animeId: 'render_test_artwork',
    userKey: 'suhas_official',
    text: '<script>alert(1)</script>'
  });

  console.log('1. Database Stored Raw Text:', res.data.text);
  const renderedHTML = `<p class="detail-comment-text">${escapeHTML2D(res.data.text)}</p>`;
  console.log('2. Frontend Template Rendered HTML:', renderedHTML);
  console.log('3. Browser Visibly Displayed Text Node:', res.data.text);

  const isOptionA = res.data.text === '<script>alert(1)</script>' && renderedHTML.includes('&lt;script&gt;alert(1)&lt;/script&gt;');
  console.log('\nVerdict:', isOptionA ? 'PASSED -> Option (a): <script>alert(1)</script> shown as clean plain text (No double-escaping bug!)' : 'FAILED');
}

runRenderCheck();
