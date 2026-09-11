const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { sendTelegramAlert } = require('./telegram');
const {
  sendSignupOtpEmail,
  sendPasswordResetOtpEmail,
  sendPasswordChangedConfirmationEmail,
  sendDigitalOrderDownloadEmail,
  sendEmailChangeOtpEmail,
  sendOrderConfirmationEmail
} = require('./mailer');

dotenv.config();

// =========================================================================
// PRODUCTION ENVIRONMENT SECRETS VALIDATION GUARD
// =========================================================================
if (process.env.NODE_ENV === 'production') {
  const criticalSecrets = ['JWT_SECRET', 'DATABASE_URL', 'SESSION_SECRET'];
  const missing = [];
  const defaultFallbacks = [
    'senpai_works_default_fallback_jwt_key_99',
    'senpaiworks_jwt_secret_dev_2026',
    'senpaiworks_admin_secret_dev_2026',
    'secret'
  ];

  for (const secretKey of criticalSecrets) {
    const val = process.env[secretKey];
    if (!val || val.trim() === '' || defaultFallbacks.includes(val.trim())) {
      missing.push(secretKey);
    }
  }

  if (missing.length > 0) {
    console.error('\x1b[31m%s\x1b[0m', '=======================================================');
    console.error('\x1b[31m%s\x1b[0m', '[FATAL CONFIG ERROR] Refusing to start server in production mode!');
    console.error('\x1b[31m%s\x1b[0m', `The following critical environment variables are missing or set to insecure development defaults: ${missing.join(', ')}`);
    console.error('\x1b[31m%s\x1b[0m', 'Please supply genuine cryptographically secure environment variables before launching in production.');
    console.error('\x1b[31m%s\x1b[0m', '=======================================================');
    process.exit(1);
  }
}

const path = require('path');
const fs = require('fs');
const livereload = require('livereload');
const connectLiveReload = require('connect-livereload');

const app = express();
const prisma = new PrismaClient();

// Security headers configuration via Helmet (nosniff, frameguard, xssFilter, etc.)
app.use(helmet({
  contentSecurityPolicy: false, // Maintain smooth compatibility with Google Fonts, FontAwesome, LiveReload CDNs
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

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
app.set('trust proxy', 1);

// Force HTTPS redirection in production / live domain environments
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
    if (proto !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
  }
  next();
});

app.use(cors({ origin: true, credentials: true }));
// Body parser: limit set to 15MB to accommodate base64-encoded image uploads
// (base64 adds ~33% overhead: 10MB binary → ~13.3MB JSON payload)
// Actual per-use-case limits are enforced inside each upload route:
//   /api/upload      → 10MB binary check
//   /api/user/avatar → 3MB binary check
app.use(express.json({ limit: '15mb' }));

app.use(cookieParser());

// Outage simulation middleware for testing backend API outages under normal http://localhost:5000 origin (strictly non-production)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    if (req.query.simulate_outage === 'true') {
      res.cookie('simulate_outage', 'true', { path: '/' });
    } else if (req.query.simulate_outage === 'false' || req.query.simulate_outage === '0') {
      res.clearCookie('simulate_outage', { path: '/' });
    }
    next();
  });

  app.use('/api', (req, res, next) => {
    const isOutage =
      req.query.simulate_outage === 'true' ||
      req.cookies?.simulate_outage === 'true' ||
      req.headers['x-simulate-outage'] === 'true' ||
      process.env.SIMULATE_API_OUTAGE === 'true';

    if (isOutage) {
      return res.status(503).json({
        error: 'Service Unavailable (Simulated Outage)',
        status: 503
      });
    }
    next();
  });
}

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

// Automatically strip .html from browser URL bar (e.g. /home.html -> /home, /legal/privacy.html -> /legal/privacy)
app.get(['/:page.html', '/legal/:page.html'], (req, res, next) => {
  const page = req.params.page;
  const isLegal = req.path.startsWith('/legal');
  if (page.startsWith('api') || page === 'admin') return next();
  const queryString = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const target = isLegal ? `/legal/${page}` : `/${page}`;
  res.redirect(302, `${target}${queryString}`);
});

// Explicit /legal/:page route (e.g. /legal/privacy, /legal/terms)
app.get('/legal/:page', (req, res, next) => {
  const page = req.params.page;
  const filePath = path.join(__dirname, '..', 'legal', `${page}.html`);
  if (fs.existsSync(filePath)) {
    return sendHtmlFile(res, filePath);
  }
  next();
});

// Clean URLs without .html extension (e.g. /home, /art-library, /store, /news, /privacy, /terms)
app.get('/:page', (req, res, next) => {
  const page = req.params.page;
  if (page.startsWith('api')) return next();

  const rootPath = path.join(__dirname, '..', `${page}.html`);
  if (fs.existsSync(rootPath)) {
    return sendHtmlFile(res, rootPath);
  }

  // Fallback check inside legal/ folder for footer pages
  const legalPath = path.join(__dirname, '..', 'legal', `${page}.html`);
  if (fs.existsSync(legalPath)) {
    return sendHtmlFile(res, legalPath);
  }

  next();
});

// Serve static assets (CSS, JS, images) for all pages
app.use(express.static(path.join(__dirname, '..'), { index: false }));

// Rate limiter for admin login (max 5 requests per 15 mins)
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  validate: { trustProxy: false }
});

// Admin JWT authentication middleware
function requireAdminToken(req, res, next) {
  let token = req.cookies?.adminToken;

  if (!token && req.headers['authorization']) {
    const authHeader = req.headers['authorization'];
    token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
  }

  if (!token || token === 'undefined' || token === 'null') {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid admin token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded && decoded.role === 'admin') {
      req.adminUser = decoded;
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid token payload' });
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Token verification failed' });
  }
}

// Admin Login Endpoint (sets httpOnly cookie for persistent, secure auth)
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

    // Issue 8-hour JWT token and set in httpOnly, Secure cookie
    const token = jwt.sign({ username: adminUser, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });

    res.cookie('adminToken', token, {
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return res.json({ success: true, message: 'Admin authentication successful', username: adminUser });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ error: 'Authentication failed due to a server error.' });
  }
});

// Admin Session Verification Endpoint
app.get('/api/admin/me', requireAdminToken, (req, res) => {
  return res.json({ success: true, adminUser: req.adminUser });
});

// Admin Logout Endpoint
app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('adminToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
  return res.json({ success: true, message: 'Admin signed out successfully.' });
});

// ==========================================
// CUSTOMER AUTHENTICATION & DEVICE APIS
// ==========================================

// Customer JWT authentication middleware
async function requireUserToken(req, res, next) {
  let token = req.cookies?.userToken;
  if (!token && req.headers['authorization']) {
    const authHeader = req.headers['authorization'];
    token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
  }
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Please log in to your account.' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded && decoded.email) {
      req.user = decoded;
      req.userEmail = decoded.email;
      if (!req.user.id) {
        const u = await prisma.user.findUnique({ where: { email: decoded.email } });
        if (u) req.user.id = u.id;
      }
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid authentication token.' });
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Token expired or invalid.' });
  }
}

// Product Reviews Router (Batch A Customer-Facing & Batch B Moderation)
const reviewsRouter = require('./routes/reviews')(prisma, requireUserToken, requireAdminToken, JWT_SECRET);
app.use(reviewsRouter);

// Initialize In-App Review Nudge Cron
const { initReviewNudgeCron } = require('./cron/review-nudge');
initReviewNudgeCron(prisma);

// Initialize Autonomous 14-Day Trash Purge Cron
const { initTrashPurgeCron } = require('./cron/trash-purge');
initTrashPurgeCron(prisma);


// Helper: parse human-readable device/browser info from User-Agent header
function parseDeviceInfo(userAgent = '') {
  if (!userAgent) return 'Web Browser';
  let os = 'Unknown OS';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Macintosh') || userAgent.includes('Mac OS')) os = 'macOS';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
  else if (userAgent.includes('Linux')) os = 'Linux';

  let browser = 'Browser';
  if (userAgent.includes('Edg/')) browser = 'Microsoft Edge';
  else if (userAgent.includes('Chrome/')) browser = 'Chrome';
  else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) browser = 'Safari';
  else if (userAgent.includes('Firefox/')) browser = 'Firefox';

  return `${browser} on ${os}`;
}

// Rate Limiter: Limit OTP & password reset requests to 2 per 15 minutes per email to prevent abuse
const otpRateLimitTracker = new Map();

function checkOtpRateLimit(email) {
  if (!email) return { allowed: true };
  const cleanEmail = email.toLowerCase().trim();
  const now = Date.now();
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  const MAX_ATTEMPTS = 2;

  const record = otpRateLimitTracker.get(cleanEmail);
  if (!record) {
    otpRateLimitTracker.set(cleanEmail, { count: 1, firstRequest: now });
    return { allowed: true };
  }

  if (now - record.firstRequest > WINDOW_MS) {
    // Window expired, reset counter
    otpRateLimitTracker.set(cleanEmail, { count: 1, firstRequest: now });
    return { allowed: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const minutesRemaining = Math.max(1, Math.ceil((WINDOW_MS - (now - record.firstRequest)) / (60 * 1000)));
    return {
      allowed: false,
      error: `Too many requests. To prevent spam, you can only request 2 verification codes every 15 minutes. Please check your inbox for the code already sent, or try again in ${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''}.`
    };
  }

  record.count += 1;
  return { allowed: true };
}

// Dedicated Rate Limiters for Public Interactive Endpoints
const customerLoginLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_LOGIN_MAX, 10) || 10,
  message: { error: 'Too many login attempts. Please wait 15 minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Account Lockout Tracker: 5 consecutive failed attempts locks account for 15 minutes
const accountLockoutTracker = new Map();

function isAccountLocked(identifier) {
  if (!identifier) return false;
  const key = identifier.toLowerCase().trim();
  const record = accountLockoutTracker.get(key);
  if (!record) return false;
  if (record.lockedUntil && Date.now() < record.lockedUntil) {
    return true;
  }
  if (record.lockedUntil && Date.now() >= record.lockedUntil) {
    accountLockoutTracker.delete(key);
    return false;
  }
  return false;
}

function recordFailedLogin(identifier) {
  if (!identifier) return;
  const key = identifier.toLowerCase().trim();
  const now = Date.now();
  const record = accountLockoutTracker.get(key) || { failedAttempts: 0, lockedUntil: null };

  if (record.lockedUntil && now >= record.lockedUntil) {
    record.failedAttempts = 0;
    record.lockedUntil = null;
  }

  record.failedAttempts += 1;
  if (record.failedAttempts >= 5) {
    record.lockedUntil = now + 15 * 60 * 1000; // 15 minutes lockout
  }
  accountLockoutTracker.set(key, record);
}

function recordSuccessfulLogin(identifier) {
  if (!identifier) return;
  const key = identifier.toLowerCase().trim();
  accountLockoutTracker.delete(key);
}

const orderLookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many order lookup attempts. Please wait 15 minutes before trying again.' }
});

const orderAddressUpdateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many address update requests. Please wait 15 minutes before trying again.' }
});

const adminOrderStatusLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { error: 'Too many status update requests. Please wait before retrying.' }
});

const orderCancellationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Too many cancellation requests. Please wait 15 minutes before trying again.' }
});

// Rate limiter for public coupon validation — guessable codes, so tighten it
const couponValidateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many coupon validation attempts. Please wait 15 minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false
});


const communityReviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many review submissions. Please wait before submitting more feedback.' }
});

const merchVoteLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 15,
  message: { error: 'Voting rate limit reached. Please wait a few minutes before casting another vote.' }
});

const artworkInterestLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  message: { error: 'Too many requests. Please wait a moment.' }
});

const artworkDownloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many download requests. Please wait a few minutes before downloading again.' }
});

// Standardized password complexity validator
const PASSWORD_REQUIREMENTS_ERROR = 'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.';

function isStrongPassword(password) {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasUpper && hasLower && hasNumber && hasSpecial;
}

// 1. Signup Endpoint (generates 6-digit OTP & sends verification email via Resend)
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({ error: PASSWORD_REQUIREMENTS_ERROR });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = (username || cleanEmail.split('@')[0]).trim();

    // Check if verified user exists — respond identically to prevent email enumeration
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing && existing.emailVerified) {
      return res.json({
        success: true,
        requireOtp: true,
        email: cleanEmail,
        message: 'If an account can be created with this email, a 6-digit verification code has been sent.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    // Generate secure 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let user;
    if (existing) {
      user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          username: cleanUsername,
          name: cleanUsername,
          passwordHash,
          signupOtp: otpCode,
          signupOtpExpiresAt: otpExpiresAt,
          emailVerified: false
        }
      });
    } else {
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          username: cleanUsername,
          name: cleanUsername,
          passwordHash,
          signupOtp: otpCode,
          signupOtpExpiresAt: otpExpiresAt,
          emailVerified: false
        }
      });
    }

    // Send verification email via Resend
    sendSignupOtpEmail(cleanEmail, cleanUsername, otpCode).catch(err => {
      console.warn('[Mailer] Signup OTP email failed:', err.message);
    });

    return res.json({
      success: true,
      requireOtp: true,
      email: cleanEmail,
      message: 'If an account can be created with this email, a 6-digit verification code has been sent.'
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Failed to create account.' });
  }
});

// 2. Verify Signup & Device OTP Endpoint
const handleVerifyOtp = async (req, res) => {
  try {
    const { email, otp, deviceInfo } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and 6-digit OTP code are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp).trim();

    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      return res.status(404).json({ error: 'Account not found. Please sign up again.' });
    }

    if (!user.signupOtp || user.signupOtp !== cleanOtp) {
      return res.status(400).json({ error: 'Invalid verification code. Please check your email and try again.' });
    }

    if (user.signupOtpExpiresAt && user.signupOtpExpiresAt < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
    }

    // Mark verified and clear OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        signupOtp: null,
        signupOtpExpiresAt: null
      }
    });

    // Generate new Device Token for this verified browser
    const deviceTokenVal = crypto.randomBytes(32).toString('hex');
    const resolvedDevice = deviceInfo || parseDeviceInfo(req.headers['user-agent']);

    await prisma.deviceToken.create({
      data: {
        userId: user.id,
        token: deviceTokenVal,
        deviceInfo: resolvedDevice
      }
    });

    // Record Login History
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        deviceInfo: resolvedDevice,
        status: 'OTP_VERIFIED'
      }
    });

    // Issue JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username, name: user.name || user.username },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.cookie('userToken', token, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return res.json({
      success: true,
      token,
      deviceToken: deviceTokenVal,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name || user.username,
        avatar: user.avatar || 'assets/default-avatar.svg',
        phone: user.phone || '',
        countryCode: user.countryCode || '+91',
        profile_completed: Boolean(user.profileCompleted),
        profileCompleted: Boolean(user.profileCompleted),
        provider: user.provider
      }
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({ error: 'Failed to verify code.' });
  }
};
app.post('/api/auth/verify-signup-otp', handleVerifyOtp);
app.post('/api/auth/verify-otp', handleVerifyOtp);

// 3. Resend Signup OTP Endpoint
app.post('/api/auth/resend-signup-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const cleanEmail = email.toLowerCase().trim();

    // Check rate limit (max 2 per 15 minutes)
    const rateCheck = checkOtpRateLimit(cleanEmail);
    if (!rateCheck.allowed) {
      return res.status(429).json({ error: rateCheck.error });
    }

    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) return res.status(404).json({ error: 'Account not found.' });

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Account is already verified. Please sign in.' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { signupOtp: otpCode, signupOtpExpiresAt: otpExpiresAt }
    });

    sendSignupOtpEmail(cleanEmail, user.username, otpCode).catch(err => {
      console.warn('[Mailer] Resend OTP email failed:', err.message);
    });

    return res.json({ success: true, message: `New verification code sent to ${cleanEmail}` });
  } catch (err) {
    console.error('Resend OTP error:', err);
    return res.status(500).json({ error: 'Failed to resend code.' });
  }
});// 4. Customer Login Endpoint (checks password + recognizes device token)
app.post('/api/auth/login', customerLoginLimiter, async (req, res) => {
  try {
    const { email, username, password, deviceInfo } = req.body;
    const deviceToken = req.body.deviceToken || req.headers['x-device-token'];
    const identifier = (email || username || '').toLowerCase().trim();
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/username and password are required.' });
    }

    // Check account-level lockout (5 consecutive failed attempts)
    if (isAccountLocked(identifier)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      }
    });

    if (!user || !user.passwordHash) {
      recordFailedLogin(identifier);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      recordFailedLogin(identifier);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Reset failed login counter on successful password verification
    recordSuccessfulLogin(identifier);

    // Check if email is verified
    if (!user.emailVerified) {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await prisma.user.update({
        where: { id: user.id },
        data: { signupOtp: otpCode, signupOtpExpiresAt: otpExpiresAt }
      });
      sendSignupOtpEmail(user.email, user.username, otpCode).catch(() => { });

      return res.status(403).json({
        success: false,
        requireOtp: true,
        email: user.email,
        error: 'Please verify your email address to sign in. A new 6-digit code has been sent.'
      });
    }

    const resolvedDevice = deviceInfo || parseDeviceInfo(req.headers['user-agent']);

    // Check if client provided a recognized device token for this user
    let recognizedDevice = null;
    if (deviceToken) {
      recognizedDevice = await prisma.deviceToken.findFirst({
        where: { userId: user.id, token: deviceToken }
      });
    }

    // REAL GATE: If device is NOT recognized -> Require OTP verification challenge!
    if (!recognizedDevice) {
      const rateCheck = checkOtpRateLimit(user.email);
      if (!rateCheck.allowed) {
        return res.status(429).json({ error: rateCheck.error });
      }

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await prisma.user.update({
        where: { id: user.id },
        data: { signupOtp: otpCode, signupOtpExpiresAt: otpExpiresAt }
      });

      sendSignupOtpEmail(user.email, user.name || user.username, otpCode).catch(err => {
        console.warn('[Mailer] Login OTP email failed:', err.message);
      });

      // Log OTP challenge attempt in history
      await prisma.loginHistory.create({
        data: {
          userId: user.id,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
          deviceInfo: resolvedDevice,
          status: 'NEW_DEVICE_OTP_CHALLENGE'
        }
      });

      return res.status(200).json({
        success: false,
        requireOtp: true,
        email: user.email,
        message: 'New device detected. A 6-digit verification code has been sent to your email to verify this device.'
      });
    }

    // Recognized Device -> Update last used timestamp and issue JWT directly
    await prisma.deviceToken.update({
      where: { id: recognizedDevice.id },
      data: { lastUsedAt: new Date(), deviceInfo: resolvedDevice }
    });

    // Log Login History
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        deviceInfo: resolvedDevice,
        status: 'DIRECT_LOGIN_RECOGNIZED_DEVICE'
      }
    });

    // Issue JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username, name: user.name || user.username },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.cookie('userToken', token, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return res.json({
      success: true,
      token,
      deviceToken: recognizedDevice.token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name || user.username,
        avatar: user.avatar || 'assets/default-avatar.svg',
        phone: user.phone || '',
        countryCode: user.countryCode || '+91',
        profile_completed: Boolean(user.profileCompleted),
        profileCompleted: Boolean(user.profileCompleted),
        provider: user.provider
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Authentication failed.' });
  }
});

// 5. Forgot Password / Request OTP Endpoint (generates 6-digit reset OTP)
const handleForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check rate limit (max 2 per 15 minutes)
    const rateCheck = checkOtpRateLimit(cleanEmail);
    if (!rateCheck.allowed) {
      return res.status(429).json({ error: rateCheck.error });
    }

    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    // Always respond with the exact same message to prevent user enumeration
    if (!user) {
      return res.json({
        success: true,
        email: cleanEmail,
        message: "If that email is registered, you'll receive a code."
      });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetOtp: resetCode,
        resetOtpExpiresAt: resetExpiresAt
      }
    });

    sendPasswordResetOtpEmail(cleanEmail, user.username, resetCode).catch(err => {
      console.warn('[Mailer] Password reset OTP email failed:', err.message);
    });

    return res.json({
      success: true,
      email: cleanEmail,
      message: "If that email is registered, you'll receive a code."
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Failed to process request.' });
  }
};
app.post('/api/auth/forgot-password', handleForgotPassword);
app.post('/api/auth/request-otp', handleForgotPassword);

// 6a. Verify Reset OTP Endpoint (validates code before allowing password input)
app.post('/api/auth/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and verification code are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp).trim();

    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user || !user.resetOtp) {
      return res.status(400).json({ error: 'Invalid or expired password reset code.' });
    }

    if (user.resetOtp !== cleanOtp) {
      return res.status(400).json({ error: 'Incorrect verification code. Please check your email.' });
    }

    if (user.resetOtpExpiresAt && user.resetOtpExpiresAt < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
    }

    return res.json({ success: true, verified: true, message: 'Code verified successfully.' });
  } catch (err) {
    console.error('Verify reset OTP error:', err);
    return res.status(500).json({ error: 'Failed to verify code.' });
  }
});

// 6b. Reset Password Endpoint (verifies reset OTP & updates password with 12 bcrypt rounds)
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, reset code, and new password are required.' });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ error: PASSWORD_REQUIREMENTS_ERROR });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp).trim();

    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user || !user.resetOtp) {
      return res.status(400).json({ error: 'Invalid or expired password reset code.' });
    }

    if (user.resetOtp !== cleanOtp) {
      return res.status(400).json({ error: 'Incorrect reset code. Please check your email and try again.' });
    }

    if (user.resetOtpExpiresAt && user.resetOtpExpiresAt < new Date()) {
      return res.status(400).json({ error: 'Reset code has expired. Please request a new code.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetOtp: null,
        resetOtpExpiresAt: null,
        emailVerified: true // resetting password also confirms email ownership
      }
    });

    // Register device token so subsequent sign-ins from this browser don't require redundant OTP
    const deviceTokenToSave = req.body.deviceToken || (typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2));
    try {
      await prisma.deviceToken.upsert({
        where: { token: deviceTokenToSave },
        update: { lastUsedAt: new Date(), userId: user.id },
        create: {
          userId: user.id,
          token: deviceTokenToSave,
          deviceInfo: parseDeviceInfo(req.headers['user-agent'])
        }
      });
    } catch (e) { }

    // Send Security Confirmation Email
    sendPasswordChangedConfirmationEmail(user.email, user.name || user.username).catch(err => {
      console.warn('[Mailer] Password changed confirmation email failed:', err.message);
    });

    // In-app Security Notification
    prisma.notification.create({
      data: {
        userEmail: user.email,
        type: "security_alert",
        title: "Password Changed Successfully",
        message: "Your SenpaiWorks account password was changed successfully.",
        link: "profile.html#security",
        icon: "fa-solid fa-shield-halved"
      }
    }).catch(() => { });

    return res.json({
      success: true,
      deviceToken: deviceTokenToSave,
      message: 'Your password has been successfully reset. You can now sign in with your new password.'
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// 7. OAuth Account Sync (Google/Facebook)
app.post('/api/auth/oauth', async (req, res) => {
  try {
    const { email, username, name, avatar, provider, providerId } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const cleanEmail = email.toLowerCase().trim();
    let user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name || user.name || cleanEmail.split('@')[0],
          avatar: (avatar && !avatar.includes('rem_happy_evhesz.webp')) ? avatar : user.avatar,
          provider: provider || user.provider,
          providerId: providerId || user.providerId,
          emailVerified: true,
          profileCompleted: true
        }
      });
    } else {
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          username: username || cleanEmail.split('@')[0],
          name: name || cleanEmail.split('@')[0],
          avatar: avatar || 'assets/default-avatar.svg',
          provider: provider || 'oauth',
          providerId: providerId || null,
          emailVerified: true,
          profileCompleted: true
        }
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username, name: user.name || user.username },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.cookie('userToken', token, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name || user.username,
        avatar: user.avatar || 'assets/default-avatar.svg',
        phone: user.phone || '',
        countryCode: user.countryCode || '+91',
        profile_completed: Boolean(user.profileCompleted),
        profileCompleted: Boolean(user.profileCompleted),
        provider: user.provider
      }
    });
  } catch (err) {
    console.error('OAuth sync error:', err);
    return res.status(500).json({ error: 'OAuth authentication failed.' });
  }
});

// Customer Logout Endpoint
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('userToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// 8. User Login History Endpoint
app.get('/api/user/login-history', requireUserToken, async (req, res) => {
  try {
    const history = await prisma.loginHistory.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch login history.' });
  }
});

// 8b. Verify Current Password in Profile Settings (Protected)
app.post('/api/user/verify-current-password', requireUserToken, async (req, res) => {
  try {
    const userEmail = req.user?.email || req.userEmail;
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) return res.status(404).json({ error: 'User account not found.' });

    if (!user.passwordHash || user.provider === 'google' || user.provider === 'facebook') {
      return res.status(400).json({
        error: 'Your account is authenticated via Google/Facebook. Password is managed by your provider.'
      });
    }

    const { currentPassword } = req.body;
    if (!currentPassword) {
      return res.status(400).json({ error: 'Please enter your current password.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password. Please try again.' });
    }

    return res.json({ success: true, verified: true, message: 'Current password verified.' });
  } catch (err) {
    console.error('Verify current password error:', err);
    return res.status(500).json({ error: 'Failed to verify current password.' });
  }
});

// 9. Request Password Change OTP in Profile Settings (Protected)
app.post('/api/user/request-password-change-otp', requireUserToken, async (req, res) => {
  try {
    const userEmail = req.user?.email || req.userEmail;
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) return res.status(404).json({ error: 'User account not found.' });

    if (!user.passwordHash || user.provider === 'google' || user.provider === 'facebook') {
      return res.status(400).json({
        error: 'Your account is authenticated via Google/Facebook. Password is managed by your provider.'
      });
    }

    // Check rate limit (max 2 per 15 minutes)
    const rateCheck = checkOtpRateLimit(user.email);
    if (!rateCheck.allowed) {
      return res.status(429).json({ error: rateCheck.error });
    }

    const { currentPassword } = req.body;
    if (currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password does not match.' });
      }
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetOtp: otpCode,
        resetOtpExpiresAt: otpExpiresAt
      }
    });

    sendPasswordResetOtpEmail(user.email, user.name || user.username, otpCode).catch(err => {
      console.warn('[Mailer] Profile password change OTP email failed:', err.message);
    });

    return res.json({
      success: true,
      email: user.email,
      message: `A 6-digit verification code has been sent to ${user.email}`
    });
  } catch (err) {
    console.error('Request password change OTP error:', err);
    return res.status(500).json({ error: 'Failed to send verification code.' });
  }
});

// 10. Confirm Password Change with OTP in Profile Settings (Protected)
app.post('/api/user/change-password', requireUserToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, otp } = req.body;
    if (!currentPassword || !newPassword || !otp) {
      return res.status(400).json({ error: 'Current password, new password, and 6-digit verification code are required.' });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ error: PASSWORD_REQUIREMENTS_ERROR });
    }

    const userEmail = req.user?.email || req.userEmail;
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user || !user.passwordHash) {
      return res.status(400).json({ error: 'Password change is not available for this account.' });
    }

    // Verify current password
    const isCurrentMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentMatch) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    // Verify 6-digit OTP
    const cleanOtp = String(otp).trim();
    if (!user.resetOtp || user.resetOtp !== cleanOtp) {
      return res.status(400).json({ error: 'Incorrect verification code. Please check your email.' });
    }

    if (user.resetOtpExpiresAt && user.resetOtpExpiresAt < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetOtp: null,
        resetOtpExpiresAt: null
      }
    });

    // Register device token
    const userDeviceToken = req.body.deviceToken || (typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2));
    try {
      await prisma.deviceToken.upsert({
        where: { token: userDeviceToken },
        update: { lastUsedAt: new Date(), userId: user.id },
        create: {
          userId: user.id,
          token: userDeviceToken,
          deviceInfo: parseDeviceInfo(req.headers['user-agent'])
        }
      });
    } catch (e) { }

    // Send Security Confirmation Email
    sendPasswordChangedConfirmationEmail(user.email, user.name || user.username).catch(err => {
      console.warn('[Mailer] Password change confirmation email failed:', err.message);
    });

    // In-app Security Notification
    prisma.notification.create({
      data: {
        userEmail: user.email,
        type: "security_alert",
        title: "Password Changed Successfully",
        message: "Your SenpaiWorks account password was changed successfully.",
        link: "profile.html#security",
        icon: "fa-solid fa-shield-halved"
      }
    }).catch(() => { });

    return res.json({
      success: true,
      deviceToken: userDeviceToken,
      message: 'Password changed successfully.'
    });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ error: 'Failed to change password.' });
  }
});

// 11. Request Email Change OTP (Protected)
app.post('/api/user/request-email-change-otp', requireUserToken, async (req, res) => {
  try {
    const userEmail = req.user?.email || req.userEmail;
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    if (user.provider === 'google' || user.provider === 'facebook' || !user.passwordHash) {
      return res.status(400).json({ error: 'Email changes are managed by your Google/Facebook provider.' });
    }

    const { newEmail, currentPassword } = req.body;
    if (!newEmail || !currentPassword) {
      return res.status(400).json({ error: 'New email address and current password are required.' });
    }

    const cleanNewEmail = newEmail.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanNewEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (cleanNewEmail === user.email.toLowerCase()) {
      return res.status(400).json({ error: 'New email address must be different from your current email.' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    // Check if new email is already registered to another account
    const existing = await prisma.user.findUnique({ where: { email: cleanNewEmail } });
    if (existing && existing.id !== user.id) {
      return res.status(400).json({ error: 'This email address is already registered to another account.' });
    }

    // Check OTP rate limit
    const rateCheck = checkOtpRateLimit(cleanNewEmail);
    if (!rateCheck.allowed) {
      return res.status(429).json({ error: rateCheck.error });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetOtp: otpCode,
        resetOtpExpiresAt: otpExpiresAt
      }
    });

    sendEmailChangeOtpEmail(cleanNewEmail, user.name || user.username, otpCode).catch(err => {
      console.warn('[Mailer] Email change OTP failed:', err.message);
    });

    return res.json({
      success: true,
      newEmail: cleanNewEmail,
      message: `A 6-digit verification code has been sent to ${cleanNewEmail}`
    });
  } catch (err) {
    console.error('Request email change OTP error:', err);
    return res.status(500).json({ error: 'Failed to send verification code.' });
  }
});

// 12. Confirm Email Change with OTP (Protected)
app.post('/api/user/confirm-email-change', requireUserToken, async (req, res) => {
  try {
    const userEmail = req.user?.email || req.userEmail;
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const { newEmail, currentPassword, otp, deviceToken } = req.body;
    if (!newEmail || !currentPassword || !otp) {
      return res.status(400).json({ error: 'New email, current password, and 6-digit verification code are required.' });
    }

    const cleanNewEmail = newEmail.toLowerCase().trim();
    const cleanOtp = String(otp).trim();

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    // Verify OTP
    if (!user.resetOtp || user.resetOtp !== cleanOtp) {
      return res.status(400).json({ error: 'Incorrect verification code. Please check your new email.' });
    }

    if (user.resetOtpExpiresAt && user.resetOtpExpiresAt < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
    }

    // Check collision again
    const existing = await prisma.user.findUnique({ where: { email: cleanNewEmail } });
    if (existing && existing.id !== user.id) {
      return res.status(400).json({ error: 'This email address is already in use.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        email: cleanNewEmail,
        resetOtp: null,
        resetOtpExpiresAt: null,
        emailVerified: true
      }
    });

    // Register device token
    const userDeviceToken = deviceToken || (typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2));
    try {
      await prisma.deviceToken.upsert({
        where: { token: userDeviceToken },
        update: { lastUsedAt: new Date(), userId: user.id },
        create: {
          userId: user.id,
          token: userDeviceToken,
          deviceInfo: parseDeviceInfo(req.headers['user-agent'])
        }
      });
    } catch (e) { }

    // Generate fresh JWT token with updated email
    const token = jwt.sign(
      { id: updatedUser.id, email: updatedUser.email, username: updatedUser.username },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // In-app Notification
    prisma.notification.create({
      data: {
        userEmail: updatedUser.email,
        type: "security_alert",
        title: "Email Address Updated",
        message: `Your SenpaiWorks account email was successfully updated to ${updatedUser.email}.`,
        link: "profile.html#security",
        icon: "fa-solid fa-envelope"
      }
    }).catch(() => { });

    const safeUser = {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      name: updatedUser.name,
      avatar: updatedUser.avatar,
      phone: updatedUser.phone || '',
      countryCode: updatedUser.countryCode || '+91',
      profile_completed: Boolean(updatedUser.profileCompleted),
      profileCompleted: Boolean(updatedUser.profileCompleted),
      provider: updatedUser.provider
    };

    // Issue userToken cookie matching standard session cookie options
    res.cookie('userToken', token, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return res.json({
      success: true,
      token,
      user: safeUser,
      deviceToken: userDeviceToken,
      message: 'Email address updated successfully.'
    });
  } catch (err) {
    console.error('Confirm email change error:', err);
    return res.status(500).json({ error: 'Failed to update email address.' });
  }
});

// 13. Complete Profile Setup Endpoint (Protected)
app.post('/api/user/complete-profile-setup', requireUserToken, async (req, res) => {
  try {
    const userEmail = req.user?.email || req.userEmail;
    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const { name, phone, avatar, countryCode } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: (name !== undefined && name !== null && String(name).trim() !== '') ? String(name).trim() : user.name,
        phone: (phone !== undefined && phone !== null && String(phone).trim() !== '') ? String(phone).trim() : user.phone,
        avatar: (avatar !== undefined && avatar !== null && String(avatar).trim() !== '') ? String(avatar).trim() : user.avatar,
        countryCode: (countryCode !== undefined && countryCode !== null && String(countryCode).trim() !== '') ? String(countryCode).trim() : user.countryCode,
        profileCompleted: true
      }
    });

    const safeUser = {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      name: updatedUser.name || updatedUser.username,
      avatar: updatedUser.avatar || 'assets/default-avatar.svg',
      phone: updatedUser.phone || '',
      countryCode: updatedUser.countryCode || '+91',
      profile_completed: Boolean(updatedUser.profileCompleted),
      profileCompleted: Boolean(updatedUser.profileCompleted),
      provider: updatedUser.provider
    };

    return res.json({
      success: true,
      user: safeUser,
      message: 'Profile setup completed successfully.'
    });
  } catch (err) {
    console.error('Complete profile setup error:', err);
    return res.status(500).json({ error: 'Failed to complete profile setup.' });
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

app.post('/api/merch/votes', merchVoteLimiter, async (req, res) => {
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
  if (animeId === null || animeId === undefined) return false;
  const str = String(animeId).trim();
  if (str.length === 0 || str.length > 100) return false;
  return /^[a-zA-Z0-9_\-\.]+$/.test(str);
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

// POST Anime Likes Endpoint (Requires Authentication)
app.post('/api/anime/likes', requireUserToken, likeGlobalLimiter, likePerIpLimiter, async (req, res) => {
  const { animeId, action } = req.body;
  if (!isValidAnimeId(animeId)) {
    return res.status(400).json({ error: 'Invalid or missing animeId' });
  }

  // Identity derived securely from authenticated session
  const actingUserKey = (req.user?.username || req.user?.email || '').toLowerCase().trim();
  const isUnlike = action === 'unlike';
  const dedupeKey = `user_${actingUserKey}:${animeId}`;
  const isAlreadyLiked = likedVisitorSet.has(dedupeKey);

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

// Reset Likes Endpoint (Clears DB + all in-memory structures - Protected Admin Endpoint)
app.post('/api/anime/likes/reset', requireAdminToken, async (req, res) => {
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

// Anime Comments Endpoints (with Threaded Replies, Likes, Reports, and Block filtering - Requires Authentication)
// Public endpoint: returns only the comment count (no content, no auth required)
app.get('/api/anime/comments/count', async (req, res) => {
  const { animeId } = req.query;
  if (!isValidAnimeId(animeId)) {
    return res.status(400).json({ error: 'Invalid or missing animeId' });
  }
  try {
    const count = await prisma.comment.count({
      where: { animeId, parentId: null }
    });
    return res.json({ count });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch comment count' });
  }
});

app.get('/api/anime/comments', requireUserToken, async (req, res) => {
  const { animeId } = req.query;
  if (!isValidAnimeId(animeId)) {
    return res.status(400).json({ error: 'Invalid or missing animeId' });
  }

  try {
    const actingUsername = (req.user?.username || '').toLowerCase().trim();
    const actingEmail = (req.user?.email || '').toLowerCase().trim();
    const effectiveUserKey = `user_${actingUsername || actingEmail}`;

    // 1. Get blocked users list for the viewing user
    let blockedUserKeys = [];
    const blocks = await prisma.userBlock.findMany({
      where: {
        OR: [
          { userKey: actingEmail },
          ...(actingUsername ? [{ userKey: actingUsername }] : [])
        ]
      },
      select: { blockedUserKey: true }
    });
    blockedUserKeys = blocks.map(b => b.blockedUserKey.toLowerCase());

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

app.post('/api/anime/comments', requireUserToken, commentPerUserLimiter, async (req, res) => {
  const { animeId, text, parentId } = req.body;

  if (!isValidAnimeId(animeId)) {
    return res.status(400).json({ error: 'Invalid or missing animeId' });
  }

  const userEmail = (req.user?.email || req.userEmail || '').toLowerCase().trim();
  if (!userEmail) {
    return res.status(401).json({ error: 'You must be signed in to post a comment.' });
  }

  let verifiedUsername = 'SenpaiFan';
  let userId = req.user?.id || null;
  try {
    const userRecord = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (userRecord) {
      userId = userRecord.id;
      verifiedUsername = userRecord.username || userRecord.name || userRecord.email.split('@')[0];
    } else if (req.user?.username || req.user?.name) {
      verifiedUsername = req.user.username || req.user.name;
    } else {
      verifiedUsername = userEmail.split('@')[0];
    }
  } catch (err) {
    verifiedUsername = (req.user?.username || req.user?.name || userEmail.split('@')[0]);
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
        userId: userId,
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

// Toggle Comment Like Endpoint (Protected - Requires Authentication)
app.post('/api/anime/comments/like', requireUserToken, commentLikeLimiter, async (req, res) => {
  const { commentId, action } = req.body;
  const actingUsername = (req.user?.username || '').toLowerCase().trim();
  const actingEmail = (req.user?.email || '').toLowerCase().trim();
  const effectiveUserKey = `user_${actingUsername || actingEmail}`;

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

// Helper to check comment author or admin authorization
async function isCommentAuthorized(comment, req) {
  if (!comment) return false;

  // 1. Admin check (role claim or admin cookie)
  if (req.user?.role === 'admin' || req.user?.isAdmin === true) {
    return true;
  }
  if (req.cookies?.adminToken) {
    try {
      const decodedAdmin = jwt.verify(req.cookies.adminToken, JWT_SECRET);
      if (decodedAdmin && (decodedAdmin.role === 'admin' || decodedAdmin.username)) {
        return true;
      }
    } catch (e) {}
  }

  // 2. Direct userId match
  const currentUserId = req.user?.id;
  if (comment.userId && currentUserId && comment.userId === currentUserId) {
    return true;
  }

  // 3. User record lookup via verified email
  const currentUserEmail = (req.user?.email || req.userEmail || '').toLowerCase().trim();
  if (currentUserEmail) {
    try {
      const userRecord = await prisma.user.findUnique({
        where: { email: currentUserEmail }
      });
      if (userRecord) {
        if (comment.userId && userRecord.id === comment.userId) {
          return true;
        }
        const commentAuthor = (comment.username || '').toLowerCase().trim();
        const uUsername = (userRecord.username || '').toLowerCase().trim();
        const uName = (userRecord.name || '').toLowerCase().trim();
        const uEmail = (userRecord.email || '').toLowerCase().trim();
        if (commentAuthor && (
          commentAuthor === uUsername ||
          commentAuthor === uName ||
          commentAuthor === uEmail ||
          commentAuthor === uEmail.split('@')[0]
        )) {
          return true;
        }
      }
    } catch (e) {}
  }

  // 4. Token claims match
  if (req.user) {
    const commentAuthor = (comment.username || '').toLowerCase().trim();
    const uUsername = (req.user.username || '').toLowerCase().trim();
    const uName = (req.user.name || '').toLowerCase().trim();
    if (commentAuthor && (
      commentAuthor === uUsername ||
      commentAuthor === uName ||
      commentAuthor === currentUserEmail ||
      commentAuthor === currentUserEmail.split('@')[0]
    )) {
      return true;
    }
  }

  return false;
}

// Delete Comment Endpoint
app.post('/api/anime/comments/delete', requireUserToken, async (req, res) => {
  const { commentId } = req.body;
  const targetCommentId = parseInt(commentId, 10);
  if (isNaN(targetCommentId)) {
    return res.status(400).json({ error: 'Invalid commentId' });
  }

  try {
    const existing = await prisma.comment.findUnique({
      where: { id: targetCommentId }
    });

    if (!existing) {
      return res.json({ success: true, message: 'Comment deleted' });
    }

    const authorized = await isCommentAuthorized(existing, req);
    if (!authorized) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to delete this comment.' });
    }

    // 1. Delete likes and reports on this comment
    await prisma.commentLike.deleteMany({ where: { commentId: targetCommentId } }).catch(() => {});
    await prisma.commentReport.deleteMany({ where: { commentId: targetCommentId } }).catch(() => {});

    // 2. Cascade delete nested replies if any
    const replies = await prisma.comment.findMany({ where: { parentId: targetCommentId } }).catch(() => []);
    if (replies.length > 0) {
      const replyIds = replies.map(r => r.id);
      await prisma.commentLike.deleteMany({ where: { commentId: { in: replyIds } } }).catch(() => {});
      await prisma.commentReport.deleteMany({ where: { commentId: { in: replyIds } } }).catch(() => {});
      await prisma.comment.deleteMany({ where: { parentId: targetCommentId } }).catch(() => {});
    }

    // 3. Delete the comment itself
    await prisma.comment.delete({
      where: { id: targetCommentId }
    });

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Edit Comment Endpoint
app.post('/api/anime/comments/edit', requireUserToken, async (req, res) => {
  const { commentId, text } = req.body;
  const targetCommentId = parseInt(commentId, 10);
  if (isNaN(targetCommentId)) {
    return res.status(400).json({ error: 'Invalid commentId' });
  }

  const rawText = typeof text === 'string' ? text.trim() : '';
  if (!rawText) {
    return res.status(400).json({ error: 'Comment text cannot be empty' });
  }

  if (rawText.length > 500) {
    return res.status(400).json({ error: 'Comment is too long (maximum 500 characters)' });
  }

  try {
    const existing = await prisma.comment.findUnique({
      where: { id: targetCommentId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const authorized = await isCommentAuthorized(existing, req);
    if (!authorized) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to edit this comment.' });
    }

    const updated = await prisma.comment.update({
      where: { id: targetCommentId },
      data: { text: rawText }
    });

    res.json({ success: true, comment: updated });
  } catch (error) {
    console.error('Error editing comment:', error);
    res.status(500).json({ error: 'Failed to edit comment' });
  }
});

// Block User Endpoint (Protected Customer Endpoint)
app.post('/api/users/block', requireUserToken, async (req, res) => {
  const userEmail = req.user?.email || req.userEmail;
  const { blockedUserKey } = req.body;
  const currentUserKey = userEmail.toLowerCase().trim();
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
      create: {
        userKey: currentUserKey,
        blockedUserKey: targetBlockedKey
      }
    });
    res.json({ success: true, message: 'User blocked successfully' });
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

app.post('/api/community/reviews', communityReviewLimiter, async (req, res) => {
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

app.post('/api/categories', requireAdminToken, async (req, res) => {
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

app.put('/api/categories/reorder-all', requireAdminToken, async (req, res) => {
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

app.put('/api/categories/:id/reorder', requireAdminToken, async (req, res) => {
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

app.delete('/api/categories/:id', requireAdminToken, async (req, res) => {
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

// Artwork Download Tracker Endpoint (Rate-limited)
app.post('/api/artworks/:id/download', artworkDownloadLimiter, async (req, res) => {
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

app.delete('/api/community/reviews/:id', requireAdminToken, async (req, res) => {
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
        downloadUrl: downloadUrl || null,
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

app.put('/api/products/:id', requireAdminToken, async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };
  delete updateData.id;

  if (updateData.price !== undefined) updateData.price = parseFloat(updateData.price);
  if (updateData.stockQuantity !== undefined) updateData.stockQuantity = parseInt(updateData.stockQuantity);
  if (updateData.available !== undefined) updateData.available = Boolean(updateData.available);
  if (updateData.isNew !== undefined) updateData.isNew = Boolean(updateData.isNew);
  if (Array.isArray(updateData.additionalImages)) updateData.additionalImages = updateData.additionalImages.join("\n");
  else if (typeof updateData.additionalImages === 'object' && updateData.additionalImages !== null) updateData.additionalImages = JSON.stringify(updateData.additionalImages);
  if (typeof updateData.variantsData === 'object' && updateData.variantsData !== null) updateData.variantsData = JSON.stringify(updateData.variantsData);
  if (typeof updateData.featureHighlights === 'object' && updateData.featureHighlights !== null) updateData.featureHighlights = JSON.stringify(updateData.featureHighlights);

  try {
    const updated = await prisma.product.update({
      where: { id },
      data: updateData
    });
    res.json(updated);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
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

// Artwork Endpoints (Supports optional limit/page pagination)
app.get('/api/artworks', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10);
    const limit = parseInt(req.query.limit, 10);
    const hasPagination = !isNaN(limit) && limit > 0;
    const take = hasPagination ? Math.min(100, limit) : undefined;
    const skip = hasPagination && !isNaN(page) && page > 0 ? (page - 1) * take : undefined;

    const [artworks, total] = await Promise.all([
      prisma.artwork.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        ...(take !== undefined ? { take, skip } : {})
      }),
      hasPagination ? prisma.artwork.count({ where: { deletedAt: null } }) : Promise.resolve(0)
    ]);

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

    if (hasPagination) {
      return res.json({
        artworks: enrichedArtworks,
        total,
        page: page || 1,
        limit: take,
        totalPages: Math.ceil(total / take)
      });
    }

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

// Admin: Soft Delete Artwork (Moves images to R2 trash/ with 14-day grace period)
app.delete('/api/artworks/:id', requireAdminToken, async (req, res) => {
  const { id } = req.params;
  try {
    const art = await prisma.artwork.findUnique({
      where: { id: parseInt(id) }
    });
    if (!art) {
      return res.status(404).json({ error: 'Artwork not found' });
    }

    const { moveToTrash } = require('./utils/r2upload');
    const trashedKeys = [];
    let trashedImgUrl = art.img;

    // Check if the image belongs to our R2 bucket
    const r2Domain = (process.env.R2_PUBLIC_URL || 'r2.dev').replace(/\/$/, '');
    if (art.img && (art.img.includes(r2Domain) || art.img.includes('r2.dev'))) {
      const possibleVariants = [art.img];
      if (art.img.includes('_medium.webp')) {
        possibleVariants.push(art.img.replace('_medium.webp', '_thumb.webp'));
        possibleVariants.push(art.img.replace('_medium.webp', '_full.webp'));
      }
      for (const vUrl of possibleVariants) {
        try {
          const moveRes = await moveToTrash(vUrl);
          if (moveRes) {
            trashedKeys.push(moveRes.trashKey);
            if (vUrl === art.img) trashedImgUrl = moveRes.trashUrl;
          }
        } catch (mErr) {
          console.warn('[Trash] Could not move variant to trash:', mErr.message);
        }
      }
    }

    // Soft delete: record deletedAt timestamp and metadata
    await prisma.artwork.update({
      where: { id: parseInt(id) },
      data: {
        deletedAt: new Date(),
        img: trashedImgUrl,
        trashMeta: JSON.stringify({
          originalImg: art.img,
          keys: trashedKeys,
          deletedAt: new Date().toISOString()
        })
      }
    });

    res.json({
      success: true,
      message: 'Artwork moved to trash (14-day recovery window before auto-purge)',
      deletedAt: new Date()
    });
  } catch (error) {
    console.error('Error soft-deleting artwork:', error);
    res.status(500).json({ error: 'Failed to delete artwork' });
  }
});

// =========================================================================
// ADMIN TRASH MANAGEMENT & RESTORATION ENDPOINTS
// =========================================================================

// Admin: View all trashed items across Artworks, News, and Homepage
app.get('/api/admin/trash', requireAdminToken, async (req, res) => {
  try {
    const GRACE_PERIOD_MS = 14 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const [trashedArtworks, trashedNews, trashedSlides, trashedShowcases] = await Promise.all([
      prisma.artwork.findMany({ where: { deletedAt: { not: null } }, orderBy: { deletedAt: 'desc' } }),
      prisma.newsArticle.findMany({ where: { deletedAt: { not: null } }, orderBy: { deletedAt: 'desc' } }),
      prisma.homeHeroSlide.findMany({ where: { deletedAt: { not: null } }, orderBy: { deletedAt: 'desc' } }),
      prisma.homeShowcaseItem.findMany({ where: { deletedAt: { not: null } }, orderBy: { deletedAt: 'desc' } })
    ]);

    function formatItem(item, type, titleField, imgField) {
      const deletedTime = new Date(item.deletedAt).getTime();
      const expiresAt = new Date(deletedTime + GRACE_PERIOD_MS);
      const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now) / (24 * 60 * 60 * 1000)));

      return {
        id: item.id,
        type,
        title: item[titleField] || 'Untitled',
        img: item[imgField] || '',
        deletedAt: item.deletedAt,
        expiresAt: expiresAt.toISOString(),
        daysRemaining
      };
    }

    const items = [
      ...trashedArtworks.map(a => formatItem(a, 'artwork', 'charname', 'img')),
      ...trashedNews.map(n => formatItem(n, 'news', 'title', 'img')),
      ...trashedSlides.map(s => formatItem(s, 'hero', 'title', 'bgUrl')),
      ...trashedShowcases.map(sc => formatItem(sc, 'showcase', 'title', 'imageUrl'))
    ];

    res.json({ success: true, count: items.length, items });
  } catch (err) {
    console.error('Error fetching trashed items:', err);
    res.status(500).json({ error: 'Failed to fetch trashed items' });
  }
});

// Admin: Restore an item from trash back to active
app.post('/api/admin/trash/restore', requireAdminToken, async (req, res) => {
  const { type, id } = req.body;
  if (!type || !id) return res.status(400).json({ error: 'type and id are required' });

  const { restoreFromTrash } = require('./utils/r2upload');

  try {
    if (type === 'artwork') {
      const art = await prisma.artwork.findUnique({ where: { id: parseInt(id) } });
      if (!art || !art.deletedAt) return res.status(404).json({ error: 'Trashed artwork not found' });

      let activeImg = art.img;
      if (art.trashMeta) {
        try {
          const meta = JSON.parse(art.trashMeta);
          if (Array.isArray(meta.keys)) {
            for (const k of meta.keys) {
              try {
                const restored = await restoreFromTrash(k);
                if (restored && k.includes('_medium.webp')) activeImg = restored.activeUrl;
              } catch (e) {}
            }
          }
        } catch (e) {}
      } else if (art.img && art.img.includes('/trash/')) {
        try {
          const restored = await restoreFromTrash(art.img);
          if (restored) activeImg = restored.activeUrl;
        } catch (r2Err) {
          activeImg = art.img.replace('/trash/', '/');
        }
      }

      const updated = await prisma.artwork.update({
        where: { id: parseInt(id) },
        data: { deletedAt: null, trashMeta: null, img: activeImg }
      });
      return res.json({ success: true, message: 'Artwork restored successfully', item: updated });
    }

    if (type === 'news') {
      const news = await prisma.newsArticle.findUnique({ where: { id } });
      if (!news || !news.deletedAt) return res.status(404).json({ error: 'Trashed news article not found' });

      let activeImg = news.img;
      if (news.img && news.img.includes('/trash/')) {
        try {
          const restored = await restoreFromTrash(news.img);
          if (restored) activeImg = restored.activeUrl;
        } catch (r2Err) {
          activeImg = news.img.replace('/trash/', '/');
        }
      }

      const updated = await prisma.newsArticle.update({
        where: { id },
        data: { deletedAt: null, trashMeta: null, img: activeImg }
      });
      return res.json({ success: true, message: 'News article restored successfully', item: updated });
    }

    if (type === 'hero') {
      const slide = await prisma.homeHeroSlide.findUnique({ where: { id } });
      if (!slide || !slide.deletedAt) return res.status(404).json({ error: 'Trashed hero slide not found' });

      let activeUrl = slide.bgUrl;
      if (slide.bgUrl && slide.bgUrl.includes('/trash/')) {
        try {
          const restored = await restoreFromTrash(slide.bgUrl);
          if (restored) activeUrl = restored.activeUrl;
        } catch (r2Err) {
          activeUrl = slide.bgUrl.replace('/trash/', '/');
        }
      }

      const updated = await prisma.homeHeroSlide.update({
        where: { id },
        data: { deletedAt: null, trashMeta: null, bgUrl: activeUrl }
      });
      return res.json({ success: true, message: 'Hero slide restored successfully', item: updated });
    }

    if (type === 'showcase') {
      const item = await prisma.homeShowcaseItem.findUnique({ where: { id } });
      if (!item || !item.deletedAt) return res.status(404).json({ error: 'Trashed showcase item not found' });

      let activeUrl = item.imageUrl;
      if (item.imageUrl && item.imageUrl.includes('/trash/')) {
        try {
          const restored = await restoreFromTrash(item.imageUrl);
          if (restored) activeUrl = restored.activeUrl;
        } catch (r2Err) {
          activeUrl = item.imageUrl.replace('/trash/', '/');
        }
      }

      const updated = await prisma.homeShowcaseItem.update({
        where: { id },
        data: { deletedAt: null, trashMeta: null, imageUrl: activeUrl }
      });
      return res.json({ success: true, message: 'Showcase item restored successfully', item: updated });
    }

    return res.status(400).json({ error: 'Invalid item type' });
  } catch (err) {
    console.error('Error restoring item from trash:', err);
    res.status(500).json({ error: 'Failed to restore item' });
  }
});

// Admin: Permanently purge an item from trash (early force delete before 14-day expiry)
app.delete('/api/admin/trash/purge', requireAdminToken, async (req, res) => {
  const { type, id } = req.body;
  if (!type || !id) return res.status(400).json({ error: 'type and id are required' });

  const { purgeTrashObject } = require('./utils/r2upload');

  try {
    if (type === 'artwork') {
      const art = await prisma.artwork.findUnique({ where: { id: parseInt(id) } });
      if (!art) return res.status(404).json({ error: 'Artwork not found' });

      if (art.trashMeta) {
        try {
          const meta = JSON.parse(art.trashMeta);
          if (Array.isArray(meta.keys)) {
            for (const k of meta.keys) await purgeTrashObject(k);
          }
        } catch (e) {}
      } else if (art.img) {
        await purgeTrashObject(art.img);
      }
      await prisma.artwork.delete({ where: { id: parseInt(id) } });
      return res.json({ success: true, message: 'Artwork permanently purged from database and R2' });
    }

    if (type === 'news') {
      const n = await prisma.newsArticle.findUnique({ where: { id } });
      if (!n) return res.status(404).json({ error: 'News article not found' });
      if (n.img) await purgeTrashObject(n.img);
      await prisma.newsArticle.delete({ where: { id } });
      return res.json({ success: true, message: 'News article permanently purged from database and R2' });
    }

    if (type === 'hero') {
      const s = await prisma.homeHeroSlide.findUnique({ where: { id } });
      if (!s) return res.status(404).json({ error: 'Hero slide not found' });
      if (s.bgUrl) await purgeTrashObject(s.bgUrl);
      await prisma.homeHeroSlide.delete({ where: { id } });
      return res.json({ success: true, message: 'Hero slide permanently purged from database and R2' });
    }

    if (type === 'showcase') {
      const sc = await prisma.homeShowcaseItem.findUnique({ where: { id } });
      if (!sc) return res.status(404).json({ error: 'Showcase item not found' });
      if (sc.imageUrl) await purgeTrashObject(sc.imageUrl);
      await prisma.homeShowcaseItem.delete({ where: { id } });
      return res.json({ success: true, message: 'Showcase item permanently purged from database and R2' });
    }

    return res.status(400).json({ error: 'Invalid item type' });
  } catch (err) {
    console.error('Error purging item:', err);
    res.status(500).json({ error: 'Failed to purge item' });
  }
});


// Artwork Interest Endpoint
app.post('/api/artworks/interest', artworkInterestLimiter, async (req, res) => {
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

// Admin Dashboard Stats Aggregation Endpoint (Protected Admin Endpoint)
app.get('/api/admin/stats', requireAdminToken, async (req, res) => {
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

// Fetch All Registered Users (Protected Admin Endpoint)
app.get('/api/users', requireAdminToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        phone: true,
        countryCode: true,
        profileCompleted: true,
        provider: true,
        emailVerified: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Save or Update User Profile & Avatar (Protected User Endpoint)
app.post('/api/users/profile', requireUserToken, async (req, res) => {
  const userEmail = req.user?.email || req.userEmail;
  const { username, name, avatar, phone, countryCode } = req.body;
  if (!userEmail) {
    return res.status(401).json({ error: 'Unauthorized: User email not found in token' });
  }
  try {
    const user = await prisma.user.update({
      where: { email: userEmail },
      data: {
        username: username || undefined,
        name: name || undefined,
        avatar: avatar || undefined,
        phone: phone || undefined,
        countryCode: countryCode || undefined
      }
    });
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
        phone: user.phone,
        countryCode: user.countryCode,
        profile_completed: Boolean(user.profileCompleted),
        profileCompleted: Boolean(user.profileCompleted),
        provider: user.provider
      }
    });
  } catch (error) {
    console.error('Error updating user profile in DB:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Upload & Update User Profile Avatar (Protected User Endpoint)
// Accepts base64 image, uploads to R2, deletes old avatar, updates DB.
app.post('/api/user/avatar', requireUserToken, async (req, res) => {
  const userEmail = req.user?.email || req.userEmail;
  if (!userEmail) {
    return res.status(401).json({ error: 'Unauthorized: User email not found in token' });
  }

  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'No image data provided' });

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Server-side 3 MB limit for avatars
    if (buffer.length > 3 * 1024 * 1024) {
      return res.status(400).json({ error: 'Avatar file size exceeds the 3 MB limit' });
    }

    // Magic bytes validation — reject anything that isn't a genuine image
    const detectedExtension = validateImageMagicBytes(buffer);
    if (!detectedExtension) {
      return res.status(400).json({
        error: 'Invalid file format: only PNG, JPG, WEBP, and GIF images are accepted'
      });
    }

    // Look up the user's current avatar so we can delete the old R2 object
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { avatar: true }
    });

    const { uploadAvatarToR2, moveToTrash, keyFromUrl } = require('./utils/r2upload');

    // Move previous R2 avatar to trash/ for 14-day retention (not a default SVG or external URL)
    const PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
    if (user?.avatar && user.avatar.startsWith(PUBLIC_URL + '/avatars/')) {
      try {
        await moveToTrash(keyFromUrl(user.avatar));
      } catch (delErr) {
        console.warn('[Trash] Could not move old avatar to trash in R2 (non-fatal):', delErr.message);
      }
    }

    const baseName = `avatar_${userEmail.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}`;
    const avatarUrl = await uploadAvatarToR2(buffer, baseName);

    // Persist new avatar URL in DB
    await prisma.user.update({
      where: { email: userEmail },
      data: { avatar: avatarUrl }
    });

    return res.json({ success: true, avatarUrl });
  } catch (err) {
    console.error('Avatar upload error:', err);
    return res.status(500).json({ error: 'Failed to upload avatar' });
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

// Image Magic Bytes Validator (inspects actual binary header)
function validateImageMagicBytes(buffer) {
  if (!buffer || buffer.length < 12) return null;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'png';
  }
  // JPEG / JPG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'jpg';
  }
  // GIF: 47 49 46 38 (GIF87a / GIF89a)
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return 'gif';
  }
  // WEBP: 52 49 46 46 ... 57 45 42 50 (RIFF....WEBP)
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return 'webp';
  }
  return null;
}

// Upload image to Cloudflare R2 (base64 JSON payload - Protected Admin Endpoint with Magic Bytes Validation)
app.post('/api/upload', requireAdminToken, async (req, res) => {
  try {
    const { imageBase64, fileName } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'No image data provided' });

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Max 10MB upload limit
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds maximum allowable limit (10MB)' });
    }

    // Verify true image binary header (magic bytes)
    const detectedExtension = validateImageMagicBytes(buffer);
    if (!detectedExtension) {
      return res.status(400).json({
        error: 'Invalid file format: upload rejected. File content does not match genuine image signatures (PNG, JPG, WEBP, GIF).'
      });
    }

    const baseName = `art_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const { uploadImageToR2 } = require('./utils/r2upload');
    const urls = await uploadImageToR2(buffer, baseName);

    // Return medium as the primary URL (used for display), plus thumb + full
    res.json({ success: true, url: urls.medium, urls });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ error: 'Failed to upload image to storage' });
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

// Notification Middlewares: uses single canonical requireUserToken from line 317


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

  const allKnownTypes = Object.values(categoryMapping).flat();

  let where = { userEmail };
  if (category === 'Trash') {
    where.deletedAt = { not: null };
  } else {
    where.deletedAt = null;
    if (category === 'Other') {
      where.AND = [
        { type: { notIn: allKnownTypes } },
        { type: { not: { startsWith: 'admin_broadcast_' } } }
      ];
    } else if (category && category !== 'All') {
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

    let counts = { All: unread.length, Orders: 0, Community: 0, Store: 0, News: 0, Other: 0 };
    unread.forEach(n => {
      let matched = false;
      for (const [cat, types] of Object.entries(categoryMapping)) {
        if (types.includes(n.type) || n.type === `admin_broadcast_${cat}`) {
          counts[cat]++;
          matched = true;
          break;
        }
      }
      if (!matched) {
        counts.Other++;
      }
    });

    const allKnownTypes = Object.values(categoryMapping).flat();
    const hasOther = await prisma.notification.findFirst({
      where: {
        userEmail,
        deletedAt: null,
        type: { notIn: allKnownTypes },
        NOT: { type: { startsWith: 'admin_broadcast_' } }
      },
      select: { id: true }
    });

    res.json({ unreadCount: counts.All, countsByCategory: counts, hasOther: !!hasOther });
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

app.get('/api/notifications/:id', requireUserToken, async (req, res) => {
  const userEmail = req.userEmail;
  try {
    const notif = await prisma.notification.findFirst({
      where: { id: parseInt(req.params.id), userEmail }
    });
    if (!notif) return res.status(404).json({ error: 'Notification not found' });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notification' });
  }
});

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

app.get('/api/admin/alerts', requireAdminToken, async (req, res) => {
  try {
    const alerts = await prisma.notification.findMany({
      where: {
        OR: [
          { userEmail: 'suhas_admin' },
          { type: { in: ['order_created', 'replacement_requested', 'donation_received'] } }
        ],
        deletedAt: null
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    const unreadCount = alerts.filter(a => !a.isRead).length;
    res.json({ success: true, alerts, unreadCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin alerts' });
  }
});

app.patch('/api/admin/alerts/:id/read', requireAdminToken, async (req, res) => {
  try {
    await prisma.notification.update({
      where: { id: parseInt(req.params.id) },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark alert as read' });
  }
});

app.patch('/api/admin/alerts/read-all', requireAdminToken, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: {
        OR: [
          { userEmail: 'suhas_admin' },
          { type: { in: ['order_created', 'replacement_requested', 'donation_received'] } }
        ]
      },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all alerts as read' });
  }
});

app.get('/api/admin/dashboard/stats', requireAdminToken, async (req, res) => {
  try {
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const now = new Date();
    const istNow = new Date(now.getTime() + istOffsetMs);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // 1. Last 7 Days Sales Timeline (IST)
    const timelineLabels = [];
    const timelineData = [];

    for (let i = 6; i >= 0; i--) {
      const targetIST = new Date(istNow.getTime() - i * 24 * 60 * 60 * 1000);
      const year = targetIST.getUTCFullYear();
      const month = targetIST.getUTCMonth();
      const day = targetIST.getUTCDate();

      const startOfDayUTC = new Date(Date.UTC(year, month, day, 0, 0, 0, 0) - istOffsetMs);
      const endOfDayUTC = new Date(Date.UTC(year, month, day, 23, 59, 59, 999) - istOffsetMs);

      const dayOrders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: startOfDayUTC,
            lte: endOfDayUTC
          },
          status: { not: "Cancelled" }
        },
        select: { total: true }
      });

      const dayRevenue = dayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      timelineLabels.push(`${monthNames[month]} ${day}`);
      timelineData.push(dayRevenue);
    }

    // 2. Category Breakdown from real orders & items
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          status: { not: "Cancelled" }
        }
      },
      include: {
        product: { select: { category: true } }
      }
    });

    const categoryRevenueMap = {};
    orderItems.forEach(item => {
      const cat = (item.product && item.product.category) ? item.product.category : "Apparel";
      const itemTotal = (item.price || 0) * (item.quantity || 1);
      categoryRevenueMap[cat] = (categoryRevenueMap[cat] || 0) + itemTotal;
    });

    let categoryLabels = Object.keys(categoryRevenueMap);
    let categoryData = Object.values(categoryRevenueMap);

    if (categoryLabels.length === 0) {
      categoryLabels = ["No Sales Recorded"];
      categoryData = [0];
    }

    // 3. Summary KPIs & Financial Reconciliation
    const totalArtworks = await prisma.artwork.count();
    const totalProducts = await prisma.product.count();
    const validOrders = await prisma.order.findMany({
      where: { status: { not: "Cancelled" } },
      select: { total: true, subtotal: true, shipping: true, discount: true }
    });
    const totalRevenue = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = validOrders.length;
    const productGmv = Object.values(categoryRevenueMap).reduce((sum, v) => sum + v, 0);
    const shippingCollected = validOrders.reduce((sum, o) => sum + (o.shipping || 0), 0);
    const discountsApplied = validOrders.reduce((sum, o) => sum + (o.discount || 0), 0);

    res.json({
      success: true,
      timeline: {
        labels: timelineLabels,
        data: timelineData
      },
      categories: {
        labels: categoryLabels,
        data: categoryData,
        productGmv
      },
      kpis: {
        totalArtworks,
        totalProducts,
        totalRevenue,
        totalOrders,
        productGmv,
        shippingCollected,
        discountsApplied
      }
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ error: "Failed to load dashboard stats" });
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

// Endpoint for admin triggers (Protected Admin Endpoint)
app.post('/api/admin/notifications/trigger-event', requireAdminToken, async (req, res) => {
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


// ==========================================
// ORDERS & STORE API
// ==========================================

// Optional user token middleware for POST /api/orders
function optionalUserToken(req, res, next) {
  console.log("[optionalUserToken] middleware hit");
  const authHeader = req.headers["authorization"];
  console.log("[optionalUserToken] Auth header:", authHeader ? authHeader.substring(0, 20) + "..." : "none");
  if (!authHeader) return next();
  const token = authHeader.split(" ")[1];
  if (!token) {
    console.log("[optionalUserToken] No token found in auth header");
    return next();
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("[optionalUserToken] Token decoded successfully. Email:", decoded.email);
    if (decoded && decoded.email) {
      req.userEmail = decoded.email;
    }
  } catch (err) {
    console.log("[optionalUserToken] Token decode error:", err.message);
  }
  next();
}

// Helper to calculate IST calendar day boundaries and formatted date string
function getISTDateRange(targetDate = new Date()) {
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(targetDate.getTime() + istOffsetMs);

  const year = istDate.getUTCFullYear();
  const month = istDate.getUTCMonth();
  const day = istDate.getUTCDate();

  const startOfDayIST = new Date(Date.UTC(year, month, day, 0, 0, 0, 0) - istOffsetMs);
  const endOfDayIST = new Date(Date.UTC(year, month, day, 23, 59, 59, 999) - istOffsetMs);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dateStr = `${monthNames[month]} ${day}`;

  return { startOfDayIST, endOfDayIST, dateStr };
}

// Standardized shipping address validation helper
function validateShippingAddress(address) {
  if (!address || typeof address !== 'object') {
    return "A valid shipping address object is required.";
  }
  const street = (address.address || address.street || address.flat || '').trim();
  const city = (address.city || '').trim();
  const state = (address.state || '').trim();
  const pincode = (address.pincode || address.zip || '').trim();
  const phone = (address.phone || '').trim();

  if (!street) return "Street address line is required.";
  if (!city) return "City is required.";
  if (!state) return "State is required.";
  if (!pincode) return "Pincode/ZIP code is required.";
  if (phone && !/^\+?[0-9\s-]{6,15}$/.test(phone)) {
    return "Please enter a valid contact phone number (6 to 15 digits).";
  }
  if (!/^[0-9A-Za-z\s-]{3,10}$/.test(pincode)) {
    return "Please enter a valid postal/pincode (3 to 10 characters).";
  }
  return null;
}

// Helpers for Order Status History & Timelines
function getOrderStatusHistory(order) {
  if (!order) return [];
  if (order.statusHistory) {
    try {
      const hist = typeof order.statusHistory === 'string' ? JSON.parse(order.statusHistory) : order.statusHistory;
      if (Array.isArray(hist) && hist.length > 0) return hist;
    } catch (e) { }
  }
  if (order.shippingAddress) {
    try {
      const parsed = typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : order.shippingAddress;
      if (parsed && Array.isArray(parsed._statusHistory) && parsed._statusHistory.length > 0) {
        return parsed._statusHistory;
      }
    } catch (e) { }
  }
  const history = [
    { status: "Placed", timestamp: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString() }
  ];
  const st = (order.status || "").toLowerCase();
  if (st.includes("deliver")) {
    history.push({ status: "Processing", timestamp: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString() });
    history.push({ status: "Shipped", timestamp: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString() });
    history.push({ status: "Delivered", timestamp: order.deliveredAt ? new Date(order.deliveredAt).toISOString() : new Date().toISOString() });
  } else if (st.includes("ship") || st.includes("transit")) {
    history.push({ status: "Processing", timestamp: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString() });
    history.push({ status: "Shipped", timestamp: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString() });
  } else if (st.includes("cancel")) {
    history.push({ status: "Processing", timestamp: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString() });
    history.push({ status: "Cancelled", timestamp: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString() });
  } else {
    history.push({ status: "Processing", timestamp: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString() });
  }
  return history;
}

function appendOrderStatusHistory(order, newStatus, note) {
  const history = getOrderStatusHistory(order);
  history.push({
    status: newStatus,
    timestamp: new Date().toISOString(),
    ...(note ? { note } : {})
  });
  return history;
}

function formatOrderResponse(order) {
  if (!order) return order;
  return {
    ...order,
    statusHistory: getOrderStatusHistory(order)
  };
}

// Helper to format JSON shipping address into human-readable multi-line string
function formatShippingAddressText(addressInput) {
  if (!addressInput) return "No shipping address provided";
  let addr = addressInput;
  if (typeof addr === "string") {
    try {
      addr = JSON.parse(addressInput);
    } catch (e) {
      return addressInput;
    }
  }
  if (typeof addr !== "object" || !addr) return String(addressInput);

  const lines = [];
  const street = [addr.address, addr.apartment].filter(Boolean).join(", ");
  if (street) lines.push(street);

  const cityStateZip = [
    addr.city,
    addr.state ? (addr.pincode ? `${addr.state} ${addr.pincode}` : addr.state) : (addr.pincode || addr.zip)
  ].filter(Boolean).join(", ");

  if (cityStateZip) lines.push(cityStateZip);
  if (addr.country && addr.country !== "India") lines.push(addr.country);

  return lines.length > 0 ? lines.join("\n") : (addr.address || "Address details on file");
}

app.post("/api/orders", optionalUserToken, async (req, res) => {
  try {
    const { email, address, items, subtotal, discountAmount, shipping, grandTotal, paymentType, paymentId } = req.body;

    let customerId = null;
    let finalEmail = email;
    let guestName = null;
    let guestPhone = null;

    if (address) {
      const parsedFirst = (address.firstName || "").trim();
      const parsedLast = (address.lastName || "").trim();
      if (parsedFirst || parsedLast) {
        guestName = `${parsedFirst} ${parsedLast}`.trim();
      }
      if (address.phone) {
        guestPhone = String(address.phone).trim();
      }
    }

    if (req.userEmail) {
      const user = await prisma.user.findUnique({ where: { email: req.userEmail } });
      if (user) {
        customerId = user.id;
        finalEmail = user.email;
        if (!guestName && (user.name || user.username)) {
          guestName = user.name || user.username;
        }
      }
    }

    // Verify items and recompute total securely
    let computedSubtotal = 0;
    const dbItems = [];
    let hasPhysical = false;
    let hasDigital = false;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Order must contain at least one item." });
    }

    for (const item of items) {
      const prodIdStr = String(item.id || item.productId || "");
      let product = await prisma.product.findUnique({ where: { id: prodIdStr } });

      if (!product && item.name) {
        product = await prisma.product.findFirst({ where: { name: item.name } });
      }

      if (!product) {
        return res.status(400).json({ error: `Invalid item in order: Product '${item.name || prodIdStr}' does not exist in catalog.` });
      }

      if (product.type === "digital") {
        hasDigital = true;
      } else {
        hasPhysical = true;
      }

      // Authoritative database price strictly enforced (client price is ignored)
      const canonicalPrice = product.price;
      computedSubtotal += (canonicalPrice * (item.quantity || 1));
      dbItems.push({
        productId: product.id,
        productName: product.name,
        price: canonicalPrice,
        img: product.img || item.img || item.productImage,
        variant: item.variant || item.selectedVariant || item.size || null,
        quantity: item.quantity || 1
      });
    }

    if (!finalEmail && email) {
      finalEmail = email.trim();
    }

    const isDigitalOnly = hasDigital && !hasPhysical;

    if (isDigitalOnly) {
      if (!finalEmail || !finalEmail.includes('@')) {
        return res.status(400).json({ error: "A valid email address is required for digital order delivery." });
      }
    } else {
      // Any order containing physical items strictly requires recipient name, phone, and complete delivery address
      if (!finalEmail || !finalEmail.includes('@')) {
        return res.status(400).json({ error: "A valid email address is required for order confirmation." });
      }
      if (!customerId && (!address || !address.firstName || !address.phone)) {
        return res.status(400).json({ error: "Guest checkout requires recipient name and phone number." });
      }
      if (!address || !address.address || !address.city || !address.state || !address.pincode) {
        return res.status(400).json({ error: "Physical items require a complete shipping address (street address, city, state, and pincode)." });
      }
    }

    const randSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${randSuffix}`;
    const computedTotal = computedSubtotal + (isDigitalOnly ? 0 : (shipping || 0)) - (discountAmount || 0);

    const initialHistory = [
      { status: "Placed", timestamp: new Date().toISOString() }
    ];
    if (isDigitalOnly) {
      initialHistory.push({ status: "Delivered", timestamp: new Date().toISOString(), note: "Instant Digital Delivery" });
    } else {
      initialHistory.push({ status: "Processing", timestamp: new Date().toISOString(), note: "Order placed and confirmed" });
    }

    const shippingAddressObj = {
      ...(address || {}),
      _statusHistory: initialHistory
    };

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId,
        email: finalEmail,
        guestName,
        guestPhone,
        shippingAddress: JSON.stringify(shippingAddressObj),
        subtotal: computedSubtotal,
        shipping: isDigitalOnly ? 0 : (shipping || 0),
        discount: discountAmount || 0,
        total: computedTotal,
        status: isDigitalOnly ? "Delivered" : "Processing",
        deliveredAt: isDigitalOnly ? new Date() : null,
        paymentStatus: isDigitalOnly ? "paid" : ((paymentId && paymentId.startsWith("COD")) ? "pending" : "paid"),
        paymentGateway: (paymentId && paymentId.startsWith("COD")) || (paymentType && String(paymentType).toLowerCase().includes("cod")) ? "cod" : (paymentType || "razorpay"),
        paymentId: paymentId || null,
        items: {
          create: dbItems
        }
      },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    // 1. In-app Admin Notification
    try {
      await prisma.notification.create({
        data: {
          userEmail: "suhas_admin",
          type: "order_created",
          title: `New Order: #${order.orderNumber}`,
          message: `Order #${order.orderNumber} placed by ${order.guestName || order.email} for ₹${order.total.toLocaleString()}.`,
          link: "admin.html#tab-orders",
          icon: "fa-solid fa-box"
        }
      });
    } catch (notifErr) {
      console.warn("[Notification] Failed to create in-app notification for order:", notifErr.message);
    }

    // 1b. Transactional Email & In-app Customer Notification for Instant Digital Delivery
    const digitalItemsForEmail = (order.items || []).filter(i => (i.product && i.product.type === "digital") || i.type === "digital");
    if (isDigitalOnly && order.email && digitalItemsForEmail.length > 0) {
      try {
        const firstItemName = (digitalItemsForEmail[0].productName || digitalItemsForEmail[0].name || (digitalItemsForEmail[0].product && digitalItemsForEmail[0].product.name) || 'Digital Asset').trim();
        const notifTitle = digitalItemsForEmail.length > 1
          ? `Your downloads are ready: ${firstItemName} (+${digitalItemsForEmail.length - 1} more)`
          : `Your download is ready: ${firstItemName}`;

        await prisma.notification.create({
          data: {
            userEmail: order.email,
            type: "order_delivered",
            title: notifTitle,
            message: `Your digital assets have been delivered instantly. You can download them directly from your Order History!`,
            link: "profile.html#orders",
            icon: "fa-solid fa-cloud-arrow-down"
          }
        });
      } catch (custNotifErr) {
        console.warn("[Notification] Failed to create customer digital delivery notification:", custNotifErr.message);
      }
    }

    if (digitalItemsForEmail.length > 0 && order.email) {
      sendDigitalOrderDownloadEmail(order, digitalItemsForEmail).catch(mailErr => {
        console.warn("[Mailer] Failed to dispatch digital order download email:", mailErr.message);
      });
    }

    // 1c. Transactional Order Confirmation Email (Guests & Logged-in Customers)
    if (order.email) {
      const trackingUrl = order.customerId
        ? `${process.env.APP_URL || 'http://localhost:5000'}/profile.html#orders`
        : `${process.env.APP_URL || 'http://localhost:5000'}/order-confirmation.html?orderNumber=${encodeURIComponent(order.orderNumber)}&email=${encodeURIComponent(order.email)}`;

      sendOrderConfirmationEmail(order, trackingUrl).then(res => {
        if (res && res.success) {
          console.log(`[Order Email] Dispatched confirmation email to ${order.email} for order #${order.orderNumber} (ID: ${res.id || res.messageId}) Tracking Link: ${trackingUrl}`);
        }
      }).catch(mailErr => {
        console.warn("[Mailer] Failed to dispatch order confirmation email:", mailErr.message);
      });
    }

    // 2. Telegram Alert to Admin
    let parsedAddressObj = null;
    try {
      parsedAddressObj = typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : order.shippingAddress;
    } catch (e) { }

    const resolvedCustomerName = order.guestName || (parsedAddressObj ? `${parsedAddressObj.firstName || ''} ${parsedAddressObj.lastName || ''}`.trim() : null) || "Customer";
    const resolvedPhone = order.guestPhone || (parsedAddressObj ? parsedAddressObj.phone : null) || "Not provided";
    const formattedAddress = formatShippingAddressText(order.shippingAddress);

    const itemsSummary = (order.items && order.items.length > 0)
      ? order.items.map((i, idx) => {
        const variantTxt = i.variant ? ` (${i.variant})` : "";
        return `${idx + 1}. ${i.productName}${variantTxt} x${i.quantity || 1} - ₹${i.price}`;
      }).join("\n")
      : "1. 1 item";

    // Count today's orders in IST (including this order)
    const { startOfDayIST, endOfDayIST, dateStr } = getISTDateRange(order.createdAt || new Date());
    const dailyOrderCount = await prisma.order.count({
      where: {
        createdAt: {
          gte: startOfDayIST,
          lte: endOfDayIST
        }
      }
    });

    const telegramMessage = `🛒 <b>New Order Placed!</b>\n` +
      `Order ${dailyOrderCount} (${dateStr})\n\n` +
      `<b>Order #:</b> #${order.orderNumber}\n` +
      `<b>Customer:</b> ${resolvedCustomerName}\n` +
      `<b>Phone:</b> ${resolvedPhone}\n` +
      `<b>Email:</b> ${order.email}\n\n` +
      `<b>Shipping Address:</b>\n` +
      `${formattedAddress}\n\n` +
      `<b>Total Amount:</b> ₹${order.total.toLocaleString()}\n` +
      `<b>Payment Status:</b> ${order.paymentStatus === 'paid' ? 'Paid' : 'COD (Pending)'}\n\n` +
      `<b>Items:</b>\n` +
      `${itemsSummary}`;

    sendTelegramAlert(telegramMessage).catch(err => {
      console.warn("[Telegram] Order alert error:", err.message);
    });

    res.json(formatOrderResponse(order));
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

app.get("/api/orders", requireUserToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { email: req.userEmail } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const orders = await prisma.order.findMany({
      where: { customerId: user.id },
      include: {
        items: {
          include: { product: true }
        },
        replacements: true
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(orders.map(formatOrderResponse));
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

app.get("/api/orders/lookup", orderLookupLimiter, async (req, res) => {
  try {
    const { orderNumber, email } = req.query;
    if (!orderNumber || !email) return res.status(400).json({ error: "Missing orderNumber or email" });

    const order = await prisma.order.findFirst({
      where: { orderNumber, email },
      include: {
        items: {
          include: { product: true }
        }
      }
    });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json([formatOrderResponse(order)]); // Return as array to match frontend expectations
  } catch (error) {
    console.error("Error looking up order:", error);
    res.status(500).json({ error: "Failed to lookup order" });
  }
});

app.get("/api/admin/orders", requireAdminToken, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: { product: true }
        },
        customer: { select: { id: true, username: true, name: true, email: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(orders.map(formatOrderResponse));
  } catch (error) {
    console.error("Error fetching admin orders:", error);
    res.status(500).json({ error: "Failed to fetch admin orders" });
  }
});

app.patch("/api/admin/orders/:id/status", requireAdminToken, adminOrderStatusLimiter, async (req, res) => {
  try {
    const { status, awbNumber } = req.body;
    const orderId = parseInt(req.params.id);

    const existingOrder = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existingOrder) return res.status(404).json({ error: "Order not found" });

    const updateData = { status };
    if (awbNumber !== undefined) {
      updateData.awbNumber = awbNumber;
    }
    if (status === "Delivered") {
      updateData.paymentStatus = "paid";
      updateData.deliveredAt = new Date();
    }

    let addressObj = {};
    try {
      addressObj = typeof existingOrder.shippingAddress === 'string' ? JSON.parse(existingOrder.shippingAddress) : (existingOrder.shippingAddress || {});
    } catch (e) { }

    const updatedHistory = appendOrderStatusHistory(existingOrder, status);
    addressObj._statusHistory = updatedHistory;
    updateData.shippingAddress = JSON.stringify(addressObj);

    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    if (status === "Delivered" && order.email) {
      try {
        const orderItems = order.items || [];
        let productSummary = "";
        if (orderItems.length > 0) {
          const firstItemName = (orderItems[0].productName || orderItems[0].name || (orderItems[0].product && orderItems[0].product.name) || "item").trim();
          if (orderItems.length === 1) {
            productSummary = `"${firstItemName}"`;
          } else {
            const extraCount = orderItems.length - 1;
            productSummary = `"${firstItemName}" (+${extraCount} more item${extraCount > 1 ? 's' : ''})`;
          }
        }

        const notifTitle = productSummary
          ? `Your order for ${productSummary} has been delivered! 🎉`
          : `Your order #${order.orderNumber} has been delivered! 🎉`;

        const notifMessage = productSummary
          ? `Your package containing ${productSummary} (Order #${order.orderNumber}) has been delivered. Thank you for shopping with SenpaiWorks!`
          : `Your package with order #${order.orderNumber} has been delivered. Thank you for shopping with SenpaiWorks!`;

        await prisma.notification.create({
          data: {
            userEmail: order.email,
            type: "order_delivered",
            title: notifTitle,
            message: notifMessage,
            link: "profile.html#orders",
            icon: "📦"
          }
        });
      } catch (notifErr) {
        console.warn("[Notification] Failed to create delivered notification:", notifErr.message);
      }
    }
    res.json({ success: true, order: formatOrderResponse(order) });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
});

app.post("/api/orders/:id/cancel", requireUserToken, orderCancellationLimiter, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);

    // Verify ownership
    const user = await prisma.user.findUnique({ where: { email: req.userEmail } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } }
    });
    if (!order || order.customerId !== user.id) return res.status(403).json({ error: "Unauthorized" });

    // Only allow cancellation while order.status === "Processing"
    if (order.status !== "Processing") {
      return res.status(400).json({ error: `Cannot cancel order with status '${order.status}'. Only 'Processing' orders can be cancelled.` });
    }

    // Physical check: digital only orders cannot be cancelled once delivered
    const items = order.items || [];
    const isDigitalOnly = items.length > 0 && items.every(i => (i.product && i.product.type === "digital") || i.type === "digital");
    if (isDigitalOnly) {
      return res.status(400).json({ error: "Digital delivery orders cannot be cancelled." });
    }

    // Check if order is COD or Prepaid
    const isCOD = (order.paymentGateway && order.paymentGateway.toLowerCase() === "cod") ||
      (order.paymentId && String(order.paymentId).toUpperCase().startsWith("COD"));
    const shouldFlagRefund = !isCOD && order.paymentStatus === "paid";

    let addressObj = {};
    try {
      addressObj = typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : (order.shippingAddress || {});
    } catch (e) { }

    const updatedHistory = appendOrderStatusHistory(order, "Cancelled");
    addressObj._statusHistory = updatedHistory;

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "Cancelled",
        shippingAddress: JSON.stringify(addressObj),
        refundStatus: shouldFlagRefund ? "Pending Refund" : null
      }
    });
    res.json({
      success: true,
      order: formatOrderResponse(updatedOrder),
      refundFlagged: shouldFlagRefund,
      message: shouldFlagRefund
        ? "Order cancelled. Your refund has been flagged for processing."
        : "Order cancelled successfully."
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ error: "Failed to cancel order" });
  }
});

app.patch("/api/orders/:id/address", orderAddressUpdateLimiter, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    // Authenticate user or admin
    let token = req.cookies?.userToken || req.cookies?.adminToken;
    if (!token && req.headers['authorization']) {
      const authHeader = req.headers['authorization'];
      token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    }
    if (!token || token === 'undefined' || token === 'null') {
      return res.status(401).json({ error: 'Unauthorized: Please log in to your account.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Unauthorized: Token expired or invalid.' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } }
    });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const isAdmin = decoded.role === 'admin' || decoded.username === process.env.ADMIN_USERNAME || decoded.id === 'admin';

    if (!isAdmin) {
      const user = await prisma.user.findUnique({ where: { email: decoded.email } });
      if (!user || order.customerId !== user.id) {
        return res.status(403).json({ error: "Unauthorized: You do not have permission to modify this order." });
      }
    }

    // Status check: strictly ONLY while status === "Processing"
    if (order.status !== "Processing") {
      return res.status(400).json({
        error: `Cannot edit shipping address for order with status '${order.status}'. Address changes are only allowed while the order is 'Processing'.`
      });
    }

    // Digital order check
    const isDigitalOnly = (order.items || []).every(i => (i.product && i.product.type === "digital") || i.type === "digital") && (order.items || []).length > 0;
    if (isDigitalOnly) {
      return res.status(400).json({ error: "Digital delivery orders do not have a shipping address." });
    }

    const newAddress = req.body.address || req.body;
    const validationError = validateShippingAddress(newAddress);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const street = (newAddress.address || newAddress.street || newAddress.flat || '').trim();
    const apartment = (newAddress.apartment || newAddress.landmark || '').trim();
    const city = (newAddress.city || '').trim();
    const state = (newAddress.state || '').trim();
    const pincode = (newAddress.pincode || newAddress.zip || '').trim();
    const country = (newAddress.country || 'India').trim();
    const phone = (newAddress.phone || '').trim();
    const firstName = (newAddress.firstName || (newAddress.fullName ? newAddress.fullName.split(' ')[0] : '') || '').trim();
    const lastName = (newAddress.lastName || (newAddress.fullName ? newAddress.fullName.split(' ').slice(1).join(' ') : '') || '').trim();

    const standardizedAddress = {
      firstName,
      lastName,
      address: street,
      apartment,
      city,
      state,
      pincode,
      country,
      phone
    };

    const fullName = `${firstName} ${lastName}`.trim();
    const updateData = {
      shippingAddress: JSON.stringify(standardizedAddress)
    };
    if (fullName) updateData.guestName = fullName;
    if (phone) updateData.guestPhone = phone;

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: { items: { include: { product: true } } }
    });

    res.json({
      success: true,
      order: updatedOrder,
      message: "Shipping address updated successfully."
    });
  } catch (error) {
    console.error("Error updating order address:", error);
    res.status(500).json({ error: "Failed to update shipping address" });
  }
});

app.post("/api/orders/:id/replace", requireUserToken, async (req, res) => {
  try {
    const { reason, orderItemId } = req.body;
    const orderId = parseInt(req.params.id);

    // Verify ownership
    const user = await prisma.user.findUnique({ where: { email: req.userEmail } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: true }
        }
      }
    });
    if (!order || order.customerId !== user.id) return res.status(403).json({ error: "Unauthorized" });

    // Digital item replacement block: digital items are instantly delivered and non-replaceable
    if (orderItemId) {
      const targetItem = (order.items || []).find(i => i.id === parseInt(orderItemId));
      if (!targetItem) {
        return res.status(404).json({ error: "Order item not found" });
      }
      if (targetItem.product && targetItem.product.type === "digital") {
        return res.status(400).json({ error: "Digital products are not eligible for replacement once delivered." });
      }
    } else {
      const physicalItems = (order.items || []).filter(i => !i.product || i.product.type !== "digital");
      if (physicalItems.length === 0) {
        return res.status(400).json({ error: "Digital products are not eligible for replacement once delivered." });
      }
    }

    // 1. Time Window Check: Must be delivered and within 7 days
    if (!order.deliveredAt) {
      return res.status(400).json({ error: "Replacement isn't valid until the order is delivered." });
    }
    const deliveryTime = new Date(order.deliveredAt).getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - deliveryTime > sevenDaysMs) {
      return res.status(400).json({ error: "Replacement window has expired (7 days from delivery)." });
    }

    // 2. Block re-requests if a replacement is already Requested or Approved
    const whereCondition = {
      orderId,
      status: { in: ["Requested", "Approved"] }
    };
    if (orderItemId) {
      whereCondition.orderItemId = parseInt(orderItemId);
    }
    const existingActive = await prisma.replacementRequest.findFirst({
      where: whereCondition
    });
    if (existingActive) {
      return res.status(409).json({
        error: `A replacement request for this ${orderItemId ? 'item' : 'order'} is already ${existingActive.status.toLowerCase()}. Only rejected requests can be resubmitted.`
      });
    }

    const replacement = await prisma.replacementRequest.create({
      data: {
        orderId,
        orderItemId: orderItemId ? parseInt(orderItemId) : null,
        reason
      }
    });

    // 1. In-app Admin Notification
    const customerDisplayName = order.guestName || user.name || user.username || "Customer";
    try {
      await prisma.notification.create({
        data: {
          userEmail: "suhas_admin",
          type: "replacement_requested",
          title: `Replacement Requested: #${order.orderNumber}`,
          message: `Replacement requested for Order #${order.orderNumber} by ${customerDisplayName}. Reason: ${reason || 'Defective/Damaged'}`,
          link: "admin.html#tab-replacements",
          icon: "🔄"
        }
      });
    } catch (notifErr) {
      console.warn("[Notification] Failed to create in-app notification for replacement:", notifErr.message);
    }

    // 2. Telegram Alert to Admin
    let parsedAddressObj = null;
    try {
      parsedAddressObj = typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : order.shippingAddress;
    } catch (e) { }

    const resolvedCustomerName = order.guestName || user.name || user.username || (parsedAddressObj ? `${parsedAddressObj.firstName || ''} ${parsedAddressObj.lastName || ''}`.trim() : null) || "Customer";
    const resolvedPhone = order.guestPhone || (parsedAddressObj ? parsedAddressObj.phone : null) || "Not provided";
    const formattedAddress = formatShippingAddressText(order.shippingAddress);

    let replacedItemLines = "";
    if (orderItemId) {
      const repItem = (order.items || []).find(i => i.id === parseInt(orderItemId));
      if (repItem) {
        const variantTxt = repItem.variant ? ` (${repItem.variant})` : "";
        replacedItemLines = `1. ${repItem.productName}${variantTxt} x${repItem.quantity || 1} - ₹${repItem.price}`;
      } else {
        replacedItemLines = `1. Item #${orderItemId}`;
      }
    } else {
      replacedItemLines = (order.items && order.items.length > 0)
        ? order.items.map((i, idx) => {
          const variantTxt = i.variant ? ` (${i.variant})` : "";
          return `${idx + 1}. ${i.productName}${variantTxt} x${i.quantity || 1} - ₹${i.price}`;
        }).join("\n")
        : "1. Entire Order";
    }

    const telegramMessage = `🔄 <b>New Replacement Request!</b>\n\n` +
      `<b>Order #:</b> #${order.orderNumber}\n` +
      `<b>Customer:</b> ${resolvedCustomerName}\n` +
      `<b>Phone:</b> ${resolvedPhone}\n` +
      `<b>Email:</b> ${order.email}\n\n` +
      `<b>Shipping Address:</b>\n` +
      `${formattedAddress}\n\n` +
      `<b>Item(s) to Replace:</b>\n` +
      `${replacedItemLines}\n\n` +
      `<b>Reason:</b> ${reason || 'Defective/Damaged'}\n\n` +
      `<b>Action:</b> Review in Admin Console`;

    sendTelegramAlert(telegramMessage).catch(err => {
      console.warn("[Telegram] Replacement alert error:", err.message);
    });

    res.json({ success: true, replacement });
  } catch (error) {
    console.error("Error requesting replacement:", error);
    res.status(500).json({ error: "Failed to request replacement" });
  }
});

app.patch("/api/admin/replacements/:id", requireAdminToken, async (req, res) => {
  try {
    const { status } = req.body;
    const replacementId = parseInt(req.params.id);

    if (status === "Approved") {
      const existingReq = await prisma.replacementRequest.findUnique({
        where: { id: replacementId },
        include: { order: { include: { items: true } } }
      });

      if (existingReq && !existingReq.newOrderId) {
        const orig = existingReq.order;
        const newOrderNumber = "ORD-" + Math.floor(100000 + Math.random() * 900000);

        let itemsToCopy = orig.items;
        if (existingReq.orderItemId) {
          itemsToCopy = orig.items.filter(i => i.id === existingReq.orderItemId);
        }

        const newOrder = await prisma.order.create({
          data: {
            orderNumber: newOrderNumber,
            customerId: orig.customerId,
            guestName: orig.guestName,
            guestEmail: orig.guestEmail,
            guestPhone: orig.guestPhone,
            email: orig.email,
            shippingAddress: orig.shippingAddress,
            status: "Processing",
            paymentStatus: "paid",
            subtotal: 0,
            shipping: 0,
            discount: 0,
            total: 0,
            isReplacementOrder: true,
            items: {
              create: itemsToCopy.map(i => ({
                productId: i.productId,
                productName: i.productName,
                price: 0,
                img: i.img,
                variant: i.variant,
                quantity: i.quantity
              }))
            }
          }
        });

        const replacement = await prisma.replacementRequest.update({
          where: { id: replacementId },
          data: { status, newOrderId: newOrder.id }
        });
        return res.json({ success: true, replacement });
      }
    }

    const replacement = await prisma.replacementRequest.update({
      where: { id: replacementId },
      data: { status }
    });
    res.json({ success: true, replacement });
  } catch (error) {
    console.error("Error updating replacement status:", error);
    res.status(500).json({ error: "Failed to update replacement" });
  }
});

app.get("/api/admin/replacements", requireAdminToken, async (req, res) => {
  try {
    const replacements = await prisma.replacementRequest.findMany({
      include: {
        order: true,
        orderItem: true,
        newOrder: true
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(replacements);
  } catch (error) {
    console.error("Error fetching replacements:", error);
    res.status(500).json({ error: "Failed to fetch replacements" });
  }
});


// ── FAQ Public & Admin Endpoints ─────────────────────────────────────
app.get('/api/faqs', async (req, res) => {
  try {
    const { category, search } = req.query;
    let whereClause = {};

    if (category && category !== 'all') {
      whereClause.category = category;
    }

    if (search && search.trim().length > 0) {
      const q = search.trim();
      whereClause.OR = [
        { question: { contains: q } },
        { answer: { contains: q } }
      ];
    }

    let faqs = await prisma.faq.findMany({
      where: whereClause,
      orderBy: [{ order: 'asc' }, { id: 'asc' }]
    });

    // If database is empty, seed standard 20 FAQs on the fly
    if (faqs.length === 0 && (!category || category === 'all') && !search) {
      await seedInitialFaqs();
      faqs = await prisma.faq.findMany({
        orderBy: [{ order: 'asc' }, { id: 'asc' }]
      });
    }

    res.json(faqs);
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

// Admin Add FAQ
app.post('/api/admin/faqs', requireAdminToken, async (req, res) => {
  try {
    const { question, answer, category, order } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }

    const newFaq = await prisma.faq.create({
      data: {
        question: question.trim(),
        answer: answer.trim(),
        category: category ? category.toLowerCase().trim() : 'general',
        order: parseInt(order) || 0
      }
    });

    res.status(201).json({ success: true, faq: newFaq });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    res.status(500).json({ error: 'Failed to create FAQ' });
  }
});

// Admin Update FAQ
app.put('/api/admin/faqs/:id', requireAdminToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { question, answer, category, order } = req.body;

    const updatedFaq = await prisma.faq.update({
      where: { id },
      data: {
        question: question ? question.trim() : undefined,
        answer: answer ? answer.trim() : undefined,
        category: category ? category.toLowerCase().trim() : undefined,
        order: order !== undefined ? parseInt(order) : undefined
      }
    });

    res.json({ success: true, faq: updatedFaq });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(500).json({ error: 'Failed to update FAQ' });
  }
});

// Admin Delete FAQ
app.delete('/api/admin/faqs/:id', requireAdminToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.faq.delete({
      where: { id }
    });

    res.json({ success: true, message: 'FAQ deleted successfully' });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({ error: 'Failed to delete FAQ' });
  }
});

async function seedInitialFaqs() {
  try {
    const count = await prisma.faq.count();
    if (count > 0) return;

    const initialFaqs = [
      {
        question: "How do I place an order and track its status?",
        answer: "Browse any item in our Store, choose your size or variant, and proceed through Checkout. Once placed, you will receive an instant order confirmation code (e.g. #SW-ORD-...) and can track live status updates anytime on your My Orders dashboard.",
        category: "store",
        order: 1
      },
      {
        question: "What payment methods and currencies are supported?",
        answer: "We support all major payment methods including UPI, Net Banking, Debit/Credit Cards (Visa, MasterCard, RuPay), and international payments via Stripe & PayPal. You can toggle between ₹ INR and $ USD directly in the store header.",
        category: "store",
        order: 2
      },
      {
        question: "How long does shipping take, and is there free shipping?",
        answer: "Standard domestic deliveries arrive within 3–7 business days, and international shipments within 7–14 business days. Free Shipping is automatically applied at checkout for orders above ₹999 (India) or $50 (International). Digital asset downloads have instant access with zero shipping fees.",
        category: "store",
        order: 3
      },
      {
        question: "Can I apply discount coupon codes at checkout?",
        answer: "Yes! During checkout on checkout.html, enter your promotional coupon code (such as launch promotions, community creator codes, or flash sale vouchers) into the promo box and click Apply to instantly recalculate your order total.",
        category: "store",
        order: 4
      },
      {
        question: "How do I cancel or modify my placed order?",
        answer: "If your physical merchandise has not yet entered the fulfillment and dispatch stage, you can request an address update or order cancellation by reaching out promptly to Support or emailing us with your Order ID.",
        category: "store",
        order: 5
      },
      {
        question: "What fabric and sizing are used for SenpaiWorks apparel?",
        answer: "All streetwear pieces are made from 100% Super-Combed French Terry Cotton (240–380 GSM heavyweight) with a pre-shrunk, bio-washed finish in a modern boxy oversized fit. You can open the Size Guide modal on any apparel product page to review exact measurements from S to 2XL.",
        category: "merch",
        order: 6
      },
      {
        question: "Can I exchange or return a physical merchandise item?",
        answer: "Yes, we provide a 7-Day Easy Exchange Policy for size corrections or damaged deliveries. Items must remain unworn with original tags attached. Reach out through our Support Page with your Order ID to initiate an exchange.",
        category: "merch",
        order: 7
      },
      {
        question: "How should I wash and care for my anime streetwear tees and hoodies?",
        answer: "To preserve high-density screenprints, embroidery, and premium cotton feel: machine wash cold inside-out on gentle cycle with mild detergent. Do not iron directly over printed graphics, and tumble dry on low or line dry in the shade.",
        category: "merch",
        order: 8
      },
      {
        question: "How do 3D model and character rig downloads work?",
        answer: "Purchased 3D assets are available for instant download immediately upon order completion and saved under your profile. Files include production-ready .blend, .fbx, and .obj packages with full IK/FK deformation rigs, facial shape keys, and 4K textures optimized for Blender 3.6+ and 4.x.",
        category: "assets",
        order: 9
      },
      {
        question: "Can I use purchased 3D models in commercial games or animations?",
        answer: "Yes, assets marked with a Commercial License can be integrated into indie games, VTuber avatars, client projects, and animations. Standard licenses cover non-commercial portfolio and practice reels. Raw geometry and rig redistribution or reselling is strictly forbidden.",
        category: "assets",
        order: 10
      },
      {
        question: "Are your 3D character models compatible with Unreal Engine or Unity?",
        answer: "Yes! While authored natively in Blender, each pack includes clean .fbx exports with human-standard bone hierarchies compatible with Unreal Engine's Manny/Quinn retargeting rigs and Unity's Humanoid Mecanim animation avatar system.",
        category: "assets",
        order: 11
      },
      {
        question: "What if I encounter an issue opening or unzipping the 3D model files?",
        answer: "All download archives are packaged as standard .zip files. If a download is interrupted or corrupted, you can re-download it from your order confirmation or message Support for a direct fresh archive link.",
        category: "assets",
        order: 12
      },
      {
        question: "How does the notifications system work?",
        answer: "The notification bell in the header alerts you in real time about order shipment progress, limited merchandise drop announcements, flash discounts, and interactions on your reviews.",
        category: "account",
        order: 13
      },
      {
        question: "How do I log in or update my profile details and shipping addresses?",
        answer: "Sign in using your Email/Password or one-click Google OAuth. Go to My Profile to update your display username, bio, creator avatar, and default shipping addresses for fast 1-click checkout.",
        category: "account",
        order: 14
      },
      {
        question: "How do I write or edit customer reviews on store products?",
        answer: "On any product page in store-detail.html, scroll down to the Customer Reviews section and click Write a Review. You can rate the product from 1 to 5 stars, leave detailed feedback, and see live aggregate ratings updated instantly.",
        category: "account",
        order: 15
      },
      {
        question: "What is SenpaiWorks and who creates the content?",
        answer: "SenpaiWorks is an independent anime lab and creative platform founded by Suhas, a B.Tech graduate from PES University, Bengaluru. It brings together solo 2D/3D character design, animation pipelines, and full-stack software development. Read the full story on our About Page.",
        category: "general",
        order: 16
      },
      {
        question: "Can I download 2D artwork for personal wallpapers?",
        answer: "Yes! High-resolution artworks across our 2D Art Library are free to download and set as phone/desktop wallpapers or social icons for personal use.",
        category: "general",
        order: 17
      },
      {
        question: "Do you accept custom 3D commissions or client projects?",
        answer: "Yes! We take on select client commissions for custom 3D anime character sculpts, rigging, game assets, and animations. You can get in touch through our Contact Page or by emailing senpaiworks.official@gmail.com.",
        category: "general",
        order: 18
      },
      {
        question: "Are there any free tutorials or breakdown articles available?",
        answer: "Yes! Check our Learn section and News & Articles for free breakdowns on Blender NPR shading, character topology, cloth simulations, and studio production pipelines.",
        category: "general",
        order: 19
      },
      {
        question: "How can I join the SenpaiWorks creator community?",
        answer: "Join our Discord server and follow us on Instagram or YouTube to participate in art challenges, work-in-progress streams, and collaborative projects on our Community Page.",
        category: "general",
        order: 20
      }
    ];

    for (const item of initialFaqs) {
      await prisma.faq.create({ data: item });
    }
    console.log('Seeded 20 initial FAQs into SQLite database.');
  } catch (err) {
    console.error('Error seeding FAQs:', err);
  }
}

// =========================================================================
// COURSES API
// =========================================================================

// Helper: parse JSON field safely
function safeJsonParse(val, fallback = []) {
  try { return val ? JSON.parse(val) : fallback; } catch { return fallback; }
}

// Helper: serialize all JSON fields for a course response
function serializeCourse(c) {
  return {
    ...c,
    whatYouWillLearn: safeJsonParse(c.whatYouWillLearn, []),
    relatedTopics: safeJsonParse(c.relatedTopics, []),
    requirements: safeJsonParse(c.requirements, []),
    curriculum: safeJsonParse(c.curriculum, [])
  };
}

// Public: Get all published courses (for learn page)
app.get('/api/courses', async (req, res) => {
  try {
    let courses = await prisma.course.findMany({
      where: { published: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
    });

    // Seed default courses if table is empty
    if (courses.length === 0) {
      await seedInitialCourses();
      courses = await prisma.course.findMany({
        where: { published: true },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
      });
    }

    res.json(courses.map(serializeCourse));
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Public: Get single course by slug or UUID (for course-detail page)
app.get('/api/courses/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;

    // Try slug first, then fall back to UUID
    let course = await prisma.course.findFirst({
      where: { slug: idOrSlug, published: true }
    });

    if (!course) {
      // Try by UUID id
      course = await prisma.course.findFirst({
        where: { id: idOrSlug, published: true }
      });
    }

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(serializeCourse(course));
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// Admin: Get ALL courses (including unpublished)
app.get('/api/admin/courses', requireAdminToken, async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
    });
    res.json(courses.map(serializeCourse));
  } catch (error) {
    console.error('Error fetching admin courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Admin: Create course
app.post('/api/admin/courses', requireAdminToken, async (req, res) => {
  try {
    const {
      slug, title, subtitle, tag, description, badge, status,
      authorName, authorAvatar, releaseDate, thumbnail, videoUrl,
      rating, ratingCount, learnersCount,
      price, originalPrice, discount, monthlyPrice, originalMonthlyPrice,
      whatYouWillLearn, relatedTopics, requirements, curriculum,
      order, published
    } = req.body;

    if (!title) return res.status(400).json({ error: 'Title is required' });

    const course = await prisma.course.create({
      data: {
        slug: slug ? slug.trim().toLowerCase() : '',
        title: title.trim(),
        subtitle: subtitle ? subtitle.trim() : '',
        tag: tag ? tag.trim() : '',
        description: description ? description.trim() : '',
        badge: badge ? badge.trim() : '',
        status: status || 'In Planning',
        authorName: authorName ? authorName.trim() : 'SenpaiWorks Studio',
        authorAvatar: authorAvatar ? authorAvatar.trim() : 'assets/SenpaiWorks logo bg.png',
        releaseDate: releaseDate ? releaseDate.trim() : '',
        thumbnail: thumbnail ? thumbnail.trim() : '',
        videoUrl: videoUrl ? videoUrl.trim() : '',
        rating: rating ? String(rating) : '4.9',
        ratingCount: ratingCount ? ratingCount.trim() : '(0 ratings)',
        learnersCount: learnersCount ? String(learnersCount) : '0',
        price: price ? price.trim() : '',
        originalPrice: originalPrice ? originalPrice.trim() : '',
        discount: discount ? discount.trim() : '',
        monthlyPrice: monthlyPrice ? monthlyPrice.trim() : '',
        originalMonthlyPrice: originalMonthlyPrice ? originalMonthlyPrice.trim() : '',
        whatYouWillLearn: Array.isArray(whatYouWillLearn) ? JSON.stringify(whatYouWillLearn) : (whatYouWillLearn || '[]'),
        relatedTopics: Array.isArray(relatedTopics) ? JSON.stringify(relatedTopics) : (relatedTopics || '[]'),
        requirements: Array.isArray(requirements) ? JSON.stringify(requirements) : (requirements || '[]'),
        curriculum: Array.isArray(curriculum) ? JSON.stringify(curriculum) : (curriculum || '[]'),
        order: parseInt(order) || 0,
        published: published !== undefined ? Boolean(published) : true
      }
    });

    res.status(201).json({ success: true, course: serializeCourse(course) });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// Admin: Update course
app.put('/api/admin/courses/:id', requireAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      slug, title, subtitle, tag, description, badge, status,
      authorName, authorAvatar, releaseDate, thumbnail, videoUrl,
      rating, ratingCount, learnersCount,
      price, originalPrice, discount, monthlyPrice, originalMonthlyPrice,
      whatYouWillLearn, relatedTopics, requirements, curriculum,
      order, published
    } = req.body;

    const updateData = {};
    if (slug !== undefined) updateData.slug = slug.trim().toLowerCase();
    if (title !== undefined) updateData.title = title.trim();
    if (subtitle !== undefined) updateData.subtitle = subtitle.trim();
    if (tag !== undefined) updateData.tag = tag.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (badge !== undefined) updateData.badge = badge.trim();
    if (status !== undefined) updateData.status = status;
    if (authorName !== undefined) updateData.authorName = authorName.trim();
    if (authorAvatar !== undefined) updateData.authorAvatar = authorAvatar.trim();
    if (releaseDate !== undefined) updateData.releaseDate = releaseDate.trim();
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail.trim();
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl.trim();
    if (rating !== undefined) updateData.rating = String(rating);
    if (ratingCount !== undefined) updateData.ratingCount = ratingCount.trim();
    if (learnersCount !== undefined) updateData.learnersCount = String(learnersCount);
    if (price !== undefined) updateData.price = price.trim();
    if (originalPrice !== undefined) updateData.originalPrice = originalPrice.trim();
    if (discount !== undefined) updateData.discount = discount.trim();
    if (monthlyPrice !== undefined) updateData.monthlyPrice = monthlyPrice.trim();
    if (originalMonthlyPrice !== undefined) updateData.originalMonthlyPrice = originalMonthlyPrice.trim();
    if (whatYouWillLearn !== undefined) updateData.whatYouWillLearn = Array.isArray(whatYouWillLearn) ? JSON.stringify(whatYouWillLearn) : whatYouWillLearn;
    if (relatedTopics !== undefined) updateData.relatedTopics = Array.isArray(relatedTopics) ? JSON.stringify(relatedTopics) : relatedTopics;
    if (requirements !== undefined) updateData.requirements = Array.isArray(requirements) ? JSON.stringify(requirements) : requirements;
    if (curriculum !== undefined) updateData.curriculum = Array.isArray(curriculum) ? JSON.stringify(curriculum) : curriculum;
    if (order !== undefined) updateData.order = parseInt(order);
    if (published !== undefined) updateData.published = Boolean(published);

    const course = await prisma.course.update({ where: { id }, data: updateData });
    res.json({ success: true, course: serializeCourse(course) });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// Admin: Delete course
app.delete('/api/admin/courses/:id', requireAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.course.delete({ where: { id } });
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// =========================================================================
// NEWS & ARTICLES API (PUBLIC & ADMIN)
// =========================================================================

// Public: Get all news articles (supports ?category=... & ?featured=true & ?search=...)
app.get('/api/news', async (req, res) => {
  try {
    const { category, featured, search, limit } = req.query;
    const where = { deletedAt: null };
    if (category) where.category = category;
    if (featured === 'true') where.isFeatured = true;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { summary: { contains: search } },
        { category: { contains: search } }
      ];
    }
    const articles = await prisma.newsArticle.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      take: limit ? parseInt(limit, 10) : undefined
    });
    res.json(articles);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news articles' });
  }
});

// Public: Get featured news structured specifically for the Home Page
app.get('/api/news/featured', async (req, res) => {
  try {
    const allFeatured = await prisma.newsArticle.findMany({
      where: { deletedAt: null },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }]
    });

    if (allFeatured.length === 0) {
      return res.json({ mainFeature: null, recommended: null, listItems: [] });
    }

    // 1. Main feature (explicit placement or first featured article)
    let mainFeature = allFeatured.find(a => a.placement === 'main_feature');
    if (!mainFeature) mainFeature = allFeatured.find(a => a.isFeatured) || allFeatured[0];

    // 2. Recommended wide card (explicit placement or next available article)
    let recommended = allFeatured.find(a => a.placement === 'recommended' && a.id !== mainFeature?.id);
    if (!recommended) recommended = allFeatured.find(a => a.id !== mainFeature?.id);

    // 3. Recommended list items (3 items)
    const usedIds = new Set([mainFeature?.id, recommended?.id].filter(Boolean));
    let listItems = allFeatured.filter(a => a.placement === 'list' && !usedIds.has(a.id));
    if (listItems.length < 3) {
      const remaining = allFeatured.filter(a => !usedIds.has(a.id) && !listItems.some(l => l.id === a.id));
      listItems = listItems.concat(remaining).slice(0, 3);
    } else {
      listItems = listItems.slice(0, 3);
    }

    res.json({ mainFeature, recommended, listItems });
  } catch (error) {
    console.error('Error fetching featured news:', error);
    res.status(500).json({ error: 'Failed to fetch featured news' });
  }
});

// Public: Get single news article by ID
app.get('/api/news/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let article = await prisma.newsArticle.findUnique({ where: { id } });
    if (!article || article.deletedAt) {
      return res.status(404).json({ error: 'Article not found' });
    }
    // Increment view count asynchronously
    prisma.newsArticle.update({
      where: { id },
      data: { views: { increment: 1 } }
    }).catch(() => { });

    res.json(article);
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

// Admin: Get all news articles
app.get('/api/admin/news', requireAdminToken, async (req, res) => {
  try {
    const articles = await prisma.newsArticle.findMany({
      where: { deletedAt: null },
      orderBy: [{ createdAt: 'desc' }]
    });
    res.json(articles);

  } catch (error) {
    console.error('Error fetching admin news:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// Admin: Create news article
app.post('/api/admin/news', requireAdminToken, async (req, res) => {
  try {
    const {
      title, category, author, date, readTime,
      img, summary, content, isFeatured, placement, hashtags
    } = req.body;

    if (!title || !category) {
      return res.status(400).json({ error: 'Title and Category are required.' });
    }

    const article = await prisma.newsArticle.create({
      data: {
        title,
        category,
        author: author || 'Team SenpaiWorks',
        date: date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        readTime: readTime || '5 mins read',
        img: img || 'assets/news page assets/news slide photoshoped.png',
        summary: summary || '',
        content: content || '',
        isFeatured: Boolean(isFeatured),
        placement: placement || 'standard',
        hashtags: hashtags || ''
      }
    });

    res.status(201).json({ success: true, article });
  } catch (error) {
    console.error('Error creating news article:', error);
    res.status(500).json({ error: 'Failed to create news article' });
  }
});

// Admin: Update news article
app.put('/api/admin/news/:id', requireAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, category, author, date, readTime,
      img, summary, content, isFeatured, placement, hashtags
    } = req.body;

    const data = {};
    if (title !== undefined) data.title = title;
    if (category !== undefined) data.category = category;
    if (author !== undefined) data.author = author;
    if (date !== undefined) data.date = date;
    if (readTime !== undefined) data.readTime = readTime;
    if (img !== undefined) data.img = img;
    if (summary !== undefined) data.summary = summary;
    if (content !== undefined) data.content = content;
    if (isFeatured !== undefined) data.isFeatured = Boolean(isFeatured);
    if (placement !== undefined) data.placement = placement;
    if (hashtags !== undefined) data.hashtags = hashtags;

    const article = await prisma.newsArticle.update({
      where: { id },
      data
    });

    res.json({ success: true, article });
  } catch (error) {
    console.error('Error updating news article:', error);
    res.status(500).json({ error: 'Failed to update news article' });
  }
});

// Admin: Quick toggle featured status
app.patch('/api/admin/news/:id/feature', requireAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const current = await prisma.newsArticle.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ error: 'Article not found' });

    const article = await prisma.newsArticle.update({
      where: { id },
      data: { isFeatured: !current.isFeatured }
    });

    res.json({ success: true, isFeatured: article.isFeatured });
  } catch (error) {
    console.error('Error toggling featured status:', error);
    res.status(500).json({ error: 'Failed to toggle featured status' });
  }
});

// Admin: Soft Delete news article (Moves image to R2 trash/ with 14-day grace period)
app.delete('/api/admin/news/:id', requireAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const article = await prisma.newsArticle.findUnique({ where: { id } });
    if (!article) return res.status(404).json({ error: 'Article not found' });

    let trashedImgUrl = article.img;
    const { moveToTrash } = require('./utils/r2upload');
    const r2Domain = (process.env.R2_PUBLIC_URL || 'r2.dev').replace(/\/$/, '');

    if (article.img && (article.img.includes(r2Domain) || article.img.includes('r2.dev'))) {
      try {
        const moveRes = await moveToTrash(article.img);
        if (moveRes) trashedImgUrl = moveRes.trashUrl;
      } catch (err) {
        console.warn('[Trash] Could not move news image to trash:', err.message);
      }
    }

    await prisma.newsArticle.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        img: trashedImgUrl,
        trashMeta: JSON.stringify({
          originalImg: article.img,
          deletedAt: new Date().toISOString()
        })
      }
    });

    res.json({
      success: true,
      message: 'Article moved to trash (14-day recovery window before auto-purge)',
      deletedAt: new Date()
    });
  } catch (error) {
    console.error('Error soft-deleting news article:', error);
    res.status(500).json({ error: 'Failed to delete news article' });
  }
});


// =========================================================================
// HOMEPAGE MANAGER API (PUBLIC & ADMIN)
// =========================================================================

// Public: Get published hero slides
app.get('/api/homepage/hero-slides', async (req, res) => {
  try {
    const slides = await prisma.homeHeroSlide.findMany({
      where: { published: true, deletedAt: null },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
    });
    res.json(slides);
  } catch (error) {
    console.error('Error fetching hero slides:', error);
    res.status(500).json({ error: 'Failed to fetch hero slides' });
  }
});

// Public: Get published showcase items (by section)
app.get('/api/homepage/showcase-items', async (req, res) => {
  try {
    const { section } = req.query;
    const where = { published: true, deletedAt: null };
    if (section) where.section = section;

    const items = await prisma.homeShowcaseItem.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
    });
    res.json(items);
  } catch (error) {
    console.error('Error fetching showcase items:', error);
    res.status(500).json({ error: 'Failed to fetch showcase items' });
  }
});

// Admin: Get all hero slides (including unpublished, excluding trashed)
app.get('/api/admin/homepage/hero-slides', requireAdminToken, async (req, res) => {
  try {
    const slides = await prisma.homeHeroSlide.findMany({
      where: { deletedAt: null },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
    });
    res.json(slides);
  } catch (error) {
    console.error('Error fetching admin hero slides:', error);
    res.status(500).json({ error: 'Failed to fetch hero slides' });
  }
});

// Admin: Create hero slide
app.post('/api/admin/homepage/hero-slides', requireAdminToken, async (req, res) => {
  try {
    const {
      spotlight, title, description, bgType, bgUrl,
      primaryBtnText, primaryBtnLink, secondaryBtnText, secondaryBtnLink,
      order, published
    } = req.body;

    if (!title || !bgUrl) {
      return res.status(400).json({ error: 'Title and Background URL are required.' });
    }

    const slide = await prisma.homeHeroSlide.create({
      data: {
        spotlight: spotlight || '#1 Spotlight',
        title,
        description: description || '',
        bgType: bgType || 'image',
        bgUrl,
        primaryBtnText: primaryBtnText !== undefined ? primaryBtnText : 'Watch Now',
        primaryBtnLink: primaryBtnLink || '',
        secondaryBtnText: secondaryBtnText !== undefined ? secondaryBtnText : 'Details',
        secondaryBtnLink: secondaryBtnLink || '',
        order: order !== undefined ? parseInt(order, 10) : 0,
        published: published !== undefined ? Boolean(published) : true
      }
    });

    res.status(201).json({ success: true, slide });
  } catch (error) {
    console.error('Error creating hero slide:', error);
    res.status(500).json({ error: 'Failed to create hero slide' });
  }
});

// Admin: Update hero slide
app.put('/api/admin/homepage/hero-slides/:id', requireAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      spotlight, title, description, bgType, bgUrl,
      primaryBtnText, primaryBtnLink, secondaryBtnText, secondaryBtnLink,
      order, published
    } = req.body;

    const data = {};
    if (spotlight !== undefined) data.spotlight = spotlight;
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (bgType !== undefined) data.bgType = bgType;
    if (bgUrl !== undefined) data.bgUrl = bgUrl;
    if (primaryBtnText !== undefined) data.primaryBtnText = primaryBtnText;
    if (primaryBtnLink !== undefined) data.primaryBtnLink = primaryBtnLink;
    if (secondaryBtnText !== undefined) data.secondaryBtnText = secondaryBtnText;
    if (secondaryBtnLink !== undefined) data.secondaryBtnLink = secondaryBtnLink;
    if (order !== undefined) data.order = parseInt(order, 10);
    if (published !== undefined) data.published = Boolean(published);

    const slide = await prisma.homeHeroSlide.update({
      where: { id },
      data
    });

    res.json({ success: true, slide });
  } catch (error) {
    console.error('Error updating hero slide:', error);
    res.status(500).json({ error: 'Failed to update hero slide' });
  }
});

// Admin: Soft Delete hero slide (Moves media to R2 trash/ with 14-day grace period)
app.delete('/api/admin/homepage/hero-slides/:id', requireAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const slide = await prisma.homeHeroSlide.findUnique({ where: { id } });
    if (!slide) return res.status(404).json({ error: 'Hero slide not found' });

    let trashedBgUrl = slide.bgUrl;
    const { moveToTrash } = require('./utils/r2upload');
    const r2Domain = (process.env.R2_PUBLIC_URL || 'r2.dev').replace(/\/$/, '');

    if (slide.bgUrl && (slide.bgUrl.includes(r2Domain) || slide.bgUrl.includes('r2.dev'))) {
      try {
        const moveRes = await moveToTrash(slide.bgUrl);
        if (moveRes) trashedBgUrl = moveRes.trashUrl;
      } catch (err) {
        console.warn('[Trash] Could not move hero media to trash:', err.message);
      }
    }

    await prisma.homeHeroSlide.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        bgUrl: trashedBgUrl,
        trashMeta: JSON.stringify({
          originalBgUrl: slide.bgUrl,
          deletedAt: new Date().toISOString()
        })
      }
    });

    res.json({
      success: true,
      message: 'Hero slide moved to trash (14-day recovery window before auto-purge)',
      deletedAt: new Date()
    });
  } catch (error) {
    console.error('Error soft-deleting hero slide:', error);
    res.status(500).json({ error: 'Failed to delete hero slide' });
  }
});


// Admin: Get all showcase items (excluding trashed)
app.get('/api/admin/homepage/showcase-items', requireAdminToken, async (req, res) => {
  try {
    const items = await prisma.homeShowcaseItem.findMany({
      where: { deletedAt: null },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }]
    });
    res.json(items);
  } catch (error) {
    console.error('Error fetching admin showcase items:', error);
    res.status(500).json({ error: 'Failed to fetch showcase items' });
  }
});

// Admin: Create showcase item
app.post('/api/admin/homepage/showcase-items', requireAdminToken, async (req, res) => {
  try {
    const {
      section, title, subtitle, description, imageUrl, linkUrl, btnText, order, published
    } = req.body;

    if (!title || !imageUrl) {
      return res.status(400).json({ error: 'Title and Image URL are required.' });
    }

    const item = await prisma.homeShowcaseItem.create({
      data: {
        section: section || 'things_you_might_like',
        title,
        subtitle: subtitle || '',
        description: description || '',
        imageUrl,
        linkUrl: linkUrl || '',
        btnText: btnText || 'Explore',
        order: order !== undefined ? parseInt(order, 10) : 0,
        published: published !== undefined ? Boolean(published) : true
      }
    });

    res.status(201).json({ success: true, item });
  } catch (error) {
    console.error('Error creating showcase item:', error);
    res.status(500).json({ error: 'Failed to create showcase item' });
  }
});

// Admin: Update showcase item
app.put('/api/admin/homepage/showcase-items/:id', requireAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      section, title, subtitle, description, imageUrl, linkUrl, btnText, order, published
    } = req.body;

    const data = {};
    if (section !== undefined) data.section = section;
    if (title !== undefined) data.title = title;
    if (subtitle !== undefined) data.subtitle = subtitle;
    if (description !== undefined) data.description = description;
    if (imageUrl !== undefined) data.imageUrl = imageUrl;
    if (linkUrl !== undefined) data.linkUrl = linkUrl;
    if (btnText !== undefined) data.btnText = btnText;
    if (order !== undefined) data.order = parseInt(order, 10);
    if (published !== undefined) data.published = Boolean(published);

    const item = await prisma.homeShowcaseItem.update({
      where: { id },
      data
    });

    res.json({ success: true, item });
  } catch (error) {
    console.error('Error updating showcase item:', error);
    res.status(500).json({ error: 'Failed to update showcase item' });
  }
});

// Admin: Soft Delete showcase item (Moves image to R2 trash/ with 14-day grace period)
app.delete('/api/admin/homepage/showcase-items/:id', requireAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const item = await prisma.homeShowcaseItem.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: 'Showcase item not found' });

    let trashedImgUrl = item.imageUrl;
    const { moveToTrash } = require('./utils/r2upload');
    const r2Domain = (process.env.R2_PUBLIC_URL || 'r2.dev').replace(/\/$/, '');

    if (item.imageUrl && (item.imageUrl.includes(r2Domain) || item.imageUrl.includes('r2.dev'))) {
      try {
        const moveRes = await moveToTrash(item.imageUrl);
        if (moveRes) trashedImgUrl = moveRes.trashUrl;
      } catch (err) {
        console.warn('[Trash] Could not move showcase image to trash:', err.message);
      }
    }

    await prisma.homeShowcaseItem.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        imageUrl: trashedImgUrl,
        trashMeta: JSON.stringify({
          originalImageUrl: item.imageUrl,
          deletedAt: new Date().toISOString()
        })
      }
    });

    res.json({
      success: true,
      message: 'Showcase item moved to trash (14-day recovery window before auto-purge)',
      deletedAt: new Date()
    });
  } catch (error) {
    console.error('Error soft-deleting showcase item:', error);
    res.status(500).json({ error: 'Failed to delete showcase item' });
  }
});


// =========================================================================
// HOMEPAGE MERCHANDISE SPOTLIGHT & AUTO-RANKING
// =========================================================================
let merchSpotlightCache = {
  data: null,
  expiresAt: 0
};

function invalidateMerchSpotlightCache() {
  merchSpotlightCache = { data: null, expiresAt: 0 };
}

async function computeMerchSpotlightData() {
  // 1. Check for manual override in HomeShowcaseItem
  const overrideRecord = await prisma.homeShowcaseItem.findFirst({
    where: { section: 'merch_spotlight_override', published: true }
  });
  const overrideProductId = overrideRecord?.linkUrl || null;

  // 2. Fetch all physical & available products
  let physicalProds = await prisma.product.findMany({
    where: { type: 'physical', available: true }
  });

  if (physicalProds.length === 0) {
    physicalProds = await prisma.product.findMany({
      where: { available: true }
    });
  }

  // 3. Score calculation: Rating * log10(ratingCount + 2)
  // Ties: CreatedAt DESC (newest first), then Name ASC
  const scoredProducts = physicalProds.map(p => {
    const rating = typeof p.rating === 'number' ? p.rating : parseFloat(p.rating) || 5.0;
    const ratingCount = typeof p.ratingCount === 'number' ? p.ratingCount : parseInt(p.ratingCount, 10) || 0;
    const score = ratingCount > 0 ? rating * Math.log10(ratingCount + 2) : 0;
    return {
      ...p,
      computedRating: rating,
      computedRatingCount: ratingCount,
      popularityScore: Number(score.toFixed(4))
    };
  });

  scoredProducts.sort((a, b) => {
    if (Math.abs(b.popularityScore - a.popularityScore) > 0.0001) {
      return b.popularityScore - a.popularityScore;
    }
    const timeA = new Date(a.createdAt).getTime() || 0;
    const timeB = new Date(b.createdAt).getTime() || 0;
    if (timeB !== timeA) {
      return timeB - timeA;
    }
    return (a.name || '').localeCompare(b.name || '');
  });

  // 4. Resolve Spotlight winner
  let spotlightProduct = null;
  let isOverrideActive = false;

  if (overrideProductId) {
    const foundOverride = scoredProducts.find(p => p.id === overrideProductId);
    if (foundOverride) {
      spotlightProduct = foundOverride;
      isOverrideActive = true;
    }
  }

  if (!spotlightProduct && scoredProducts.length > 0) {
    spotlightProduct = scoredProducts[0];
    isOverrideActive = false;
  }

  // 5. Resolve 6 Grid items (strictly excluding spotlight winner)
  const gridProducts = scoredProducts
    .filter(p => spotlightProduct ? p.id !== spotlightProduct.id : true)
    .slice(0, 6);

  if (gridProducts.length < 6) {
    const existingIds = new Set([
      ...(spotlightProduct ? [spotlightProduct.id] : []),
      ...gridProducts.map(p => p.id)
    ]);
    const fillers = scoredProducts.filter(p => !existingIds.has(p.id));
    for (const f of fillers) {
      if (gridProducts.length >= 6) break;
      gridProducts.push(f);
    }
  }

  const formattedGridProducts = gridProducts.map(p => ({
    ...p,
    score: p.popularityScore
  }));

  let rankingReason = '';
  if (isOverrideActive) {
    rankingReason = 'Manually Featured by Admin';
  } else if (spotlightProduct && spotlightProduct.computedRatingCount > 0) {
    rankingReason = `★ ${spotlightProduct.computedRating} Community Favorite (${spotlightProduct.computedRatingCount} reviews)`;
  } else if (spotlightProduct) {
    rankingReason = 'Newest Catalog Addition (Fresh Drop)';
  }

  const spotlightData = spotlightProduct ? {
    ...spotlightProduct,
    score: spotlightProduct.popularityScore,
    rankingReason,
    isOverride: isOverrideActive
  } : null;

  return {
    spotlight: spotlightData,
    grid: formattedGridProducts,
    isOverride: isOverrideActive,
    overrideProductId: isOverrideActive ? overrideProductId : null,
    rankingLeaderboard: scoredProducts.map((p, idx) => ({
      rank: idx + 1,
      id: p.id,
      name: p.name,
      rating: p.computedRating,
      ratingCount: p.computedRatingCount,
      score: p.popularityScore,
      price: p.price,
      badge: p.badge,
      img: p.img,
      category: p.category,
      isSpotlight: spotlightProduct ? p.id === spotlightProduct.id : false,
      isInGrid: gridProducts.some(g => g.id === p.id)
    })),
    meta: {
      totalEligible: scoredProducts.length,
      rankingFormula: 'rating * log10(ratingCount + 2)',
      cacheTtlMs: 60000,
      generatedAt: new Date().toISOString()
    }
  };
}

// Public: Get automated or overridden merchandise spotlight
app.get('/api/homepage/merch-spotlight', async (req, res) => {
  const now = Date.now();
  if (merchSpotlightCache.data && merchSpotlightCache.expiresAt > now) {
    return res.json(merchSpotlightCache.data);
  }

  try {
    const data = await computeMerchSpotlightData();
    merchSpotlightCache = {
      data,
      expiresAt: now + 60000
    };
    res.json(data);
  } catch (error) {
    console.error('Error computing merch spotlight:', error);
    res.status(500).json({ error: 'Failed to compute merchandise spotlight' });
  }
});

// Admin: Get merch spotlight ranking leaderboard and override details
app.get('/api/admin/homepage/merch-spotlight', requireAdminToken, async (req, res) => {
  try {
    const data = await computeMerchSpotlightData();
    res.json(data);
  } catch (error) {
    console.error('Error fetching admin merch spotlight:', error);
    res.status(500).json({ error: 'Failed to fetch admin merchandise spotlight' });
  }
});

// Admin: Set or clear spotlight override
app.put('/api/admin/homepage/merch-spotlight/override', requireAdminToken, async (req, res) => {
  try {
    const { productId } = req.body;

    let existingRecord = await prisma.homeShowcaseItem.findFirst({
      where: { section: 'merch_spotlight_override' }
    });

    if (!productId) {
      // Clear override -> revert to automatic ranking
      if (existingRecord) {
        await prisma.homeShowcaseItem.update({
          where: { id: existingRecord.id },
          data: { published: false, linkUrl: '' }
        });
      }
    } else {
      // Verify product exists
      const targetProduct = await prisma.product.findUnique({ where: { id: productId } });
      if (!targetProduct) {
        return res.status(404).json({ error: 'Selected product does not exist' });
      }

      if (existingRecord) {
        await prisma.homeShowcaseItem.update({
          where: { id: existingRecord.id },
          data: {
            title: `Spotlight Override: ${targetProduct.name}`,
            linkUrl: targetProduct.id,
            published: true
          }
        });
      } else {
        await prisma.homeShowcaseItem.create({
          data: {
            id: 'merch-spotlight-override-record',
            section: 'merch_spotlight_override',
            title: `Spotlight Override: ${targetProduct.name}`,
            linkUrl: targetProduct.id,
            imageUrl: targetProduct.img || '',
            published: true
          }
        });
      }
    }

    invalidateMerchSpotlightCache();
    const updatedData = await computeMerchSpotlightData();
    res.json({
      success: true,
      message: productId ? 'Spotlight override applied' : 'Spotlight reset to automatic ranking',
      data: updatedData
    });
  } catch (error) {
    console.error('Error updating spotlight override:', error);
    res.status(500).json({ error: 'Failed to update spotlight override' });
  }
});

async function seedInitialCourses() {
  try {
    const count = await prisma.course.count();

    const defaults = [
      {
        slug: 'zbrush',
        title: 'ZBrush Character Sculpting: Sculpt Anime Characters from Scratch',
        subtitle: 'Learn anatomy, facial features, hair sculpting, and secondary detail pass for 3D anime characters',
        tag: '3D Digital Sculpting',
        description: 'Master ZBrush digital clay tools, high-poly facial anatomy, stylized anime hair sculpting, and secondary detail pass.',
        badge: 'Bestseller',
        status: 'In Production',
        authorName: 'SenpaiWorks Studio',
        authorAvatar: 'assets/SenpaiWorks logo bg.png',
        releaseDate: 'Release 2026',
        thumbnail: 'assets/courses/zbrush-course.png',
        videoUrl: 'https://www.youtube.com/embed/SsoV6Mdjr6A',
        rating: '4.9',
        ratingCount: '(1,004 ratings)',
        learnersCount: '5,892',
        price: '₹489.00',
        originalPrice: '₹3,199.00',
        discount: '84% off',
        monthlyPrice: '₹375.00',
        originalMonthlyPrice: '₹500.00',
        whatYouWillLearn: JSON.stringify([
          'Anatomy and forms of human head and face for anime styling',
          'Sculpting anime head from sphere with digital clay techniques',
          'Creating stylized anime hair using custom ZBrush curves',
          'Secondary detail pass, facial planes, and polypainting'
        ]),
        relatedTopics: JSON.stringify(['3D Sculpting', 'Anatomy', 'ZBrush', '3D & Animation', 'Character Design']),
        requirements: JSON.stringify([
          'Basic understanding of ZBrush interface navigation.',
          'A graphics tablet or pen display is recommended for pressure sensitivity.',
          'No prior anatomical expertise required—we start from zero!'
        ]),
        curriculum: JSON.stringify([
          {
            sectionTitle: 'Section 1: Introduction to ZBrush & Anime Proportions',
            metaSummary: '3 lectures • 1h 45m',
            lectures: [
              { name: '01. Interface Setup & Custom Brush Configuration', duration: '12:15', isPreview: true },
              { name: '02. Anime Head Planes & Facial Proportions', duration: '38:50', isPreview: true },
              { name: '03. Base Mesh Sculpting from Sphere', duration: '54:10', isPreview: false }
            ]
          },
          {
            sectionTitle: 'Section 2: Facial Features & Eye Sculpting',
            metaSummary: '4 lectures • 2h 30m',
            lectures: [
              { name: '04. Anime Eye Socket & Iris Sculpting', duration: '35:44', isPreview: true },
              { name: '05. Nose & Mouth Stylization', duration: '44:33', isPreview: false },
              { name: '06. Ear Anatomy & Stylized Folds', duration: '37:22', isPreview: false },
              { name: '07. Secondary Detail Pass & Smooth Polish', duration: '32:10', isPreview: false }
            ]
          },
          {
            sectionTitle: 'Section 3: Anime Hair Sculpting with Curves',
            metaSummary: '3 lectures • 2h 15m',
            lectures: [
              { name: '08. Hair Blockout Strategy & Primary Shapes', duration: '47:48', isPreview: false },
              { name: '09. Creating Hair Strands with Curve Brushes', duration: '48:43', isPreview: false },
              { name: '10. Sharp Anime Tips & Flow Adjustment', duration: '38:47', isPreview: false }
            ]
          },
          {
            sectionTitle: 'Section 4: Polypainting & Mesh Preparation',
            metaSummary: '4 lectures • 3h 10m',
            lectures: [
              { name: '11. Polypaint Skin Tones & Eye Highlights', duration: '41:25', isPreview: false },
              { name: '12. Decimation Master & High-Poly Export', duration: '40:43', isPreview: false },
              { name: '13. Preparing Mesh for Retopology in Blender', duration: '35:32', isPreview: false },
              { name: '14. Final Render & Portfolio Presentation', duration: '41:38', isPreview: false }
            ]
          }
        ]),
        order: 1
      },
      {
        slug: 'blender',
        title: 'Blender 3D Complete Pipeline: Modeling, Topology & Texturing',
        subtitle: 'Comprehensive guide to anime character modeling, clean low-poly retopology, weight painting, UV unwrapping, and stylized shading',
        tag: '3D Modeling & Rigging',
        description: 'Comprehensive guide to anime character modeling, clean low-poly retopology, weight painting, UV unwrapping, and stylized shading.',
        badge: 'Highest Rated',
        status: 'In Production',
        authorName: 'SenpaiWorks Studio',
        authorAvatar: 'assets/SenpaiWorks logo bg.png',
        releaseDate: 'Release 2026',
        thumbnail: 'assets/courses/blender-course.png',
        videoUrl: 'https://www.youtube.com/embed/SsoV6Mdjr6A',
        rating: '4.9',
        ratingCount: '(1,420 ratings)',
        learnersCount: '7,210',
        price: '₹499.00',
        originalPrice: '₹3,499.00',
        discount: '86% off',
        monthlyPrice: '₹375.00',
        originalMonthlyPrice: '₹500.00',
        whatYouWillLearn: JSON.stringify([
          'Complete 3D anime character creation inside Blender',
          'Clean quad retopology and UV layout optimization',
          'Weight painting, bone constraints, and armature setups',
          'Non-photorealistic (NPR) anime shaders and lineart modifiers'
        ]),
        relatedTopics: JSON.stringify(['Blender 3D', 'Anime Modeling', '3D Rigging', 'Texturing', 'NPR Shaders']),
        requirements: JSON.stringify([
          'Blender 3.6 or later installed.',
          'Basic knowledge of 3D viewport navigation.',
          'Computer with dedicated GPU recommended.'
        ]),
        curriculum: JSON.stringify([
          {
            sectionTitle: 'Section 1: Blender Workspace & Modeling Setup',
            metaSummary: '3 lectures • 1h 30m',
            lectures: [
              { name: '01. Setting up Reference Images & Viewports', duration: '15:20', isPreview: true },
              { name: '02. Blockout & Proportions', duration: '42:10', isPreview: true },
              { name: '03. Face Modeling with Subsurf Modifier', duration: '32:30', isPreview: false }
            ]
          },
          {
            sectionTitle: 'Section 2: Retopology & UV Unwrapping',
            metaSummary: '3 lectures • 2h 45m',
            lectures: [
              { name: '04. Clean Quad Retopology for Face & Body', duration: '55:10', isPreview: true },
              { name: '05. Seam Placement & Efficient UV Packing', duration: '48:20', isPreview: false },
              { name: '06. Baking Normal Maps & Curvature', duration: '41:30', isPreview: false }
            ]
          },
          {
            sectionTitle: 'Section 3: Stylized NPR Shading & Rigging',
            metaSummary: '4 lectures • 3h 20m',
            lectures: [
              { name: '07. Custom Anime Toon Shader Nodes', duration: '50:15', isPreview: false },
              { name: '08. Outline Lineart Modifiers', duration: '45:30', isPreview: false },
              { name: '09. Rigify Armature & Weight Painting', duration: '58:40', isPreview: false },
              { name: '10. Pose Setup & Final EEVEE Render', duration: '45:15', isPreview: false }
            ]
          }
        ]),
        order: 2
      },
      {
        slug: 'marvelous-designer',
        title: 'Marvelous Designer: 3D Clothing & Anime Garment Creation',
        subtitle: 'Learn pattern creation, sewing workflows, realistic anime streetwear draping, and exporting clean garment meshes to Blender & ZBrush',
        tag: '3D Clothing & Simulation',
        description: 'Learn pattern creation, sewing workflows, realistic anime streetwear draping, and exporting clean garment meshes to Blender & ZBrush.',
        badge: 'New Masterclass',
        status: 'In Planning',
        authorName: 'SenpaiWorks Studio',
        authorAvatar: 'assets/SenpaiWorks logo bg.png',
        releaseDate: 'In Planning',
        thumbnail: 'assets/courses/marvelous-designer-course.png',
        videoUrl: 'https://www.youtube.com/embed/SsoV6Mdjr6A',
        rating: '4.8',
        ratingCount: '(840 ratings)',
        learnersCount: '3,450',
        price: '₹449.00',
        originalPrice: '₹2,999.00',
        discount: '85% off',
        monthlyPrice: '₹375.00',
        originalMonthlyPrice: '₹500.00',
        whatYouWillLearn: JSON.stringify([
          '2D pattern drafting for hoodies, jackets, skirts, and streetwear',
          'Sewing and arranging cloth around 3D character avatars',
          'Adjusting fabric physics, fold density, and stiffness properties',
          'Exporting clean quads & UVs for Blender & ZBrush rendering'
        ]),
        relatedTopics: JSON.stringify(['Marvelous Designer', '3D Fashion', 'Streetwear', 'Cloth Physics', '3D Simulation']),
        requirements: JSON.stringify([
          'Marvelous Designer software installed.',
          'Basic understanding of 3D avatar imports.'
        ]),
        curriculum: JSON.stringify([
          {
            sectionTitle: 'Section 1: 2D Pattern Drafting & Sewing',
            metaSummary: '3 lectures • 1h 40m',
            lectures: [
              { name: '01. Marvelous Designer Interface & Avatar Setup', duration: '18:30', isPreview: true },
              { name: '02. Drafting Oversized Hoodie Patterns', duration: '45:10', isPreview: true },
              { name: '03. Sewing & Simulation Run', duration: '36:20', isPreview: false }
            ]
          },
          {
            sectionTitle: 'Section 2: Anime Streetwear Details & Accessories',
            metaSummary: '3 lectures • 2h 15m',
            lectures: [
              { name: '04. Zippers, Pockets & Ribbed Cuffs', duration: '42:15', isPreview: false },
              { name: '05. Layered Skirts & Pleat Simulation', duration: '48:30', isPreview: false },
              { name: '06. Fine-Tuning Fabric Folds & Internal Lines', duration: '44:15', isPreview: false }
            ]
          }
        ]),
        order: 3
      },
      {
        slug: 'web-dev',
        title: 'Creating Modern Web Portfolios & Creative Websites',
        subtitle: 'Step-by-step masterclass on building responsive artist portfolio websites, glassmorphism layouts, interactive Web3D showcases, and custom JavaScript',
        tag: 'Web Development',
        description: 'Step-by-step masterclass on building responsive artist portfolio websites, glassmorphism layouts, interactive Web3D showcases, and custom JavaScript.',
        badge: 'Popular',
        status: 'In Planning',
        authorName: 'SenpaiWorks Studio',
        authorAvatar: 'assets/SenpaiWorks logo bg.png',
        releaseDate: 'In Planning',
        thumbnail: 'assets/courses/web-dev-course.png',
        videoUrl: 'https://www.youtube.com/embed/SsoV6Mdjr6A',
        rating: '4.9',
        ratingCount: '(2,100 ratings)',
        learnersCount: '9,420',
        price: '₹399.00',
        originalPrice: '₹2,499.00',
        discount: '84% off',
        monthlyPrice: '₹375.00',
        originalMonthlyPrice: '₹500.00',
        whatYouWillLearn: JSON.stringify([
          'Building modern responsive web layouts with HTML5, CSS3 & JS',
          'Creating glassmorphism cards, glowing backgrounds, and dark modes',
          'Implementing drag & swipe carousels, mobile drawers, and modals',
          'Deploying portfolio web applications with live performance optimization'
        ]),
        relatedTopics: JSON.stringify(['Web Development', 'HTML/CSS', 'JavaScript', 'Portfolio Design', 'Web3D']),
        requirements: JSON.stringify([
          'No prior coding experience required!',
          'Any free code editor (VS Code recommended).'
        ]),
        curriculum: JSON.stringify([
          {
            sectionTitle: 'Section 1: HTML5 & CSS3 Design Foundation',
            metaSummary: '3 lectures • 1h 50m',
            lectures: [
              { name: '01. Project Setup & Semantic Layout', duration: '22:10', isPreview: true },
              { name: '02. Flexbox, CSS Grid & Responsive Breakpoints', duration: '48:30', isPreview: true },
              { name: '03. Glassmorphism & Custom CSS Design Tokens', duration: '39:20', isPreview: false }
            ]
          },
          {
            sectionTitle: 'Section 2: JavaScript Interactivity & Carousels',
            metaSummary: '3 lectures • 2h 20m',
            lectures: [
              { name: '04. DOM Manipulation & Event Handlers', duration: '45:10', isPreview: false },
              { name: '05. Building Touch-Swipe Drag Carousels', duration: '52:40', isPreview: false },
              { name: '06. Dynamic Data Parsing & Query Params', duration: '42:10', isPreview: false }
            ]
          }
        ]),
        order: 4
      },
      {
        slug: 'unreal-engine',
        title: 'Unreal Engine 5: Anime Environment Art & Cinematic Rendering',
        subtitle: 'Master environment building in Unreal Engine 5, Lumen dynamic lighting, stylized anime shaders, camera sequencers, and real-time cinematic rendering',
        tag: 'Real-Time & Environments',
        description: 'Master environment building in Unreal Engine 5, Lumen dynamic lighting, stylized anime shaders, camera sequencers, and real-time cinematic rendering.',
        badge: 'Trending',
        status: 'In Planning',
        authorName: 'SenpaiWorks Studio',
        authorAvatar: 'assets/SenpaiWorks logo bg.png',
        releaseDate: 'In Planning',
        thumbnail: 'assets/courses/unreal-engine-course.png',
        videoUrl: 'https://www.youtube.com/embed/SsoV6Mdjr6A',
        rating: '4.9',
        ratingCount: '(980 ratings)',
        learnersCount: '4,150',
        price: '₹549.00',
        originalPrice: '₹3,999.00',
        discount: '86% off',
        monthlyPrice: '₹375.00',
        originalMonthlyPrice: '₹500.00',
        whatYouWillLearn: JSON.stringify([
          'Assembling anime fantasy environments with Megascans & custom assets',
          'Configuring Unreal Engine 5 Lumen global illumination & sky atmosphere',
          'Authoring stylized post-process anime shaders and toon cel-shading',
          'Cinematic Camera Sequencer animations and 4K Movie Render Queue'
        ]),
        relatedTopics: JSON.stringify(['Unreal Engine 5', 'Environment Art', 'Lumen', 'Cinematics', 'Stylized Shaders']),
        requirements: JSON.stringify([
          'Unreal Engine 5 installed.',
          'Dedicated graphics card (NVIDIA GTX 1070 / RTX or equivalent).'
        ]),
        curriculum: JSON.stringify([
          {
            sectionTitle: 'Section 1: UE5 Project Setup & Environment Blockout',
            metaSummary: '3 lectures • 1h 45m',
            lectures: [
              { name: '01. Project Settings & Foliage Tool Setup', duration: '25:10', isPreview: true },
              { name: '02. Landscape Composition & Blockout', duration: '44:20', isPreview: true },
              { name: '03. Foliage Placement & Anime Tree Shaders', duration: '35:40', isPreview: false }
            ]
          },
          {
            sectionTitle: 'Section 2: Lumen Lighting & Post-Processing',
            metaSummary: '3 lectures • 2h 30m',
            lectures: [
              { name: '04. Volumetric Fog & Sunset Sky Atmosphere', duration: '48:15', isPreview: false },
              { name: '05. Cel-Shaded Post-Process Shaders', duration: '52:30', isPreview: false },
              { name: '06. Camera Sequencer & 4K Video Export', duration: '49:15', isPreview: false }
            ]
          }
        ]),
        order: 5
      }
    ];

    if (count === 0) {
      for (const c of defaults) {
        await prisma.course.create({ data: c });
      }
      console.log('[Courses] Seeded 5 default courses with full detail data.');
      return;
    }

    // Self-healing: if courses already exist, backfill any empty slugs, prices, or details
    const existing = await prisma.course.findMany();
    let healedCount = 0;

    for (const course of existing) {
      const updateData = {};

      // Match canonical default by slug or matching title keyword
      const match = defaults.find(d =>
        (d.slug && course.slug && d.slug.toLowerCase() === course.slug.toLowerCase()) ||
        (course.title && d.slug && course.title.toLowerCase().includes(d.slug.toLowerCase()))
      );

      // 1. Slug auto-healing
      if (!course.slug || course.slug.trim() === '') {
        if (match && match.slug) {
          updateData.slug = match.slug;
        } else if (course.title) {
          updateData.slug = course.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 50);
        }
      }

      // 2. Canonical details auto-healing for matching default courses
      if (match) {
        if ((!course.price || course.price.trim() === '') && match.price) {
          updateData.price = match.price;
        }
        if ((!course.originalPrice || course.originalPrice.trim() === '') && match.originalPrice) {
          updateData.originalPrice = match.originalPrice;
        }
        if ((!course.discount || course.discount.trim() === '') && match.discount) {
          updateData.discount = match.discount;
        }
        if ((!course.monthlyPrice || course.monthlyPrice.trim() === '') && match.monthlyPrice) {
          updateData.monthlyPrice = match.monthlyPrice;
        }
        if ((!course.originalMonthlyPrice || course.originalMonthlyPrice.trim() === '') && match.originalMonthlyPrice) {
          updateData.originalMonthlyPrice = match.originalMonthlyPrice;
        }
        if ((!course.subtitle || course.subtitle.trim() === '') && match.subtitle) {
          updateData.subtitle = match.subtitle;
        }
        if ((!course.badge || course.badge.trim() === '') && match.badge) {
          updateData.badge = match.badge;
        }
        if ((!course.videoUrl || course.videoUrl.trim() === '') && match.videoUrl) {
          updateData.videoUrl = match.videoUrl;
        }
        if ((!course.whatYouWillLearn || course.whatYouWillLearn === '[]') && match.whatYouWillLearn) {
          updateData.whatYouWillLearn = match.whatYouWillLearn;
        }
        if ((!course.relatedTopics || course.relatedTopics === '[]') && match.relatedTopics) {
          updateData.relatedTopics = match.relatedTopics;
        }
        if ((!course.requirements || course.requirements === '[]') && match.requirements) {
          updateData.requirements = match.requirements;
        }
        if ((!course.curriculum || course.curriculum === '[]') && match.curriculum) {
          updateData.curriculum = match.curriculum;
        }
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.course.update({
          where: { id: course.id },
          data: updateData
        });
        healedCount++;
      }
    }

    if (healedCount > 0) {
      console.log(`[Courses] Self-healed ${healedCount} existing course(s) with missing fields/slugs.`);
    }
  } catch (err) {
    console.error('[Courses] Seed error:', err);
  }
}

// ── Public: Validate a coupon and return server-computed discount ──────────────
// POST /api/coupons/validate  body: { code, courseId }
// courseId may be a slug or UUID — we fetch the real price server-side.
app.post("/api/coupons/validate", couponValidateLimiter, async (req, res) => {
  try {
    const { code, courseId } = req.body;
    if (!code) return res.status(400).json({ error: "Coupon code is required." });

    // 1. Look up coupon
    const coupon = await prisma.coupon.findUnique({ where: { code: String(code).trim().toUpperCase() } });
    if (!coupon) return res.status(404).json({ error: "Invalid coupon code." });

    // 2. Check active status
    if (coupon.status !== "Active") {
      return res.status(400).json({ error: "This coupon is no longer active." });
    }

    // 3. Check expiry
    if (coupon.expiryDate) {
      const expiry = new Date(coupon.expiryDate);
      if (!isNaN(expiry) && expiry < new Date()) {
        return res.status(400).json({ error: "This coupon has expired." });
      }
    }

    // 4. Check usage cap
    if (coupon.maxUses !== null && coupon.maxUses !== undefined) {
      if (coupon.usageCount >= coupon.maxUses) {
        return res.status(400).json({ error: "This coupon has reached its maximum usage limit." });
      }
    }

    // 5. Fetch real course price server-side (never trust client-sent price)
    let originalPriceNum = null;
    let currency = '\u20B9';
    if (courseId) {
      const course = await prisma.course.findFirst({
        where: { OR: [{ slug: String(courseId) }, { id: String(courseId) }] }
      });
      if (course && course.price) {
        const stripped = course.price.replace(/[^\d.]/g, '');
        const parsed = parseFloat(stripped);
        if (!isNaN(parsed)) {
          originalPriceNum = parsed;
          const match = course.price.match(/^([^\d\s]+)/);
          if (match) currency = match[1];
        }
      }
    }

    // 6. Compute discount
    const discountVal = parseFloat(coupon.discountValue);
    let discountAmount = 0;
    let finalPrice = null;
    let discountDisplay = '';

    if (coupon.discountType === 'percentage') {
      discountDisplay = `${discountVal}% off`;
      if (originalPriceNum !== null) {
        discountAmount = parseFloat((originalPriceNum * discountVal / 100).toFixed(2));
        finalPrice = parseFloat((originalPriceNum - discountAmount).toFixed(2));
      }
    } else {
      discountDisplay = `${currency}${discountVal} off`;
      discountAmount = discountVal;
      if (originalPriceNum !== null) {
        finalPrice = Math.max(0, parseFloat((originalPriceNum - discountAmount).toFixed(2)));
      }
    }

    // 7. Increment usageCount atomically
    await prisma.coupon.update({
      where: { code: coupon.code },
      data: { usageCount: { increment: 1 } }
    });

    res.json({
      success: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountDisplay,
      discountAmount,
      originalPrice: originalPriceNum,
      finalPrice,
      currency,
      finalPriceFormatted: finalPrice !== null ? `${currency}${finalPrice.toFixed(2)}` : null,
      message: `Coupon applied! ${discountDisplay}`
    });
  } catch (err) {
    console.error("[CouponValidate] Error:", err);
    res.status(500).json({ error: "Failed to validate coupon." });
  }
});

// ── Admin: Create coupon ───────────────────────────────────────────────────────
app.post("/api/admin/coupons", requireAdminToken, async (req, res) => {
  try {
    const { code, discountType, discountValue, maxUses, expiryDate, status } = req.body;
    if (!code || !discountType || !discountValue) {
      return res.status(400).json({ error: "code, discountType, and discountValue are required." });
    }
    if (!['percentage', 'flat'].includes(discountType)) {
      return res.status(400).json({ error: "discountType must be 'percentage' or 'flat'." });
    }
    const val = parseFloat(discountValue);
    if (isNaN(val) || val <= 0) {
      return res.status(400).json({ error: "discountValue must be a positive number." });
    }
    if (discountType === 'percentage' && val > 100) {
      return res.status(400).json({ error: "Percentage discount cannot exceed 100." });
    }
    const existing = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
    if (existing) return res.status(409).json({ error: "A coupon with this code already exists." });
    const coupon = await prisma.coupon.create({
      data: {
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: String(val),
        maxUses: maxUses ? parseInt(maxUses) : null,
        expiryDate: expiryDate ? expiryDate.trim() : null,
        status: status || "Active"
      }
    });
    res.status(201).json({ success: true, coupon });
  } catch (err) {
    console.error("[CouponCreate] Error:", err);
    res.status(500).json({ error: "Failed to create coupon." });
  }
});

// ── Admin: Delete coupon ───────────────────────────────────────────────────────
app.delete("/api/admin/coupons/:code", requireAdminToken, async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (!existing) return res.status(404).json({ error: "Coupon not found." });
    await prisma.coupon.delete({ where: { code } });
    res.json({ success: true, message: `Coupon ${code} deleted.` });
  } catch (err) {
    console.error("[CouponDelete] Error:", err);
    res.status(500).json({ error: "Failed to delete coupon." });
  }
});

// ── Admin: List all coupons ───────────────────────────────────────────────────
app.get("/api/admin/coupons", requireAdminToken, async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch coupons" });
  }
});

// ── Admin: Toggle coupon status ───────────────────────────────────────────────
app.patch("/api/admin/coupons/:code/toggle", requireAdminToken, async (req, res) => {
  try {
    const code = req.params.code;
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon) return res.status(404).json({ error: "Not found" });
    const newStatus = coupon.status === "Active" ? "Inactive" : "Active";
    await prisma.coupon.update({ where: { code }, data: { status: newStatus } });
    res.json({ success: true, status: newStatus });
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle coupon" });
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
        img: "https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/artworks/deadpool_poster_krntp0.webp",
        additionalImages: "https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/artworks/deadpool_poster_krntp0.webp\nhttps://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/news/all_characters_yvk9ik.webp\nhttps://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/brand/chronos_plays_fl47xm.webp",
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
        img: "https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/avatars/rem_happy_evhesz.webp",
        additionalImages: "https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/avatars/rem_happy_evhesz.webp\nhttps://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/brand/to_love_ru_copy_sthzsw.webp\nhttps://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/brand/know_why_fp0q72.webp",
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
        img: "https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/news/all_characters_yvk9ik.webp",
        additionalImages: "https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/news/all_characters_yvk9ik.webp\nhttps://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/brand/know_why_fp0q72.webp\nhttps://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/avatars/rem_happy_evhesz.webp",
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
        img: "https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/brand/know_why_fp0q72.webp",
        additionalImages: "https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/brand/know_why_fp0q72.webp\nhttps://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/news/all_characters_yvk9ik.webp\nhttps://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/brand/chronos_plays_fl47xm.webp",
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
        img: "https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/artworks/jungkook_copy_ntfb24.webp",
        additionalImages: "https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/artworks/jungkook_copy_ntfb24.webp\nhttps://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/brand/to_love_ru_copy_sthzsw.webp\nhttps://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/avatars/rem_happy_evhesz.webp",
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
        img: "https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/artworks/jungkook_copy_ntfb24.webp",
        additionalImages: "https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/artworks/jungkook_copy_ntfb24.webp\nhttps://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/brand/to_love_ru_copy_sthzsw.webp\nhttps://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/avatars/rem_happy_evhesz.webp",
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
        img: "https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/brand/chronos_plays_fl47xm.webp",
        additionalImages: "https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/brand/chronos_plays_fl47xm.webp\nhttps://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/avatars/rem_happy_evhesz.webp\nhttps://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/brand/zoro_green_poster_unzusa.webp",
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
  seedInitialCourses();
  seedInitialStoreProducts();
});

// =========================================================================
// GLOBAL EXPRESS ERROR-HANDLING MIDDLEWARE
// =========================================================================
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]', err);
  if (res.headersSent) {
    return next(err);
  }
  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode === 500
    ? 'An unexpected internal server error occurred.'
    : (err.message || 'Error processing request.');

  res.status(statusCode).json({ error: message });
});

