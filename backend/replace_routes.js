const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

content = content.replace(
  /app\.get\('\/api\/notifications', async \(req, res\) => \{\s+const userEmail = getUserEmailFromReq\(req\);\s+if \(!userEmail\) return res\.status\(401\)\.json\(\{ error: 'Unauthorized' \}\);/,
  "app.get('/api/notifications', requireUserToken, async (req, res) => {\n  const userEmail = req.userEmail;"
);

content = content.replace(
  /app\.get\('\/api\/notifications\/unread-count', async \(req, res\) => \{\s+const userEmail = getUserEmailFromReq\(req\);\s+if \(!userEmail\) return res\.status\(401\)\.json\(\{ error: 'Unauthorized' \}\);/,
  "app.get('/api/notifications/unread-count', requireUserToken, async (req, res) => {\n  const userEmail = req.userEmail;"
);

content = content.replace(
  /app\.patch\('\/api\/notifications\/:id\/read', async \(req, res\) => \{\s+const userEmail = getUserEmailFromReq\(req\);\s+if \(!userEmail\) return res\.status\(401\)\.json\(\{ error: 'Unauthorized' \}\);/,
  "app.patch('/api/notifications/:id/read', requireUserToken, async (req, res) => {\n  const userEmail = req.userEmail;"
);

content = content.replace(
  /app\.patch\('\/api\/notifications\/read-all', async \(req, res\) => \{\s+const userEmail = getUserEmailFromReq\(req\);\s+if \(!userEmail\) return res\.status\(401\)\.json\(\{ error: 'Unauthorized' \}\);/,
  "app.patch('/api/notifications/read-all', requireUserToken, async (req, res) => {\n  const userEmail = req.userEmail;"
);

content = content.replace(
  /app\.delete\('\/api\/notifications\/:id', async \(req, res\) => \{\s+const userEmail = getUserEmailFromReq\(req\);\s+if \(!userEmail\) return res\.status\(401\)\.json\(\{ error: 'Unauthorized' \}\);/,
  "app.delete('/api/notifications/:id', requireUserToken, async (req, res) => {\n  const userEmail = req.userEmail;"
);

content = content.replace(
  /app\.delete\('\/api\/notifications\/bulk', async \(req, res\) => \{\s+const userEmail = getUserEmailFromReq\(req\);\s+const \{ ids \} = req\.body;\s+if \(!userEmail \|\| !ids \|\| !Array\.isArray\(ids\)\) return res\.status\(401\)\.json\(\{ error: 'Unauthorized or bad request' \}\);/,
  "app.delete('/api/notifications/bulk', requireUserToken, async (req, res) => {\n  const userEmail = req.userEmail;\n  const { ids } = req.body;\n  if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'Bad request' });"
);

fs.writeFileSync('server.js', content);
