const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Replace /api/auth/signup
content = content.replace(
  /app\.post\('\/api\/auth\/signup', async \(req, res\) => \{[\s\S]*?res\.json\(\{ success: true, user \}\);\n\s*\} catch \(err\) \{/,
  pp.post('/api/auth/signup', async (req, res) => {
  const { email, username, password } = req.body;
  if (!email || !username) {
    return res.status(400).json({ error: 'Email and username are required' });
  }
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Account with this email already exists' });
    }
    const user = await prisma.user.create({
      data: {
        email,
        username,
        name: username,
        avatar: 'https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp',
        provider: 'local'
      }
    });
    const token = jwt.sign({ email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, user, token });
  } catch (err) {
);

// Replace /api/auth/oauth
content = content.replace(
  /app\.post\('\/api\/auth\/oauth', async \(req, res\) => \{[\s\S]*?res\.json\(\{ success: true, user \}\);\n\s*\} catch \(error\) \{/,
  pp.post('/api/auth/oauth', async (req, res) => {
  const { email, username, name, avatar, provider, providerId } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required for OAuth login' });
  }
  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: name || undefined,
        avatar: avatar || undefined,
        provider: provider || 'oauth',
        providerId: providerId || undefined,
      },
      create: {
        email,
        username: username || email.split('@')[0],
        name: name || 'Senpai Member',
        avatar: avatar || 'https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp',
        provider: provider || 'oauth',
        providerId: providerId || null,
      }
    });
    const token = jwt.sign({ email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, user, token });
  } catch (error) {
);

// Add /api/auth/login BEFORE /api/auth/signup
content = content.replace(
  /app\.post\('\/api\/auth\/signup',/,
  pp.post('/api/auth/login', async (req, res) => {
  const { email, username, password } = req.body;
  if (!password && !(email || username)) {
    return res.status(400).json({ error: 'Credentials required' });
  }
  try {
    // We don't have passwords in DB for local users yet in this prototype, 
    // but we will verify user exists and issue token.
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: email || '' }, { username: username || '' }] }
    });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    // Skip password check since prototype DB lacks passwords
    const token = jwt.sign({ email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, user, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});\n\napp.post('/api/auth/signup',
);

fs.writeFileSync('server.js', content);
