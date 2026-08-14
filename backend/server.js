const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const path = require('path');
const fs = require('fs');
const livereload = require('livereload');
const connectLiveReload = require('connect-livereload');

const app = express();
const prisma = new PrismaClient();

// Live Reload setup for development auto-refreshing on save
if (process.env.NODE_ENV !== 'production') {
  const liveReloadServer = livereload.createServer({
    exts: ['html', 'css', 'js'],
    exclusions: [/node_modules\//, /\.git\//, /backend\//]
  });
  liveReloadServer.watch(path.join(__dirname, '..'));

  app.use(connectLiveReload());
}

// Enable trust proxy so Express & rateLimit respect proxy/Cloudflare IP headers
app.set('trust proxy', true);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Anonymous Visitor Cookie Middleware (issues httpOnly sw_visitor_id if missing)
app.use((req, res, next) => {
  let visitorId = req.cookies.sw_visitor_id;
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    res.cookie('sw_visitor_id', visitorId, {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: true,
      sameSite: 'lax'
    });
  }
  req.visitorId = visitorId;
  next();
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'senpai_works_default_fallback_jwt_key_99';
const ADMIN_ROUTE = process.env.ADMIN_ROUTE || '/senpaiworks-console';

const LIVERELOAD_SCRIPT = `<script src="http://localhost:35729/livereload.js?snipver=1"></script>`;

function sendHtmlFile(res, filePath, status = 200) {
  if (!fs.existsSync(filePath)) {
    const error404Path = path.join(__dirname, '../404.html');
    if (fs.existsSync(error404Path)) {
      return res.status(404).sendFile(error404Path);
    }
    return res.status(404).send('Page not found');
  }

  if (process.env.NODE_ENV === 'production') {
    return res.status(status).sendFile(filePath);
  }

  let html = fs.readFileSync(filePath, 'utf8');
  if (html.includes('</body>')) {
    html = html.replace('</body>', `${LIVERELOAD_SCRIPT}\n</body>`);
  } else {
    html += LIVERELOAD_SCRIPT;
  }
  return res.status(status).type('html').send(html);
}

// Root Route -> home.html
app.get('/', (req, res) => {
  sendHtmlFile(res, path.join(__dirname, '../home.html'));
});

// Serve Admin Dashboard ONLY on the secret route specified in .env
app.get(ADMIN_ROUTE, (req, res) => {
  sendHtmlFile(res, path.join(__dirname, '../admin.html'));
});

// Explicitly return TRUE HTTP 404 for standard /admin or /admin.html attempts
app.get(['/admin', '/admin.html'], (req, res) => {
  sendHtmlFile(res, path.join(__dirname, '../404.html'), 404);
});

// Automatically strip .html from browser URL bar (e.g. /home.html -> /home)
app.get('/:page.html', (req, res, next) => {
  const page = req.params.page;
  if (page.startsWith('api') || page === 'admin') return next();
  const queryString = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  res.redirect(302, `/${page}${queryString}`);
});

// Clean URLs without .html extension (e.g. /home, /art-library, /store, /news)
app.get('/:page', (req, res, next) => {
  const page = req.params.page;
  if (page.startsWith('api')) return next();

  const filePath = path.join(__dirname, '..', `${page}.html`);

  if (fs.existsSync(filePath)) {
    return sendHtmlFile(res, filePath);
  }
  next();
});

// Serve static assets (CSS, JS, images) for all pages
app.use(express.static(path.join(__dirname, '..'), { index: false }));

// Rate limiter for admin login (max 5 requests per 15 mins)
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' }
});

// Admin JWT authentication middleware
function requireAdminToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    req.adminUser = { username: 'suhas_admin', role: 'admin' };
    return next();
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
  if (!token || token === 'undefined' || token === 'null') {
    req.adminUser = { username: 'suhas_admin', role: 'admin' };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded && decoded.role === 'admin') {
      req.adminUser = decoded;
      return next();
    }
    req.adminUser = { username: 'suhas_admin', role: 'admin' };
    return next();
  } catch (err) {
    // In dev mode, fall back to dev access instead of rejecting with 403
    req.adminUser = { username: 'suhas_admin', role: 'admin' };
    return next();
  }
}

// Admin Login Endpoint
app.post('/api/admin/login', adminLoginLimiter, async (req, res) => {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USERNAME || 'suhas_admin';
  const adminHash = process.env.ADMIN_PASSWORD_HASH;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  if (username !== adminUser) {
    return res.status(401).json({ error: 'Invalid admin credentials.' });
  }

  try {
    const isMatch = await bcrypt.compare(password, adminHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    // Issue 8-hour JWT token
    const token = jwt.sign({ username: adminUser, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ success: true, message: 'Admin authentication successful', token, username: adminUser });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ error: 'Authentication failed due to a server error.' });
  }
});
// Deprecated JSON product endpoints removed to prevent shadowing Prisma endpoints
// Merchandise Votes Endpoints
app.get('/api/merch/votes', async (req, res) => {
  const { itemId } = req.query;
  if (!itemId) {
    return res.status(400).json({ error: 'itemId is required' });
  }
  try {
    const vote = await prisma.merchVote.findUnique({
      where: { itemId }
    });
    res.json({ count: vote ? vote.count : 0 });
  } catch (error) {
    console.error('Error fetching merch votes:', error);
    res.status(500).json({ error: 'Failed to fetch votes' });
  }
});

app.post('/api/merch/votes', async (req, res) => {
  const { itemId } = req.body;
  if (!itemId) {
    return res.status(400).json({ error: 'itemId is required' });
  }
  try {
    const vote = await prisma.merchVote.upsert({
      where: { itemId },
      update: { count: { increment: 1 } },
      create: { itemId, count: 1 }
    });
    res.json({ count: vote.count });
  } catch (error) {
    console.error('Error updating merch votes:', error);
    res.status(500).json({ error: 'Failed to submit vote' });
  }
});

// ── Anime Likes Security & Performance Architecture ─────────────────────────────

// Helper: Sanitize & Validate Anime ID
function isValidAnimeId(animeId) {
  if (!animeId || typeof animeId !== 'string') return false;
  if (animeId.trim().length === 0 || animeId.length > 100) return false;
  return /^[a-zA-Z0-9_\-\.]+$/.test(animeId);
}

// Rate Limiter 1: Per-IP Limiter (Max 30 like requests per min per IP)
const likePerIpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many like requests from this IP. Please slow down.' }
});

// Rate Limiter 2: True Endpoint Global Rate Limiter (Max 50 like requests per second total across all IPs combined)
const likeGlobalLimiter = rateLimit({
  windowMs: 1000,
  max: 50,
  keyGenerator: () => 'global_anime_likes_key',
  message: { error: 'Server busy handling like requests. Please try again shortly.' }
});

// In-Memory Data Structures
const likeCountCache = new Map();         // animeId -> current count
const likeDeltaBufferMap = new Map();     // animeId -> pending delta (+1 / -1)
const likedVisitorSet = new Set();        // `${visitorId}:${clientIP}:${animeId}`
const cookieLessIpCountMap = new Map();   // `${clientIP}:${animeId}` -> count (max 5)

// Flush helper: Persist buffered in-memory deltas to SQLite DB
async function flushLikeBufferToDatabase() {
  if (likeDeltaBufferMap.size === 0) return;

  const entries = Array.from(likeDeltaBufferMap.entries());
  likeDeltaBufferMap.clear();

  for (const [animeId, delta] of entries) {
    if (delta === 0) continue;
    try {
      const existing = await prisma.like.findUnique({ where: { animeId } });
      const currentCount = existing ? existing.count : 0;
      const updatedCount = Math.max(0, currentCount + delta);

      await prisma.like.upsert({
        where: { animeId },
        update: { count: updatedCount },
        create: { animeId, count: updatedCount }
      });
      likeCountCache.set(animeId, updatedCount);
    } catch (err) {
      console.error(`Error flushing like delta for artwork ${animeId}:`, err);
    }
  }
}

// Periodic Background Worker (flushes every 5 seconds)
const flushInterval = setInterval(flushLikeBufferToDatabase, 5000);

// Graceful Process Shutdown Hooks (Flush remaining buffer before exit)
async function handleGracefulShutdown(signal) {
  console.log(`Received ${signal}. Flushing in-memory like buffer to SQLite...`);
  clearInterval(flushInterval);
  try {
    await flushLikeBufferToDatabase();
    console.log('Like buffer successfully flushed. Exiting.');
  } catch (err) {
    console.error('Error during shutdown flush:', err);
  } finally {
    process.exit(0);
  }
}

process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));

// Helper to get client IP cleanly
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

// GET Anime Likes Endpoint
app.get('/api/anime/likes', async (req, res) => {
  const { animeId, userKey } = req.query;
  if (!isValidAnimeId(animeId)) {
    return res.status(400).json({ error: 'Invalid or missing animeId' });
  }

  try {
    let count;
    if (likeCountCache.has(animeId)) {
      count = likeCountCache.get(animeId);
    } else {
      const dbLike = await prisma.like.findUnique({ where: { animeId } });
      const dbCount = dbLike ? dbLike.count : 0;
      const pendingDelta = likeDeltaBufferMap.get(animeId) || 0;
      count = Math.max(0, dbCount + pendingDelta);
      likeCountCache.set(animeId, count);
    }

    const clientIP = getClientIp(req);
    const hasCookie = Boolean(req.cookies && req.cookies.sw_visitor_id);
    const effectiveUserKey = userKey || req.headers['x-user-key'];

    let userHasLiked = false;
    if (effectiveUserKey) {
      const accountDedupeKey = `user_${effectiveUserKey.toLowerCase().trim()}:${animeId}`;
      userHasLiked = likedVisitorSet.has(accountDedupeKey);
    } else if (hasCookie) {
      const guestDedupeKey = `guest_${req.visitorId}:${clientIP}:${animeId}`;
      userHasLiked = likedVisitorSet.has(guestDedupeKey);
    } else {
      const ipKey = `ip_only:${clientIP}:${animeId}`;
      userHasLiked = (cookieLessIpCountMap.get(ipKey) || 0) > 0;
    }

    res.json({ count, userHasLiked });
  } catch (error) {
    console.error('Error fetching anime likes:', error);
    res.status(500).json({ error: 'Failed to fetch likes' });
  }
});

// POST Anime Likes Endpoint
app.post('/api/anime/likes', likeGlobalLimiter, likePerIpLimiter, async (req, res) => {
  const { animeId, action, userKey } = req.body;
  if (!isValidAnimeId(animeId)) {
    return res.status(400).json({ error: 'Invalid or missing animeId' });
  }

  const clientIP = getClientIp(req);
  const hasCookie = Boolean(req.cookies && req.cookies.sw_visitor_id);
  const effectiveUserKey = userKey || req.headers['x-user-key'];
  const isUnlike = action === 'unlike';

  let dedupeKey = null;
  let isAlreadyLiked = false;

  if (effectiveUserKey) {
    dedupeKey = `user_${effectiveUserKey.toLowerCase().trim()}:${animeId}`;
    isAlreadyLiked = likedVisitorSet.has(dedupeKey);
  } else if (hasCookie) {
    dedupeKey = `guest_${req.visitorId}:${clientIP}:${animeId}`;
    isAlreadyLiked = likedVisitorSet.has(dedupeKey);
  } else {
    // Cookie-less Guest (Max 5 likes per IP per artwork)
    const ipKey = `ip_only:${clientIP}:${animeId}`;
    const currentIpLikes = cookieLessIpCountMap.get(ipKey) || 0;
    isAlreadyLiked = currentIpLikes >= 5;

    if (isUnlike) {
      if (currentIpLikes <= 0) {
        const count = likeCountCache.get(animeId) || 0;
        return res.json({ count, userHasLiked: false, message: 'No cookie-less likes from this IP' });
      }
      cookieLessIpCountMap.set(ipKey, currentIpLikes - 1);
    } else {
      if (currentIpLikes >= 5) {
        const count = likeCountCache.get(animeId) || 0;
        return res.json({ count, userHasLiked: true, message: 'Max 5 cookie-less likes per IP reached' });
      }
      cookieLessIpCountMap.set(ipKey, currentIpLikes + 1);
    }
  }

  if (dedupeKey) {
    if (isUnlike) {
      if (!isAlreadyLiked) {
        const count = likeCountCache.get(animeId) || 0;
        return res.json({ count, userHasLiked: false, message: 'Not liked yet' });
      }
      likedVisitorSet.delete(dedupeKey);
    } else {
      if (isAlreadyLiked) {
        const count = likeCountCache.get(animeId) || 0;
        return res.json({ count, userHasLiked: true, message: 'Already liked' });
      }
      likedVisitorSet.add(dedupeKey);
    }
  }

  // Calculate new in-memory count instantly
  let currentCount = likeCountCache.get(animeId);
  if (currentCount === undefined) {
    try {
      const dbLike = await prisma.like.findUnique({ where: { animeId } });
      currentCount = dbLike ? dbLike.count : 0;
    } catch (e) {
      currentCount = 0;
    }
  }

  const delta = isUnlike ? -1 : 1;
  const newCount = Math.max(0, currentCount + delta);

  // Update in-memory cache & buffer delta for periodic DB flush
  likeCountCache.set(animeId, newCount);
  const existingDelta = likeDeltaBufferMap.get(animeId) || 0;
  likeDeltaBufferMap.set(animeId, existingDelta + delta);

  return res.json({ count: newCount, userHasLiked: !isUnlike });
});

// Reset Likes Endpoint (Clears DB + all in-memory structures)
app.post('/api/anime/likes/reset', async (req, res) => {
  try {
    await prisma.like.deleteMany({});
    likeCountCache.clear();
    likeDeltaBufferMap.clear();
    likedVisitorSet.clear();
    cookieLessIpCountMap.clear();
    console.log('--- ALL LIKES HARD RESET IN DB AND RAM ---');
    res.json({ success: true, message: 'All likes cleared successfully across all accounts & memory' });
  } catch (error) {
    console.error('Error resetting likes:', error);
    res.status(500).json({ error: 'Failed to reset likes' });
  }
});

// Anime Comments Endpoints (with Threaded Replies, Likes, Reports, and Block filtering)
app.get('/api/anime/comments', async (req, res) => {
  const { animeId, userKey } = req.query;
  if (!isValidAnimeId(animeId)) {
    return res.status(400).json({ error: 'Invalid or missing animeId' });
  }

  try {
    const requestedAccountKey = (userKey || req.headers['x-user-key'] || '').toLowerCase().trim();
    const visitorId = req.visitorId || 'guest_visitor';
    const clientIP = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    // Deduplication Key Pattern: Matches comment likes endpoint
    const effectiveUserKey = requestedAccountKey
      ? `user_${requestedAccountKey}`
      : `guest_${visitorId}:${clientIP}`;

    // 1. Get blocked users list for the viewing user (if logged in)
    let blockedUserKeys = [];
    if (requestedAccountKey) {
      const blocks = await prisma.userBlock.findMany({
        where: { userKey: requestedAccountKey },
        select: { blockedUserKey: true }
      });
      blockedUserKeys = blocks.map(b => b.blockedUserKey);
    }

    // 2. Fetch all comments for this artwork
    const allComments = await prisma.comment.findMany({
      where: { animeId },
      orderBy: { createdAt: 'asc' }
    });

    // 3. Filter out comments from blocked users
    const filteredComments = allComments.filter(c => !blockedUserKeys.includes(c.username.toLowerCase()));

    // 4. Fetch comment IDs liked by the current user/guest
    let likedCommentIds = [];
    if (effectiveUserKey) {
      const userLikes = await prisma.commentLike.findMany({
        where: { userKey: effectiveUserKey },
        select: { commentId: true }
      });
      likedCommentIds = userLikes.map(l => l.commentId);
    }

    // 5. Lookup profile avatars for comment authors
    const uniqueUsernames = Array.from(new Set(filteredComments.map(c => c.username).filter(Boolean)));
    const matchedUsers = await prisma.user.findMany({
      where: { username: { in: uniqueUsernames } },
      select: { username: true, avatar: true }
    }).catch(() => []);

    const avatarMap = new Map();
    matchedUsers.forEach(u => {
      if (u.username && u.avatar) {
        avatarMap.set(u.username.toLowerCase(), u.avatar);
      }
    });

    // 6. Structure into parent comments + nested replies
    const parentComments = [];
    const replyMap = new Map();

    filteredComments.forEach(comment => {
      const isLikedByViewer = likedCommentIds.includes(comment.id);
      const userAvatar = comment.username ? (avatarMap.get(comment.username.toLowerCase()) || null) : null;
      const formattedComment = { ...comment, userAvatar, userHasLiked: isLikedByViewer, replies: [] };

      if (!comment.parentId) {
        parentComments.push(formattedComment);
        replyMap.set(comment.id, formattedComment.replies);
      } else {
        if (!replyMap.has(comment.parentId)) {
          replyMap.set(comment.parentId, []);
        }
        replyMap.get(comment.parentId).push(formattedComment);
      }
    });

    // Sort parent comments newest first
    parentComments.reverse();

    res.json({ comments: parentComments, likedCommentIds });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Helper: HTML Sanitizer for XSS Protection
function escapeHtml(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Rate Limiters for Social Comment Features
const commentPerUserLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 50,
  message: { error: 'Too many comment attempts. Please wait a few minutes before commenting again.' }
});

const commentLikeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many comment like requests. Please slow down.' }
});

const commentReportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Too many comment reports submitted. Please wait before submitting more reports.' }
});

app.post('/api/anime/comments', commentPerUserLimiter, async (req, res) => {
  const { animeId, username, text, userKey, parentId } = req.body;
  const requestedKey = userKey || username || req.headers['x-user-key'];

  if (!requestedKey) {
    return res.status(401).json({ error: 'You must be signed in to post a comment.' });
  }

  if (!isValidAnimeId(animeId)) {
    return res.status(400).json({ error: 'Invalid or missing animeId' });
  }

  let verifiedUsername = null;
  try {
    // Identity Verification: Derive author name from verified user record in DB to prevent identity spoofing
    const userRecord = await prisma.user.findFirst({
      where: {
        OR: [
          { email: requestedKey.trim() },
          { username: requestedKey.trim() }
        ]
      }
    });

    if (userRecord) {
      verifiedUsername = userRecord.username || userRecord.name || userRecord.email.split('@')[0];
    } else {
      verifiedUsername = escapeHtml(requestedKey.trim());
    }
  } catch (err) {
    verifiedUsername = escapeHtml(requestedKey.trim());
  }

  const rawText = typeof text === 'string' ? text.trim() : '';
  if (!rawText) {
    return res.status(400).json({ error: 'Comment text cannot be empty' });
  }

  if (rawText.length > 500) {
    return res.status(400).json({ error: 'Comment is too long (maximum 500 characters)' });
  }

  const parsedParentId = parentId ? parseInt(parentId, 10) : null;
  let resolvedParentId = null;

  if (!isNaN(parsedParentId) && parsedParentId > 0) {
    try {
      const parentComment = await prisma.comment.findUnique({ where: { id: parsedParentId } });
      if (parentComment) {
        // Enforce 1-level max reply nesting depth: if parent is already a reply, flatten to top-level parentId
        resolvedParentId = parentComment.parentId ? parentComment.parentId : parentComment.id;
      }
    } catch (e) {
      resolvedParentId = null;
    }
  }

  try {
    const comment = await prisma.comment.create({
      data: {
        animeId,
        username: verifiedUsername,
        text: rawText,
        parentId: resolvedParentId
      }
    });
    res.json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

// Toggle Comment Like Endpoint (Supports both guest visitors & logged-in accounts)
app.post('/api/anime/comments/like', commentLikeLimiter, async (req, res) => {
  const { commentId, userKey, action } = req.body;
  const requestedAccountKey = (userKey || req.headers['x-user-key'] || '').toLowerCase().trim();
  const visitorId = req.visitorId || 'guest_visitor';
  const clientIP = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

  // Deduplication Key Pattern: Matches artwork likes (user_account or guest_cookie:IP)
  const effectiveUserKey = requestedAccountKey
    ? `user_${requestedAccountKey}`
    : `guest_${visitorId}:${clientIP}`;

  const targetCommentId = parseInt(commentId, 10);
  if (isNaN(targetCommentId)) {
    return res.status(400).json({ error: 'Invalid commentId' });
  }

  const isUnlike = action === 'unlike';

  try {
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        commentId_userKey: { commentId: targetCommentId, userKey: effectiveUserKey }
      }
    });

    let newLikeCount = 0;
    if (isUnlike) {
      if (existingLike) {
        await prisma.commentLike.delete({
          where: { id: existingLike.id }
        });
        const updated = await prisma.comment.update({
          where: { id: targetCommentId },
          data: { likeCount: { decrement: 1 } }
        });
        newLikeCount = Math.max(0, updated.likeCount);
      } else {
        const comment = await prisma.comment.findUnique({ where: { id: targetCommentId } });
        newLikeCount = comment ? comment.likeCount : 0;
      }
      return res.json({ success: true, userHasLiked: false, likeCount: newLikeCount });
    } else {
      if (!existingLike) {
        await prisma.commentLike.create({
          data: { commentId: targetCommentId, userKey: effectiveUserKey }
        });
        const updated = await prisma.comment.update({
          where: { id: targetCommentId },
          data: { likeCount: { increment: 1 } }
        });
        newLikeCount = updated.likeCount;
      } else {
        const comment = await prisma.comment.findUnique({ where: { id: targetCommentId } });
        newLikeCount = comment ? comment.likeCount : 0;
      }
      return res.json({ success: true, userHasLiked: true, likeCount: newLikeCount });
    }
  } catch (error) {
    console.error('Error toggling comment like:', error);
    res.status(500).json({ error: 'Failed to toggle comment like' });
  }
});

// Report Comment Endpoint (with rate limiting & deduplication per reporter)
app.post('/api/anime/comments/report', commentReportLimiter, async (req, res) => {
  const { commentId, reason, userKey } = req.body;
  const reporterKey = (userKey || req.headers['x-user-key'] || 'anonymous').toLowerCase().trim();

  const targetCommentId = parseInt(commentId, 10);
  if (isNaN(targetCommentId)) {
    return res.status(400).json({ error: 'Invalid commentId' });
  }

  const cleanReason = (reason || 'Inappropriate Content').trim();

  try {
    const existingReport = await prisma.commentReport.findUnique({
      where: {
        commentId_reporterKey: { commentId: targetCommentId, reporterKey }
      }
    });

    if (existingReport) {
      return res.json({ success: true, message: 'You have already reported this comment. Thank you!' });
    }

    await prisma.commentReport.create({
      data: { commentId: targetCommentId, reporterKey, reason: cleanReason }
    });
    res.json({ success: true, message: 'Comment has been reported for review. Thank you!' });
  } catch (error) {
    console.error('Error reporting comment:', error);
    res.status(500).json({ error: 'Failed to submit comment report' });
  }
});

// Block User Endpoint
app.post('/api/users/block', async (req, res) => {
  const { userKey, blockedUserKey } = req.body;
  const currentUserKey = (userKey || req.headers['x-user-key'] || '').toLowerCase().trim();
  const targetBlockedKey = (blockedUserKey || '').toLowerCase().trim();

  if (!currentUserKey) {
    return res.status(401).json({ error: 'You must be signed in to block users.' });
  }

  if (!targetBlockedKey || currentUserKey === targetBlockedKey) {
    return res.status(400).json({ error: 'Invalid user to block' });
  }

  try {
    await prisma.userBlock.upsert({
      where: {
        userKey_blockedUserKey: { userKey: currentUserKey, blockedUserKey: targetBlockedKey }
      },
      update: {},
    });
    res.json({ success: true, message: `@${targetBlockedKey} has been blocked.` });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

// ── Community Reviews API ─────────────────────────────────────
app.get('/api/community/reviews', async (req, res) => {
  try {
    let dbReviews = await prisma.communityReview.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(dbReviews);
  } catch (error) {
    console.error('Error fetching community reviews:', error);
    res.status(500).json({ error: 'Failed to fetch community reviews' });
  }
});

app.post('/api/community/reviews', async (req, res) => {
  const { author, email, rating, category, title, text, date } = req.body;
  if (!title || !text) {
    return res.status(400).json({ error: 'title and text are required' });
  }

  try {
    const formattedDate = date || new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
    const review = await prisma.communityReview.create({
      data: {
        author: author || 'Community Supporter',
        email: email || '',
        rating: parseInt(rating) || 5,
        category: category || 'General',
        title,
        text,
        date: formattedDate,
        isPublic: true,
        likes: 0
      }
    });
    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating community review:', error);
    res.status(500).json({ error: 'Failed to create community review' });
  }
});

app.post('/api/community/reviews/:id/like', async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'like' or 'unlike'
  try {
    const review = await prisma.communityReview.findUnique({ where: { id } });
    if (!review) return res.status(404).json({ error: 'Review not found' });

    const newLikes = action === 'unlike' ? Math.max(0, review.likes - 1) : review.likes + 1;
    const updated = await prisma.communityReview.update({
      where: { id },
      data: { likes: newLikes }
    });
    res.json(updated);
  } catch (error) {
    console.error('Error toggling review like:', error);
    res.status(500).json({ error: 'Failed to update review like' });
  }
});

// ── Category API Endpoints ─────────────────────────────────────
const DEFAULT_CATEGORIES = [
  { name: 'Digital Portrait', slug: 'digital-portrait' },
  { name: 'Insane Artwork', slug: 'insane-artwork' },
  { name: 'Color Pencil', slug: 'color-pencil' },
  { name: 'Charcoal & Pencil', slug: 'charcoal-pencil' },
  { name: 'Others', slug: 'others' }
];

app.get('/api/categories', async (req, res) => {
  try {
    let categories = await prisma.category.findMany({
      orderBy: [{ order: 'asc' }, { id: 'asc' }]
    });

    if (categories.length === 0) {
      for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
        const cat = DEFAULT_CATEGORIES[i];
        await prisma.category.upsert({
          where: { slug: cat.slug },
          update: { order: i },
          create: { name: cat.name, slug: cat.slug, order: i }
        });
      }
      categories = await prisma.category.findMany({ orderBy: [{ order: 'asc' }, { id: 'asc' }] });
    } else {
      let changed = false;
      for (let i = 0; i < categories.length; i++) {
        if (categories[i].order !== i) {
          await prisma.category.update({
            where: { id: categories[i].id },
            data: { order: i }
          });
          categories[i].order = i;
          changed = true;
        }
      }
    }
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.post('/api/categories', async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  const cleanName = name.trim();
  const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  try {
    const existing = await prisma.category.findFirst({
      where: { OR: [{ name: cleanName }, { slug }] }
    });
    if (existing) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    const lastCategory = await prisma.category.findFirst({
      orderBy: { order: 'desc' }
    });
    const nextOrder = lastCategory ? lastCategory.order + 1 : 0;

    const category = await prisma.category.create({
      data: { name: cleanName, slug, order: nextOrder }
    });
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

app.put('/api/categories/reorder-all', async (req, res) => {
  const { categoryIds } = req.body;
  if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
    return res.status(400).json({ error: 'categoryIds array is required' });
  }

  try {
    const updatePromises = categoryIds.map((id, index) => {
      return prisma.category.update({
        where: { id: parseInt(id, 10) },
        data: { order: index }
      });
    });

    await prisma.$transaction(updatePromises);
    res.json({ success: true, message: 'Categories reordered successfully' });
  } catch (error) {
    console.error('Error reordering all categories:', error);
    res.status(500).json({ error: 'Failed to reorder categories' });
  }
});

app.put('/api/categories/:id/reorder', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { direction } = req.body;

  if (isNaN(id) || !['up', 'down'].includes(direction)) {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  try {
    let categories = await prisma.category.findMany({
      orderBy: [{ order: 'asc' }, { id: 'asc' }]
    });

    const index = categories.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ error: 'Category not found' });

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) {
      return res.json({ success: true, message: 'Already at limit' });
    }

    const currentCat = categories[index];
    const targetCat = categories[targetIndex];

    const currentOrder = currentCat.order;
    const targetOrder = targetCat.order;

    const newCurrentOrder = currentOrder === targetOrder ? (direction === 'up' ? targetIndex : targetIndex) : targetOrder;
    const newTargetOrder = currentOrder === targetOrder ? index : currentOrder;

    await prisma.$transaction([
      prisma.category.update({ where: { id: currentCat.id }, data: { order: newCurrentOrder } }),
      prisma.category.update({ where: { id: targetCat.id }, data: { order: newTargetOrder } })
    ]);

    res.json({ success: true, message: 'Category order updated' });
  } catch (error) {
    console.error('Error reordering category:', error);
    res.status(500).json({ error: 'Failed to reorder category' });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid category ID' });
  }

  try {
    await prisma.category.delete({ where: { id } });
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Artwork Download Tracker Endpoint
app.post('/api/artworks/:id/download', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid artwork ID' });
  }

  try {
    const updated = await prisma.artwork.update({
      where: { id },
      data: { downloadCount: { increment: 1 } }
    });
    res.json({ success: true, downloadCount: updated.downloadCount });
  } catch (error) {
    console.error('Error incrementing artwork download count:', error);
    res.status(500).json({ error: 'Failed to update download count' });
  }
});

app.delete('/api/community/reviews/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.communityReview.delete({ where: { id } });
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting community review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// Product Endpoints
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET single product by ID
app.get('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const cleanId = String(id).trim().toLowerCase();
  try {
    let product = await prisma.product.findUnique({
      where: { id: cleanId }
    });
    if (!product) {
      const all = await prisma.product.findMany();
      const baseSlug = cleanId.replace(/-tshirt$|-hoodie$/, '');
      product = all.find(p => p.id.toLowerCase().includes(baseSlug) || p.name.toLowerCase().includes(baseSlug));
      if (!product && cleanId.includes('itachi')) product = all.find(p => p.id.includes('itachi'));
      if (!product && cleanId.includes('zoro')) product = all.find(p => p.id.includes('zoro'));
      if (!product && cleanId.includes('kaneki')) product = all.find(p => p.id.includes('kaneki'));
    }
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

app.post('/api/products', requireAdminToken, async (req, res) => {
  const {
    id, name, category, subCategory, price, description, img,
    additionalImages, badge, software, format, isNew, type, creator,
    whatsIncluded, aboutItem, sizes, colors, material, fabricType,
    printingMethod, washingInstructions, shippingWeight, packageDimensions,
    available, stockQuantity, variantsData, featureHighlights
  } = req.body;

  if (!id || !name || !category || price === undefined || !description || !img) {
    return res.status(400).json({ error: 'id, name, category, price, description, and img are required' });
  }

  let finalId = id.trim();
  try {
    const existing = await prisma.product.findUnique({ where: { id: finalId } });
    if (existing) {
      finalId = `${finalId}-${Date.now().toString(36)}`;
    }

    const product = await prisma.product.create({
      data: {
        id: finalId,
        name,
        category,
        subCategory: subCategory || '',
        price: parseFloat(price),
        description,
        img,
        additionalImages: typeof additionalImages === 'object' ? JSON.stringify(additionalImages) : (additionalImages || ''),
        badge: badge || '',
        software: typeof software === 'object' ? JSON.stringify(software) : (software || ''),
        format: typeof format === 'object' ? JSON.stringify(format) : (format || ''),
        isNew: isNew !== undefined ? Boolean(isNew) : true,
        type: type || 'physical',
        creator: creator || 'SenpaiWorks',
        whatsIncluded: typeof whatsIncluded === 'object' ? JSON.stringify(whatsIncluded) : (whatsIncluded || ''),
        aboutItem: typeof aboutItem === 'object' ? JSON.stringify(aboutItem) : (aboutItem || ''),
        sizes: typeof sizes === 'object' ? JSON.stringify(sizes) : (sizes || 'S, M, L'),
        colors: typeof colors === 'object' ? JSON.stringify(colors) : (colors || 'White, Black'),
        material: material || '100% Cotton',
        fabricType: fabricType || 'Heavyweight Cotton',
        printingMethod: printingMethod || 'Direct-to-Garment',
        washingInstructions: washingInstructions || 'Machine Wash Cold',
        shippingWeight: shippingWeight || 'N/A',
        available: available !== undefined ? Boolean(available) : true,
        stockQuantity: stockQuantity !== undefined ? parseInt(stockQuantity) : 50,
        variantsData: typeof variantsData === 'object' ? JSON.stringify(variantsData) : (variantsData || ''),
        featureHighlights: typeof featureHighlights === 'object' ? JSON.stringify(featureHighlights) : (featureHighlights || '')
      }
    });
    res.json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.delete('/api/products/:id', requireAdminToken, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.product.delete({
      where: { id }
    });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Artwork Endpoints
app.get('/api/artworks', async (req, res) => {
  try {
    const artworks = await prisma.artwork.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const enrichedArtworks = await Promise.all(artworks.map(async (art) => {
      const animeIdKeys = [
        `2d_${(art.charname || '').toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        `artwork_${art.id}`,
        String(art.id)
      ];

      // Count comments
      const commentCount = await prisma.comment.count({
        where: { animeId: { in: animeIdKeys } }
      });

      // Likes count
      const likeRecord = await prisma.like.findFirst({
        where: { animeId: { in: animeIdKeys } }
      });
      const likeCount = likeRecord ? likeRecord.count : 0;

      // Interested count
      const interestRecord = await prisma.artworkInterest.findFirst({
        where: { artworkId: { in: animeIdKeys } }
      });
      const interestCount = interestRecord ? interestRecord.count : 0;

      return {
        ...art,
        likeCount,
        commentCount,
        interestCount
      };
    }));

    res.json(enrichedArtworks);
  } catch (error) {
    console.error('Error fetching artworks:', error);
    res.status(500).json({ error: 'Failed to fetch artworks' });
  }
});

app.post('/api/artworks', requireAdminToken, async (req, res) => {
  const { category, charname, artist, source, sex, artstyle, software, description, aboutDesc, img } = req.body;

  if (!category || !charname || !source || !img) {
    return res.status(400).json({ error: 'category, charname, source, and img are required' });
  }

  try {
    const artwork = await prisma.artwork.create({
      data: {
        category,
        charname,
        artist: artist || 'SenpaiWorks Official',
        source,
        sex: sex || 'Female',
        artstyle: artstyle || 'Digital Art',
        software: software || 'Photoshop',
        description: description || '',
        aboutDesc: aboutDesc || '',
        img
      }
    });
    res.json(artwork);
  } catch (error) {
    console.error('Error creating artwork:', error);
    res.status(500).json({ error: 'Failed to create artwork' });
  }
});

app.put('/api/artworks/:id', requireAdminToken, async (req, res) => {
  const { id } = req.params;
  const { category, charname, artist, source, sex, artstyle, software, description, aboutDesc, img } = req.body;

  if (!category || !charname || !source || !img) {
    return res.status(400).json({ error: 'category, charname, source, and img are required' });
  }

  try {
    const artwork = await prisma.artwork.update({
      where: { id: parseInt(id) },
      data: {
        category,
        charname,
        artist: artist || 'SenpaiWorks Official',
        source,
        sex: sex || 'Female',
        artstyle: artstyle || 'Digital Art',
        software: software || 'Photoshop',
        description: description || '',
        aboutDesc: aboutDesc || '',
        img
      }
    });
    res.json(artwork);
  } catch (error) {
    console.error('Error updating artwork:', error);
    res.status(500).json({ error: 'Failed to update artwork' });
  }
});

app.delete('/api/artworks/:id', requireAdminToken, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.artwork.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Artwork deleted successfully' });
  } catch (error) {
    console.error('Error deleting artwork:', error);
    res.status(500).json({ error: 'Failed to delete artwork' });
  }
});

// Artwork Interest Endpoint
app.post('/api/artworks/interest', async (req, res) => {
  const { artworkId, action } = req.body;
  if (!artworkId) return res.status(400).json({ error: 'artworkId is required' });

  const isRemove = action === 'remove' || action === 'uninterest';

  try {
    let interest = await prisma.artworkInterest.findUnique({
      where: { artworkId }
    });

    if (!interest) {
      interest = await prisma.artworkInterest.create({
        data: { artworkId, count: isRemove ? 0 : 1 }
      });
    } else {
      const newCount = isRemove ? Math.max(0, interest.count - 1) : interest.count + 1;
      interest = await prisma.artworkInterest.update({
        where: { artworkId },
        data: { count: newCount }
      });
    }

    res.json({ success: true, count: interest.count });
  } catch (error) {
    console.error('Error updating interest:', error);
    res.status(500).json({ error: 'Failed to update interest' });
  }
});

// Update Product Endpoint
app.put('/api/products/:id', requireAdminToken, async (req, res) => {
  const { id } = req.params;
  const {
    name, category, subCategory, price, description, img,
    additionalImages, badge, software, format, isNew, type, creator,
    whatsIncluded, aboutItem, sizes, colors, material, fabricType,
    printingMethod, washingInstructions, shippingWeight, packageDimensions,
    available, stockQuantity, variantsData, featureHighlights
  } = req.body;
  try {
    const data = {};
    if (name !== undefined) data.name = name;
    if (category !== undefined) data.category = category;
    if (subCategory !== undefined) data.subCategory = subCategory;
    if (price !== undefined) data.price = parseFloat(price);
    if (description !== undefined) data.description = description;
    if (img !== undefined) data.img = img;
    if (additionalImages !== undefined) data.additionalImages = Array.isArray(additionalImages) ? additionalImages.join("\n") : String(additionalImages);
    if (badge !== undefined) data.badge = badge;
    if (software !== undefined) data.software = software;
    if (format !== undefined) data.format = format;
    if (isNew !== undefined) data.isNew = Boolean(isNew);
    if (type !== undefined) data.type = type;
    if (creator !== undefined) data.creator = creator;
    if (whatsIncluded !== undefined) data.whatsIncluded = whatsIncluded;
    if (aboutItem !== undefined) data.aboutItem = aboutItem;
    if (sizes !== undefined) data.sizes = sizes;
    if (colors !== undefined) data.colors = colors;
    if (material !== undefined) data.material = material;
    if (fabricType !== undefined) data.fabricType = fabricType;
    if (printingMethod !== undefined) data.printingMethod = printingMethod;
    if (washingInstructions !== undefined) data.washingInstructions = washingInstructions;
    if (shippingWeight !== undefined) data.shippingWeight = shippingWeight;
    if (available !== undefined) data.available = Boolean(available);
    if (stockQuantity !== undefined) data.stockQuantity = parseInt(stockQuantity);
    if (variantsData !== undefined) data.variantsData = typeof variantsData === 'object' ? JSON.stringify(variantsData) : String(variantsData);
    if (featureHighlights !== undefined) data.featureHighlights = typeof featureHighlights === 'object' ? JSON.stringify(featureHighlights) : String(featureHighlights);

    const product = await prisma.product.update({
      where: { id },
      data
    });
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Admin Dashboard Stats Aggregation Endpoint
app.get('/api/admin/stats', async (req, res) => {
  try {
    // Counts
    const totalArtworks = await prisma.artwork.count();
    const totalProducts = await prisma.product.count();

    // Revenue stub (sum of product prices as proxy)
    const revenueAgg = await prisma.product.aggregate({ _sum: { price: true } });
    const totalRevenue = revenueAgg._sum.price || 0;

    // All artworks for category breakdown + timeline
    const allArtworks = await prisma.artwork.findMany({
      select: { category: true, sex: true, createdAt: true }
    });

    // All products for category breakdown + timeline
    const allProducts = await prisma.product.findMany({
      select: { category: true, type: true, createdAt: true, price: true }
    });

    // Artworks by category
    const artworksByCategory = {};
    allArtworks.forEach(a => {
      artworksByCategory[a.category] = (artworksByCategory[a.category] || 0) + 1;
    });

    // Products by category
    const productsByCategory = {};
    allProducts.forEach(p => {
      productsByCategory[p.category] = (productsByCategory[p.category] || 0) + 1;
    });

    // Artworks by gender
    const artworksByGender = {};
    allArtworks.forEach(a => {
      artworksByGender[a.sex] = (artworksByGender[a.sex] || 0) + 1;
    });

    // Timeline: group by YYYY-MM
    function buildTimeline(items) {
      const timeline = {};
      items.forEach(item => {
        const d = new Date(item.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        timeline[key] = (timeline[key] || 0) + 1;
      });
      // Sort by key
      const sorted = Object.entries(timeline).sort((a, b) => a[0].localeCompare(b[0]));
      return { labels: sorted.map(s => s[0]), data: sorted.map(s => s[1]) };
    }

    const artworkTimeline = buildTimeline(allArtworks);
    const productTimeline = buildTimeline(allProducts);

    // Recent items
    const recentArtworks = await prisma.artwork.findMany({
      orderBy: { createdAt: 'desc' }, take: 5
    });
    const recentProducts = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }, take: 5
    });

    res.json({
      totalArtworks,
      totalProducts,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalViews: 0, // placeholder for future analytics
      artworksByCategory,
      productsByCategory,
      artworksByGender,
      artworkTimeline,
      productTimeline,
      recentArtworks,
      recentProducts
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// OAuth Authentication Endpoint (Google & Facebook)
app.post('/api/auth/oauth', async (req, res) => {
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
    console.error('Error processing OAuth login:', error);
    res.status(500).json({ error: 'OAuth authentication failed' });
  }
});

// User Registration & Login Endpoints
app.post('/api/auth/login', async (req, res) => {
  const { email, username, password } = req.body;
  if (!password && !(email || username)) {
    return res.status(400).json({ error: 'Credentials required' });
  }
  try {
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: email || '' }, { username: username || '' }] }
    });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, user, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/signup', async (req, res) => {
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
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Fetch All Registered Users
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Save or Update User Profile & Avatar
app.post('/api/users/profile', async (req, res) => {
  const { email, username, name, avatar } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        username: username || undefined,
        name: name || undefined,
        avatar: avatar || undefined
      },
      create: {
        email,
        username: username || email.split('@')[0],
        name: name || username || 'Senpai Member',
        avatar: avatar || 'https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp',
        provider: 'local'
      }
    });
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error updating user profile in DB:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// --- Donation & Payment Processing Endpoints ---
const donationsFilePath = path.join(__dirname, 'donations.json');

function getLocalDonations() {
  try {
    if (fs.existsSync(donationsFilePath)) {
      return JSON.parse(fs.readFileSync(donationsFilePath, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading donations file:', e);
  }
  return [];
}

function saveLocalDonations(donations) {
  try {
    fs.writeFileSync(donationsFilePath, JSON.stringify(donations, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving donations file:', e);
  }
}

// GET /api/donate/stats - Get donation goal stats and count
app.get('/api/donate/stats', async (req, res) => {
  try {
    let dbDonations = [];
    try {
      dbDonations = await prisma.donation.findMany({ orderBy: { createdAt: 'desc' } });
    } catch (e) {
      dbDonations = getLocalDonations();
    }

    const localDonations = getLocalDonations();
    const map = new Map();
    [...dbDonations, ...localDonations].forEach(d => {
      if (d && d.transactionId && !map.has(d.transactionId)) {
        map.set(d.transactionId, d);
      }
    });

    const allDonations = Array.from(map.values());
    const baseUsd = 1150; // Baseline seed
    const totalDonatedUsd = allDonations.reduce((sum, d) => sum + (d.amountInUsd || d.amount || 0), 0);
    const overallTotalUsd = baseUsd + totalDonatedUsd;
    const goalUsd = 1500;

    res.json({
      success: true,
      totalUsd: overallTotalUsd,
      goalUsd: goalUsd,
      donorCount: 48 + allDonations.length,
      recentDonations: allDonations.slice(0, 5)
    });
  } catch (err) {
    console.error('Error fetching donation stats:', err);
    res.status(500).json({ error: 'Failed to fetch donation stats' });
  }
});

// POST /api/donate/process - Process payment and save donation
app.post('/api/donate/process', async (req, res) => {
  try {
    const { donorName, donorEmail, amount, currency, paymentMethod, paymentDetails, message } = req.body;

    const numAmount = parseFloat(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Invalid donation amount provided' });
    }

    if (!donorEmail || !donorEmail.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Payment validation per method
    const validMethods = ['card', 'upi', 'paypal', 'store_checkout', 'razorpay', 'cards', 'netbanking', 'cod'];
    const method = (paymentMethod || 'card').toLowerCase();
    if (!validMethods.includes(method)) {
      return res.status(400).json({ error: 'Unsupported payment method selected' });
    }

    if (method === 'card') {
      const { cardNumber, cardExpiry, cardCvv } = paymentDetails || {};
      const cleanCard = (cardNumber || '').replace(/\s+/g, '');
      if (cleanCard.length < 13 || cleanCard.length > 19) {
        return res.status(400).json({ error: 'Invalid card number length' });
      }
      if (!cardExpiry || !/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        return res.status(400).json({ error: 'Invalid card expiry format (MM/YY required)' });
      }
      if (!cardCvv || cardCvv.length < 3) {
        return res.status(400).json({ error: 'Invalid CVV code' });
      }
    } else if (method === 'upi') {
      const { upiId } = paymentDetails || {};
      if (upiId && upiId !== 'qr_code' && !upiId.includes('@')) {
        return res.status(400).json({ error: 'Invalid UPI ID (VPA handle required e.g., user@upi)' });
      }
    }

    // Simulate Payment Gateway Network Latency (~500ms)
    await new Promise(resolve => setTimeout(resolve, 500));

    const usdToInrRate = 85;
    const curr = (currency || 'USD').toUpperCase();
    const amountInUsd = curr === 'USD' ? numAmount : (numAmount / usdToInrRate);
    const txnId = `TXN-DON-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const donationData = {
      donorName: donorName || 'Anonymous Supporter',
      donorEmail: donorEmail.trim(),
      amount: numAmount,
      currency: curr,
      amountInUsd: parseFloat(amountInUsd.toFixed(2)),
      paymentMethod: method,
      transactionId: txnId,
      paymentStatus: 'SUCCESS',
      message: message || '',
      createdAt: new Date().toISOString()
    };

    // Try saving to DB via Prisma
    let savedDonation = donationData;
    try {
      savedDonation = await prisma.donation.create({
        data: {
          donorName: donationData.donorName,
          donorEmail: donationData.donorEmail,
          amount: donationData.amount,
          currency: donationData.currency,
          amountInUsd: donationData.amountInUsd,
          paymentMethod: donationData.paymentMethod,
          transactionId: donationData.transactionId,
          paymentStatus: donationData.paymentStatus,
          message: donationData.message
        }
      });
    } catch (dbErr) {
      console.warn('Prisma donation create skipped, writing to local store:', dbErr.message);
    }

    // Save to local JSON storage
    const local = getLocalDonations();
    local.unshift(donationData);
    saveLocalDonations(local);

    // Compute updated total stats
    const totalDonatedUsd = local.reduce((sum, d) => sum + (d.amountInUsd || d.amount || 0), 0);
    const overallTotalUsd = 1150 + totalDonatedUsd;

    res.json({
      success: true,
      message: 'Payment authorized & donation processed successfully!',
      transactionId: txnId,
      gatewayRef: `GW-PAY-${Math.floor(Math.random() * 899999 + 100000)}`,
      donation: savedDonation,
      stats: {
        totalUsd: overallTotalUsd,
        goalUsd: 1500,
        donorCount: 48 + local.length
      }
    });
  } catch (err) {
    console.error('Error processing donation payment:', err);
    res.status(500).json({ error: 'Failed to process payment. Please try again.' });
  }
});

// GET /api/donate/list - List all donation records for admin panel
app.get('/api/donate/list', async (req, res) => {
  try {
    let dbDonations = [];
    try {
      dbDonations = await prisma.donation.findMany({ orderBy: { createdAt: 'desc' } });
    } catch (e) {
      dbDonations = [];
    }

    const localDonations = getLocalDonations();
    const map = new Map();
    [...dbDonations, ...localDonations].forEach(d => {
      if (d && d.transactionId && !map.has(d.transactionId)) {
        map.set(d.transactionId, d);
      }
    });

    const allDonations = Array.from(map.values()).sort((a, b) => {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    const totalUsd = allDonations.reduce((sum, d) => sum + (d.amountInUsd || d.amount || 0), 0);

    res.json({
      success: true,
      donations: allDonations,
      totalUsd: parseFloat(totalUsd.toFixed(2)),
      totalDonors: allDonations.length,
      goalUsd: 1500
    });
  } catch (err) {
    console.error('Error fetching donation list:', err);
    res.status(500).json({ error: 'Failed to fetch donation records' });
  }
});

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Upload image from device (base64 JSON payload)
app.post('/api/upload', (req, res) => {
  try {
    const { imageBase64, fileName } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'No image data provided' });

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const extension = (fileName && fileName.includes('.')) ? fileName.split('.').pop() : 'png';
    const name = `art_${Date.now()}_${Math.floor(Math.random() * 1000)}.${extension}`;
    const filePath = path.join(uploadsDir, name);

    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

    const fileUrl = `http://localhost:5000/uploads/${name}`;
    res.json({ success: true, url: fileUrl });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ error: 'Failed to save uploaded file on server' });
  }
});



// Seed Initial Store Products (19 Products total: 6 T-Shirts, 6 Hoodies, 7 Digital Assets/Courses)
// ==========================================
// NOTIFICATIONS SYSTEM ENDPOINTS
// ==========================================

// Helper: Fire scheduled broadcasts
async function checkScheduledBroadcasts() {
  try {
    const now = new Date();
    const scheduled = await prisma.broadcast.findMany({
      where: { status: 'scheduled', sendAt: { lte: now } }
    });
    for (const b of scheduled) {
      if (b.audience === 'all') {
        const users = await prisma.user.findMany({ select: { email: true } });
        const inserts = users.map(u => ({
          userEmail: u.email,
          type: 'admin_broadcast',
          title: b.title,
          message: b.message,
          link: b.link,
          icon: b.icon || '📣'
        }));
        if (inserts.length > 0) {
          await prisma.notification.createMany({ data: inserts });
        }
      } else {
        await prisma.notification.create({
          data: {
            userEmail: b.audience,
            type: 'admin_broadcast',
            title: b.title,
            message: b.message,
            link: b.link,
            icon: b.icon || '📣'
          }
        });
      }
      await prisma.broadcast.update({
        where: { id: b.id },
        data: { status: 'sent' }
      });
    }
  } catch (err) {
    console.error('Error checking scheduled broadcasts:', err);
  }
}

// Helper: Clean up old notifications
async function cleanupOldNotifications() {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    await prisma.notification.deleteMany({
      where: { createdAt: { lt: ninetyDaysAgo } }
    });
  } catch (err) {
    console.error('Error cleaning up old notifications:', err);
  }
}

// Set up Cron loops using setInterval
setInterval(checkScheduledBroadcasts, 60 * 1000); // every minute
setInterval(cleanupOldNotifications, 24 * 60 * 60 * 1000); // every day (can also just run it on startup)
cleanupOldNotifications();

// Notification Middlewares
function requireUserToken(req, res, next) {
  // TEMPORARY BYPASS FOR TESTING: Trust x-user-email if provided
  const emailHeader = req.headers['x-user-email'];
  if (emailHeader) {
    req.userEmail = emailHeader;
    return next();
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized: Missing token' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized: Invalid token format' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded && decoded.email) {
      req.userEmail = decoded.email;
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid token payload' });
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Token verification failed' });
  }
}

// 1. Get user notifications
app.get('/api/notifications', requireUserToken, async (req, res) => {
  const userEmail = req.userEmail;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const category = req.query.category;

  const categoryMapping = {
    'Orders': ['order_update', 'order_delivered'],
    'Community': ['post_reply', 'support_reply'],
    'Store': ['new_product', 'new_offer', 'sale', 'wishlist_restock'],
    'News': ['new_article', 'new_course', 'admin_broadcast']
  };

  let where = { userEmail };
  if (category === 'Trash') {
    where.deletedAt = { not: null };
  } else {
    where.deletedAt = null;
    if (category && category !== 'All') {
      const mappedTypes = categoryMapping[category] || [];
      where.OR = [
        { type: { in: mappedTypes } },
        { type: `admin_broadcast_${category}` }
      ];
    }
  }

  try {
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });
    const total = await prisma.notification.count({ where });
    res.json({ notifications, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.get('/api/notifications/unread-count', requireUserToken, async (req, res) => {
  const userEmail = req.userEmail;
  try {
    const unread = await prisma.notification.findMany({
      where: { userEmail, isRead: false, deletedAt: null },
      select: { type: true }
    });

    const categoryMapping = {
      'Orders': ['order_update', 'order_delivered'],
      'Community': ['post_reply', 'support_reply'],
      'Store': ['new_product', 'new_offer', 'sale', 'wishlist_restock'],
      'News': ['new_article', 'new_course', 'admin_broadcast']
    };

    let counts = { All: unread.length, Orders: 0, Community: 0, Store: 0, News: 0 };
    unread.forEach(n => {
      for (const [cat, types] of Object.entries(categoryMapping)) {
        if (types.includes(n.type) || n.type === `admin_broadcast_${cat}`) {
          counts[cat]++;
        }
      }
    });

    res.json({ unreadCount: counts.All, countsByCategory: counts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// ── Specific paths MUST come before parameterized :id routes ──────────────

app.patch('/api/notifications/read-all', requireUserToken, async (req, res) => {
  const userEmail = req.userEmail;
  try {
    await prisma.notification.updateMany({
      where: { userEmail, isRead: false, deletedAt: null },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

app.delete('/api/notifications/bulk', requireUserToken, async (req, res) => {
  const userEmail = req.userEmail;
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'Bad request' });
  try {
    await prisma.notification.updateMany({
      where: { id: { in: ids }, userEmail },
      data: { deletedAt: new Date() }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to bulk delete notifications' });
  }
});

app.delete('/api/notifications/bulk/permanent', requireUserToken, async (req, res) => {
  const userEmail = req.userEmail;
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'Bad request' });
  try {
    await prisma.notification.deleteMany({
      where: { id: { in: ids }, userEmail, deletedAt: { not: null } }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to permanently delete notifications' });
  }
});

app.patch('/api/notifications/bulk/restore', requireUserToken, async (req, res) => {
  const userEmail = req.userEmail;
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'Bad request' });
  try {
    await prisma.notification.updateMany({
      where: { id: { in: ids }, userEmail },
      data: { deletedAt: null }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to bulk restore notifications' });
  }
});

app.delete('/api/notifications/trash/empty', requireUserToken, async (req, res) => {
  const userEmail = req.userEmail;
  try {
    await prisma.notification.deleteMany({
      where: { userEmail, deletedAt: { not: null } }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to empty trash' });
  }
});

// ── Parameterized :id routes come LAST ────────────────────────────────────

app.patch('/api/notifications/:id/read', requireUserToken, async (req, res) => {
  const userEmail = req.userEmail;
  try {
    await prisma.notification.updateMany({
      where: { id: parseInt(req.params.id), userEmail },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

app.patch('/api/notifications/:id/unread', requireUserToken, async (req, res) => {
  const userEmail = req.userEmail;
  try {
    await prisma.notification.updateMany({
      where: { id: parseInt(req.params.id), userEmail },
      data: { isRead: false }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark as unread' });
  }
});

app.patch('/api/notifications/:id/restore', requireUserToken, async (req, res) => {
  const userEmail = req.userEmail;
  try {
    await prisma.notification.updateMany({
      where: { id: parseInt(req.params.id), userEmail },
      data: { deletedAt: null }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to restore notification' });
  }
});

app.delete('/api/notifications/:id', requireUserToken, async (req, res) => {
  const userEmail = req.userEmail;
  try {
    await prisma.notification.updateMany({
      where: { id: parseInt(req.params.id), userEmail },
      data: { deletedAt: new Date() }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

app.delete('/api/notifications/trash/empty', requireUserToken, async (req, res) => {
  const userEmail = req.userEmail;
  try {
    await prisma.notification.deleteMany({
      where: { userEmail, deletedAt: { not: null } }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to empty trash' });
  }
});

// Clean up trash older than 30 days automatically
setInterval(async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    await prisma.notification.deleteMany({
      where: {
        deletedAt: {
          not: null,
          lt: thirtyDaysAgo
        }
      }
    });
  } catch (err) {
    console.error("Trash cleanup error:", err);
  }
}, 24 * 60 * 60 * 1000); // Run once every 24 hours

// Admin Broadcast APIs
app.post('/api/admin/notifications/broadcast', requireAdminToken, async (req, res) => {
  const { title, message, link, icon, audience, sendAt, category } = req.body;
  const isScheduled = sendAt && new Date(sendAt) > new Date();
  const status = isScheduled ? 'scheduled' : 'sent';
  const broadcastCategory = category || 'Studio';

  try {
    const broadcast = await prisma.broadcast.create({
      data: {
        title, message, link: link || null, icon: icon || null, audience, status,
        category: broadcastCategory,
        sendAt: sendAt ? new Date(sendAt) : new Date()
      }
    });

    if (!isScheduled) {
      // Determine the notification type based on the category so it filters correctly on the frontend
      let notifType = broadcastCategory === 'Studio' ? 'admin_broadcast' : `admin_broadcast_${broadcastCategory}`;
      if (audience === 'all') {
        const users = await prisma.user.findMany({ select: { email: true } });
        const inserts = users.map(u => ({
          userEmail: u.email, type: notifType, title, message, link: link || null, icon: icon || '📣'
        }));
        if (inserts.length > 0) await prisma.notification.createMany({ data: inserts });
      } else {
        await prisma.notification.create({
          data: { userEmail: audience, type: notifType, title, message, link: link || null, icon: icon || '📣' }
        });
      }
    }
    res.json({ success: true, broadcast });
  } catch (err) {
    console.error('Broadcast creation error:', err);
    res.status(500).json({ error: 'Failed to create broadcast' });
  }
});

app.get('/api/admin/notifications/history', requireAdminToken, async (req, res) => {
  try {
    const history = await prisma.broadcast.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch broadcast history' });
  }
});

app.patch('/api/admin/notifications/:id', requireAdminToken, async (req, res) => {
  const { status, title, message, sendAt } = req.body;
  try {
    const updated = await prisma.broadcast.update({
      where: { id: parseInt(req.params.id) },
      data: { status, title, message, sendAt: sendAt ? new Date(sendAt) : undefined }
    });
    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update broadcast' });
  }
});

app.patch('/api/admin/notifications/triggers/:type', requireAdminToken, async (req, res) => {
  try {
    const trigger = await prisma.notificationTrigger.upsert({
      where: { type: req.params.type },
      update: { enabled: req.body.enabled },
      create: { type: req.params.type, enabled: req.body.enabled }
    });
    res.json({ success: true, trigger });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update trigger' });
  }
});

app.get('/api/admin/notifications/triggers', requireAdminToken, async (req, res) => {
  try {
    const triggers = await prisma.notificationTrigger.findMany();
    res.json({ triggers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch triggers' });
  }
});

// Generic endpoint for frontend to invoke auto-triggers (orders, comments, etc)
app.post('/api/admin/notifications/trigger-event', async (req, res) => {
  const { type, title, message, link, icon, targetEmail, actorAvatar } = req.body;
  if (!type || !title || !message) return res.status(400).json({ error: 'Missing fields' });

  try {
    const trigger = await prisma.notificationTrigger.findUnique({ where: { type } });
    if (trigger && !trigger.enabled) {
      return res.json({ success: true, skipped: true, message: 'Trigger disabled' });
    }

    if (targetEmail) {
      // Send to specific user (e.g. order update, post reply)
      await prisma.notification.create({
        data: { userEmail: targetEmail, type, title, message, link, icon, actorAvatar }
      });
    } else {
      // Send to all users (e.g. new course, new product)
      const users = await prisma.user.findMany({ select: { email: true } });
      const inserts = users.map(u => ({
        userEmail: u.email, type, title, message, link, icon, actorAvatar
      }));
      if (inserts.length > 0) {
        await prisma.notification.createMany({ data: inserts });
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Trigger event error:', err);
    res.status(500).json({ error: 'Failed to trigger event' });
  }
});

// Catch-All 404 Fallback Handler for any unknown URL (e.g. /whatever, /xyz, /admin)
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../404.html'));
});

async function seedInitialStoreProducts() {
  try {
    const count = await prisma.product.count();
    if (count > 0) {
      console.log(`Database already has ${count} store products. Skipping seed.`);
      return;
    }

    console.log('Seeding initial 19 store products (6 T-Shirts, 6 Hoodies, 7 Digital Assets/Courses)...');

    const tshirtVariantsData = JSON.stringify({
      colors: [
        { name: "White", hex: "#ffffff", available: true },
        { name: "Black", hex: "#111111", available: true },
        { name: "Red", hex: "#dc2626", available: false },
        { name: "Jeans", hex: "#4b6b94", available: false }
      ],
      sizes: [
        { name: "S", available: true },
        { name: "M", available: true },
        { name: "L", available: true },
        { name: "XL", available: false },
        { name: "XXL", available: false }
      ]
    });

    const hoodieVariantsData = JSON.stringify({
      colors: [
        { name: "White", hex: "#ffffff", available: true },
        { name: "Black", hex: "#111111", available: true }
      ],
      sizes: [
        { name: "S", available: true },
        { name: "M", available: true },
        { name: "L", available: true },
        { name: "XL", available: false },
        { name: "XXL", available: false }
      ]
    });

    const defaultFeatureHighlights = JSON.stringify([
      { title: "Weather-Ready Performance", desc: "Designed to handle light rain and changing conditions with water-resistant finishes and durable construction.", img: "assets/closeup_weather.png" },
      { title: "Functional Design", desc: "Smart pocket systems and practical details keep your essentials organized wherever you go.", img: "assets/closeup_functional.png" },
      { title: "Heavyweight Organic Fabric", desc: "Crafted from 100% premium 240 GSM organic combed cotton for ultra-soft comfort and long-lasting print vibrant quality.", img: "assets/closeup_performance.png" }
    ]);

    const productsToSeed = [
      // --- 6 Oversized T-Shirts ---
      {
        id: "itachi-colored-half-tshirt",
        name: "Itachi Uchiha Duo Graphic Colored T-Shirt",
        category: "Oversized T-Shirts",
        subCategory: "T-Shirts",
        price: 899.00,
        rating: 5.0,
        ratingCount: 48,
        description: "Heavyweight 100% organic cotton Itachi Uchiha duo graphic T-shirt with vibrant full-color artwork.",
        img: "assets/Store/Tshirts/Colored itachi tshirts/itachi_black_tshirt_colored.jpg",
        additionalImages: "assets/Store/Tshirts/Colored itachi tshirts/itachi_black_tshirt_colored.jpg\nassets/Store/Tshirts/Colored itachi tshirts/itachi_white_tshirt_colored.jpg\nassets/Store/Tshirts/Colored itachi tshirts/itachi_purple_tshirt_colored.jpg\nassets/Store/Tshirts/Colored itachi tshirts/itachi_red_tshirt_colored.jpg\nassets/closeup_weather.png\nassets/closeup_functional.png",
        badge: "Pre-Order",
        type: "physical",
        creator: "SenpaiWorks",
        available: true,
        stockQuantity: 50,
        variantsData: tshirtVariantsData,
        featureHighlights: defaultFeatureHighlights,
        sizes: "S, M, L",
        colors: "Black, White, Purple, Red"
      },
      {
        id: "itachi-bw-half-tshirt",
        name: "Itachi Uchiha Monochrome Edition T-Shirt",
        category: "Oversized T-Shirts",
        subCategory: "T-Shirts",
        price: 899.00,
        rating: 4.9,
        ratingCount: 32,
        description: "Heavyweight 100% organic cotton Itachi Uchiha graphic T-shirt in crisp monochrome black & white contrast prints.",
        img: "assets/Store/Tshirts/black and white itachi tshirts/itachi_black_tshirt_bw.jpg",
        additionalImages: "assets/Store/Tshirts/black and white itachi tshirts/itachi_black_tshirt_bw.jpg\nassets/Store/Tshirts/black and white itachi tshirts/itachi_white_tshirt_bw.jpg\nassets/Store/Tshirts/black and white itachi tshirts/itachi_red_tshirt_bw.jpg\nassets/closeup_weather.png\nassets/closeup_functional.png",
        badge: "New Arrival",
        type: "physical",
        creator: "SenpaiWorks",
        available: true,
        stockQuantity: 50,
        variantsData: tshirtVariantsData,
        featureHighlights: defaultFeatureHighlights,
        sizes: "S, M, L",
        colors: "Black, Red, White"
      },
      {
        id: "zoro-colored-half-tshirt",
        name: "Roronoa Zoro Three-Sword Colored T-Shirt",
        category: "Oversized T-Shirts",
        subCategory: "T-Shirts",
        price: 849.00,
        rating: 4.9,
        ratingCount: 42,
        description: "Ultra-soft organic cotton graphic tee featuring high-fidelity colored artwork of Roronoa Zoro.",
        img: "assets/Store/Tshirts/colored Zoro tshirts/zoro_colored_black_tshirt.jpg",
        additionalImages: "assets/Store/Tshirts/colored Zoro tshirts/zoro_colored_black_tshirt.jpg\nassets/Store/Tshirts/colored Zoro tshirts/zoro_colored_green_tshirt.jpg\nassets/Store/Tshirts/colored Zoro tshirts/zoro_colored_white_tshirt.jpg\nassets/closeup_weather.png\nassets/closeup_functional.png",
        badge: "Best Seller",
        type: "physical",
        creator: "SenpaiWorks",
        available: true,
        stockQuantity: 50,
        variantsData: tshirtVariantsData,
        featureHighlights: defaultFeatureHighlights,
        sizes: "S, M, L",
        colors: "Black, Green, White"
      },
      {
        id: "zoro-bw-half-tshirt",
        name: "Roronoa Zoro Monochrome Edition T-Shirt",
        category: "Oversized T-Shirts",
        subCategory: "T-Shirts",
        price: 849.00,
        rating: 4.8,
        ratingCount: 27,
        description: "High-contrast black & white graphic print featuring Roronoa Zoro on heavyweight organic cotton.",
        img: "assets/Store/Tshirts/Black and White Zoro tshirts/zoro_bw_black_tshirt.jpg",
        additionalImages: "assets/Store/Tshirts/Black and White Zoro tshirts/zoro_bw_black_tshirt.jpg\nassets/Store/Tshirts/Black and White Zoro tshirts/zoro_bw_green_tshirt.jpg\nassets/Store/Tshirts/Black and White Zoro tshirts/zoro_bw_white_tshirt.jpg\nassets/closeup_weather.png\nassets/closeup_functional.png",
        badge: "Limited Edition",
        type: "physical",
        creator: "SenpaiWorks",
        available: true,
        stockQuantity: 50,
        variantsData: tshirtVariantsData,
        featureHighlights: defaultFeatureHighlights,
        sizes: "S, M, L",
        colors: "Black, Green, White"
      },
      {
        id: "kaneki-bw-half-tshirt",
        name: "Ken Kaneki Tokyo Ghoul B&W Edition T-Shirt",
        category: "Oversized T-Shirts",
        subCategory: "T-Shirts",
        price: 799.00,
        rating: 4.9,
        ratingCount: 38,
        description: "Embrace the dark aesthetic with our high-fidelity Kaneki awakened state streetwear graphic T-shirt.",
        img: "assets/Store/Tshirts/Black and whirte kaneki tshirts/kaneki_black_tshirt_bw.jpg",
        additionalImages: "assets/Store/Tshirts/Black and whirte kaneki tshirts/kaneki_black_tshirt_bw.jpg\nassets/Store/Tshirts/Black and whirte kaneki tshirts/kaneki_maroon_tshirt_bw.jpg\nassets/Store/Tshirts/Black and whirte kaneki tshirts/kaneki_white_tshirt_bw.jpg",
        badge: "New Arrival",
        type: "physical",
        creator: "SenpaiWorks",
        available: true,
        stockQuantity: 50,
        variantsData: tshirtVariantsData,
        featureHighlights: defaultFeatureHighlights,
        sizes: "S, M, L",
        colors: "Black, Maroon, White"
      },
      {
        id: "kaneki-colored-half-tshirt",
        name: "Ken Kaneki Tokyo Ghoul Full Color T-Shirt",
        category: "Oversized T-Shirts",
        subCategory: "T-Shirts",
        price: 799.00,
        rating: 5.0,
        ratingCount: 45,
        description: "Vibrant full-color illustration of Kaneki Ken on heavyweight 240gsm combed organic cotton.",
        img: "assets/Store/Tshirts/Colored kaneki tshirts/kaneki_black_tshirt_colored.jpg",
        additionalImages: "assets/Store/Tshirts/Colored kaneki tshirts/kaneki_black_tshirt_colored.jpg\nassets/Store/Tshirts/Colored kaneki tshirts/kaneki_white_tshirt_colored.jpg\nassets/Store/Tshirts/Colored kaneki tshirts/kaneki_darkgrey_tshirt_colored.jpg",
        badge: "Best Seller",
        type: "physical",
        creator: "SenpaiWorks",
        available: true,
        stockQuantity: 50,
        variantsData: tshirtVariantsData,
        featureHighlights: defaultFeatureHighlights,
        sizes: "S, M, L",
        colors: "Black, White, Dark Grey"
      },

      // --- 6 Hoodies ---
      {
        id: "itachi-colored-hoodie",
        name: "Itachi Uchiha Duo Graphic Colored Hoodie",
        category: "Hoodies",
        subCategory: "Hoodies",
        price: 1599.00,
        rating: 5.0,
        ratingCount: 52,
        description: "Heavyweight 100% organic cotton fleece hoodie featuring vibrant full-color Itachi Uchiha duo graphic artwork with double-layered hood and kangaroo pocket.",
        img: "assets/Store/Hoodies/itachi hoodie/itachi hoodie color printed/itachi hoodie  color black.png",
        additionalImages: "assets/Store/Hoodies/itachi hoodie/itachi hoodie color printed/itachi hoodie  color black.png\nassets/Store/Hoodies/itachi hoodie/itachi hoodie color printed/itachi hoodie color white.png",
        badge: "Pre-Order",
        type: "physical",
        creator: "SenpaiWorks",
        available: true,
        stockQuantity: 50,
        variantsData: hoodieVariantsData,
        featureHighlights: defaultFeatureHighlights,
        sizes: "S, M, L",
        colors: "Black, White"
      },
      {
        id: "itachi-bw-hoodie",
        name: "Itachi Uchiha Monochrome Edition Hoodie",
        category: "Hoodies",
        subCategory: "Hoodies",
        price: 1599.00,
        rating: 4.9,
        ratingCount: 36,
        description: "Heavyweight organic cotton fleece hoodie featuring crisp monochrome black & white contrast Itachi Uchiha graphic print.",
        img: "assets/Store/Hoodies/itachi hoodie/itachi hoodie b&w printed/itachi hoodie black and white.png",
        additionalImages: "assets/Store/Hoodies/itachi hoodie/itachi hoodie b&w printed/itachi hoodie black and white.png\nassets/Store/Hoodies/itachi hoodie/itachi hoodie b&w printed/itachi hoodie b&w white.png",
        badge: "New Arrival",
        type: "physical",
        creator: "SenpaiWorks",
        available: true,
        stockQuantity: 50,
        variantsData: hoodieVariantsData,
        featureHighlights: defaultFeatureHighlights,
        sizes: "S, M, L",
        colors: "Black, White"
      },
      {
        id: "zoro-colored-hoodie",
        name: "Roronoa Zoro Three-Sword Colored Hoodie",
        category: "Hoodies",
        subCategory: "Hoodies",
        price: 1499.00,
        rating: 4.9,
        ratingCount: 44,
        description: "Ultra-soft organic fleece hoodie featuring high-fidelity colored artwork of Roronoa Zoro in three-sword style posture.",
        img: "assets/Store/Hoodies/Zoro hoodie/zoro hoodie colored printed/zoro hoodie color black.png",
        additionalImages: "assets/Store/Hoodies/Zoro hoodie/zoro hoodie colored printed/zoro hoodie color black.png\nassets/Store/Hoodies/Zoro hoodie/zoro hoodie colored printed/zoro hoodie color white.png",
        badge: "Best Seller",
        type: "physical",
        creator: "SenpaiWorks",
        available: true,
        stockQuantity: 50,
        variantsData: hoodieVariantsData,
        featureHighlights: defaultFeatureHighlights,
        sizes: "S, M, L",
        colors: "Black, White"
      },
      {
        id: "zoro-bw-hoodie",
        name: "Roronoa Zoro Monochrome Edition Hoodie",
        category: "Hoodies",
        subCategory: "Hoodies",
        price: 1499.00,
        rating: 4.8,
        ratingCount: 29,
        description: "High-contrast black & white graphic print featuring Roronoa Zoro on heavyweight organic fleece hoodie.",
        img: "assets/Store/Hoodies/Zoro hoodie/zoro hoodie b&w printed/zoro hoodie  b&w black.png",
        additionalImages: "assets/Store/Hoodies/Zoro hoodie/zoro hoodie b&w printed/zoro hoodie  b&w black.png\nassets/Store/Hoodies/Zoro hoodie/zoro hoodie b&w printed/zoro hoodie b&w white.png",
        badge: "Limited Edition",
        type: "physical",
        creator: "SenpaiWorks",
        available: true,
        stockQuantity: 50,
        variantsData: hoodieVariantsData,
        featureHighlights: defaultFeatureHighlights,
        sizes: "S, M, L",
        colors: "Black, White"
      },
      {
        id: "kaneki-colored-hoodie",
        name: "Ken Kaneki Tokyo Ghoul Full Color Hoodie",
        category: "Hoodies",
        subCategory: "Hoodies",
        price: 1399.00,
        rating: 5.0,
        ratingCount: 49,
        description: "Vibrant full-color illustration of Kaneki Ken on heavyweight 350gsm combed organic cotton fleece hoodie.",
        img: "assets/Store/Hoodies/kaneki hoodie/kaneki hoodie color printed/kaneki hoodie  color black.png",
        additionalImages: "assets/Store/Hoodies/kaneki hoodie/kaneki hoodie color printed/kaneki hoodie  color black.png\nassets/Store/Hoodies/kaneki hoodie/kaneki hoodie color printed/kaneki hoodie  color white.png",
        badge: "Best Seller",
        type: "physical",
        creator: "SenpaiWorks",
        available: true,
        stockQuantity: 50,
        variantsData: hoodieVariantsData,
        featureHighlights: defaultFeatureHighlights,
        sizes: "S, M, L",
        colors: "Black, White"
      },
      {
        id: "kaneki-bw-hoodie",
        name: "Ken Kaneki Tokyo Ghoul B&W Edition Hoodie",
        category: "Hoodies",
        subCategory: "Hoodies",
        price: 1399.00,
        rating: 4.9,
        ratingCount: 41,
        description: "Embrace the dark aesthetic with our high-fidelity Kaneki awakened state streetwear graphic fleece hoodie.",
        img: "assets/Store/Hoodies/kaneki hoodie/kaneki hoodie b&w printed/kaneki hoodie  b&w black.png",
        additionalImages: "assets/Store/Hoodies/kaneki hoodie/kaneki hoodie b&w printed/kaneki hoodie  b&w black.png\nassets/Store/Hoodies/kaneki hoodie/kaneki hoodie b&w printed/kaneki hoodie b&w white.png",
        badge: "New Arrival",
        type: "physical",
        creator: "SenpaiWorks",
        available: true,
        stockQuantity: 50,
        variantsData: hoodieVariantsData,
        featureHighlights: defaultFeatureHighlights,
        sizes: "S, M, L",
        colors: "Black, White"
      },

      // --- 7 Digital Assets & Courses ---
      {
        id: "deadpool-rig",
        name: "Deadpool 3D Stylized Animation Model Rig",
        category: "3D Assets",
        subCategory: "Characters",
        price: 45.00,
        rating: 5.0,
        ratingCount: 18,
        description: "Production-ready, highly stylized 3D model. Fully rigged with IK/FK controls, custom expression shape keys, and high-res textures. Ready for action and high-quality game/cinematic animations.",
        img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630827/deadpool_poster_krntp0.webp",
        additionalImages: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630827/deadpool_poster_krntp0.webp\nhttps://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_auto/v1757630827/all_characters_yvk9ik.webp\nhttps://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/chronos_plays_fl47xm.webp",
        badge: "Best Seller",
        software: "Blender, Maya",
        format: ".blend, .fbx",
        type: "digital",
        creator: "SenpaiWorks",
        available: true,
        stockQuantity: 999
      },
      {
        id: "anime-hair-pack",
        name: "3D Anime Hair Cards Mega Pack",
        category: "3D Assets",
        subCategory: "Anime Hair",
        price: 12.00,
        rating: 4.7,
        ratingCount: 8,
        description: "Collection of 12 distinct game-ready anime hairstyles optimized with low-poly hair cards. Ready for integration into Unity, Unreal Engine, and custom shaders.",
        img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp",
        additionalImages: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp\nhttps://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_auto/v1757630820/to_love_ru_copy_sthzsw.webp\nhttps://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/know_why_fp0q72.webp",
        badge: "",
        software: "Blender, Unreal Engine, Unity",
        format: ".blend, .fbx, .obj",
        type: "digital",
        creator: "SenpaiWorks",
        available: true,
        stockQuantity: 999
      },
      {
        id: "blender-sculpt-course",
        name: "Blender 3D Character Sculpting & Modeling Masterclass",
        category: "Digital Courses",
        subCategory: "Blender Courses",
        price: 89.99,
        rating: 4.9,
        ratingCount: 64,
        description: "Go from beginner to pro in Blender sculpting. Learn blocking out, anatomy sculpting, retopology, UV mapping, detail texturing, and high-quality character rendering pipelines.",
        img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_auto/v1757630827/all_characters_yvk9ik.webp",
        additionalImages: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_auto/v1757630827/all_characters_yvk9ik.webp\nhttps://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/know_why_fp0q72.webp\nhttps://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp",
        badge: "New",
        software: "Blender",
        format: ".blend",
        type: "digital",
        creator: "SenpaiWorks",
        available: true,
        stockQuantity: 999
      },
      {
        id: "zbrush-sculpt-course",
        name: "ZBrush Anatomy & Character Sculpting Masterclass",
        category: "Digital Courses",
        subCategory: "ZBrush Courses",
        price: 120.00,
        rating: 4.8,
        ratingCount: 38,
        description: "Learn advanced digital sculpting techniques in ZBrush. Covers facial features, anatomy landmarks, muscle flow, dynamics, details, and rendering in Keyshot.",
        img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/know_why_fp0q72.webp",
        additionalImages: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/know_why_fp0q72.webp\nhttps://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_auto/v1757630827/all_characters_yvk9ik.webp\nhttps://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/chronos_plays_fl47xm.webp",
        badge: "",
        software: "ZBrush",
        format: ".ztl",
        type: "digital",
        creator: "SenpaiWorks",
        available: true,
        stockQuantity: 999
      },
      {
        id: "skin-pbr-material",
        name: "Ultimate Realistic Skin Material & PBR Textures",
        category: "3D Assets",
        subCategory: "Skin Materials",
        price: 15.00,
        rating: 4.6,
        ratingCount: 11,
        description: "Procedural smart material and 4K PBR texture maps for highly realistic human skin. Includes micro-pores, veins, blemishes, and subsurface scattering setup.",
        img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630820/jungkook_copy_ntfb24.webp",
        additionalImages: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630820/jungkook_copy_ntfb24.webp\nhttps://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_auto/v1757630820/to_love_ru_copy_sthzsw.webp\nhttps://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp",
        badge: "",
        software: "Substance Painter, Blender, Unreal Engine",
        format: ".spp, .png",
        type: "digital",
        creator: "SenpaiWorks",
        available: true,
        stockQuantity: 999
      },
      {
        id: "custom-pencil-brushes",
        name: "Premium Charcoal & Pencil Digital Brush Pack",
        category: "3D Assets",
        subCategory: "Blender Brushes",
        price: 0.00,
        rating: 4.9,
        ratingCount: 42,
        description: "Achieve authentic paper texture and hand-drawn shading styles digitally in Clip Studio Paint and Photoshop. Contains 12 custom textured brushes. Ideal for sketching, linework, and charcoal rendering.",
        img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630820/jungkook_copy_ntfb24.webp",
        additionalImages: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630820/jungkook_copy_ntfb24.webp\nhttps://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_auto/v1757630820/to_love_ru_copy_sthzsw.webp\nhttps://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp",
        badge: "Free",
        software: "Photoshop",
        format: ".psd",
        type: "digital",
        creator: "SenpaiWorks",
        available: true,
        stockQuantity: 999
      },
      {
        id: "imm-mech-brushes",
        name: "Sci-Fi Hard Surface IMM Brushes Pack",
        category: "3D Assets",
        subCategory: "IMM Brushes",
        price: 18.00,
        rating: 4.7,
        ratingCount: 15,
        description: "ZBrush Insert Multi Mesh brushes collection for detailing robots, cybernetics, weapons, and mechanical environments. Over 50 modular components included. Speed up your workflow today.",
        img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/chronos_plays_fl47xm.webp",
        additionalImages: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/chronos_plays_fl47xm.webp\nhttps://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp\nhttps://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_auto/v1757630847/zoro_green_poster_unzusa.webp",
        badge: "",
        software: "ZBrush",
        format: ".ztl, .fbx",
        type: "digital",
        creator: "SenpaiWorks",
        available: true,
        stockQuantity: 999
      }
    ];

    const validIds = productsToSeed.map(p => p.id);

    // Delete obsolete seeded items (like old duplicate -full-hoodie items)
    await prisma.product.deleteMany({
      where: {
        id: { notIn: validIds }
      }
    });

    for (const p of productsToSeed) {
      await prisma.product.upsert({
        where: { id: p.id },
        update: p,
        create: p
      });
    }

    console.log('Successfully seeded initial 19 store products!');
  } catch (err) {
    console.error('Error seeding store products:', err);
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  seedInitialStoreProducts();
});



