const http = require('http');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: pathJoin(__dirname, '../.env') });

function pathJoin(...parts) {
  return require('path').join(...parts);
}

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'senpai_works_default_fallback_jwt_key_99';
const BASE_URL = 'http://localhost:5000';

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.path || '/', BASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json,
          raw: data
        });
      });
    });

    req.on('error', reject);

    if (body) {
      if (typeof body === 'object') {
        req.write(JSON.stringify(body));
      } else {
        req.write(body);
      }
    }
    req.end();
  });
}

async function runSecuritySuite() {
  console.log('===============================================================');
  console.log('    SENPAIWORKS COMPREHENSIVE ADMIN SECURITY AUDIT SUITE       ');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;
  let warnings = 0;

  function assert(title, condition, detail = '') {
    if (condition) {
      console.log(`  [PASS] ${title}`);
      passed++;
    } else {
      console.log(`  [FAIL] ${title} ${detail ? '-> ' + detail : ''}`);
      failed++;
    }
  }

  function warn(title, detail = '') {
    console.log(`  [WARN] ${title} ${detail ? '-> ' + detail : ''}`);
    warnings++;
  }

  // -------------------------------------------------------------
  // TEST GROUP 1: Static File Middleware Source Code Leakage
  // -------------------------------------------------------------
  console.log('\n--- GROUP 1: Static Middleware & Sensitive File Leakage ---');

  const staticTests = [
    { path: '/backend/server.js', desc: 'Backend server.js source code' },
    { path: '/backend/package.json', desc: 'Backend package.json' },
    { path: '/backend/sqlite_dump.json', desc: 'Database sqlite_dump.json backup' },
    { path: '/backend/prisma/schema.prisma', desc: 'Prisma schema file' },
    { path: '/backend/mailer.js', desc: 'Backend mailer.js' },
    { path: '/backend/routes/staff.js', desc: 'Staff route file' },
    { path: '/backend/routes/siteSettings.js', desc: 'SiteSettings route file' },
    { path: '/.env', desc: 'Root .env file' },
    { path: '/backend/.env', desc: 'Backend .env file' },
    { path: '/admin-course-editor.html', desc: 'Admin course editor HTML' },
    { path: '/admin-course-editor', desc: 'Clean URL /admin-course-editor' },
    { path: '/admin.html', desc: 'Legacy /admin.html (should 404)' },
    { path: '/admin', desc: 'Standard /admin (should 404)' }
  ];

  for (const t of staticTests) {
    const res = await request({ path: t.path });
    if (t.path === '/admin' || t.path === '/admin.html' || t.path === '/.env' || t.path === '/backend/.env') {
      assert(`${t.desc} returns 404 (Hidden)`, res.status === 404, `Status was ${res.status}`);
    } else if (t.path.startsWith('/backend/')) {
      if (res.status === 200) {
        warn(`LEAK: ${t.desc} is accessible via static middleware!`, `HTTP ${res.status}`);
      } else {
        assert(`${t.desc} blocked from public access`, res.status === 404 || res.status === 403, `Status was ${res.status}`);
      }
    } else if (t.path.includes('course-editor')) {
      if (res.status === 200 || res.status === 302) {
        warn(`EXPOSURE: ${t.desc} is publicly accessible without admin auth!`, `Status ${res.status}`);
      } else {
        assert(`${t.desc} is protected`, res.status === 401 || res.status === 403 || res.status === 404);
      }
    }
  }

  // -------------------------------------------------------------
  // TEST GROUP 2: Admin Authentication Middleware Bypass Tests
  // -------------------------------------------------------------
  console.log('\n--- GROUP 2: Admin Authentication Middleware (requireAdminToken) ---');

  // 2.1 No token
  const resNoAuth = await request({ path: '/api/admin/me' });
  assert('GET /api/admin/me without token returns 401', resNoAuth.status === 401, `Status: ${resNoAuth.status}`);

  // 2.2 Malformed token in header
  const resBadHeader = await request({
    path: '/api/admin/me',
    headers: { 'Authorization': 'Bearer NOT_A_JWT' }
  });
  assert('GET /api/admin/me with malformed Bearer returns 401', resBadHeader.status === 401, `Status: ${resBadHeader.status}`);

  // 2.3 Malformed token in cookie
  const resBadCookie = await request({
    path: '/api/admin/me',
    headers: { 'Cookie': 'adminToken=garbage_value' }
  });
  assert('GET /api/admin/me with invalid adminToken cookie returns 401', resBadCookie.status === 401, `Status: ${resBadCookie.status}`);

  // 2.4 Token signed with wrong secret
  const forgedToken = jwt.sign({ username: 'suhas_admin', role: 'admin' }, 'WRONG_SECRET_KEY');
  const resForged = await request({
    path: '/api/admin/me',
    headers: { 'Cookie': `adminToken=${forgedToken}` }
  });
  assert('GET /api/admin/me with forged secret token returns 401', resForged.status === 401, `Status: ${resForged.status}`);

  // 2.5 Expired admin token
  const expiredToken = jwt.sign({ username: 'suhas_admin', role: 'admin' }, JWT_SECRET, { expiresIn: '-1s' });
  const resExpired = await request({
    path: '/api/admin/me',
    headers: { 'Cookie': `adminToken=${expiredToken}` }
  });
  assert('GET /api/admin/me with expired token returns 401', resExpired.status === 401, `Status: ${resExpired.status}`);

  // 2.6 Customer user token attempting to access admin route
  const customerUser = await prisma.user.findFirst();
  if (customerUser) {
    const customerToken = jwt.sign(
      { id: customerUser.id, email: customerUser.email, username: customerUser.username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const resCustomerOnAdmin = await request({
      path: '/api/admin/me',
      headers: { 'Cookie': `adminToken=${customerToken}`, 'Authorization': `Bearer ${customerToken}` }
    });
    assert('Customer user token cannot access /api/admin/me (401)', resCustomerOnAdmin.status === 401, `Status: ${resCustomerOnAdmin.status}`);

    const resCustomerOnOrders = await request({
      path: '/api/admin/orders',
      headers: { 'Cookie': `adminToken=${customerToken}`, 'Authorization': `Bearer ${customerToken}` }
    });
    assert('Customer user token cannot access /api/admin/orders (401)', resCustomerOnOrders.status === 401, `Status: ${resCustomerOnOrders.status}`);
  }

  // 2.7 Superadmin valid token
  const validAdminToken = jwt.sign({ username: 'suhas_admin', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
  const resSuperAdmin = await request({
    path: '/api/admin/me',
    headers: { 'Cookie': `adminToken=${validAdminToken}` }
  });
  assert('Superadmin valid token can access /api/admin/me (200)', resSuperAdmin.status === 200, `Status: ${resSuperAdmin.status}`);
  assert('Superadmin payload has isSuper=true', resSuperAdmin.data?.adminUser?.isSuper === true);

  // -------------------------------------------------------------
  // TEST GROUP 3: Staff RBAC & Isolation Testing
  // -------------------------------------------------------------
  console.log('\n--- GROUP 3: Staff Role-Based Access Control (RBAC) ---');

  // Let's create or find a junior_admin staff member in DB
  let testStaff = await prisma.staffMember.findFirst({
    where: { username: 'test_sec_staff' }
  });

  if (!testStaff) {
    testStaff = await prisma.staffMember.create({
      data: {
        name: 'Test Staff Security',
        username: 'test_sec_staff',
        role: 'junior_admin',
        pageAccess: { art: 'view' }, // only granted view on art
        passwordHash: 'dummy_hash',
        isActive: true
      }
    });
  } else {
    testStaff = await prisma.staffMember.update({
      where: { id: testStaff.id },
      data: { role: 'junior_admin', pageAccess: { art: 'view' }, isActive: true }
    });
  }

  const staffToken = jwt.sign({ role: 'staff', staffId: testStaff.id, name: testStaff.name }, JWT_SECRET, { expiresIn: '1h' });

  // 3.1 Staff can access /api/admin/me
  const resStaffMe = await request({
    path: '/api/admin/me',
    headers: { 'Cookie': `adminToken=${staffToken}` }
  });
  assert('Junior admin staff can access /api/admin/me (200)', resStaffMe.status === 200);

  // 3.2 Staff can access granted page: art (view)
  const resStaffArt = await request({
    path: '/api/artworks',
    headers: { 'Cookie': `adminToken=${staffToken}` }
  });
  assert('Junior admin with art:view can GET /api/artworks (200)', resStaffArt.status === 200, `Status: ${resStaffArt.status}`);

  // 3.3 Staff cannot edit art because grant is view-only
  const resStaffArtPost = await request({
    path: '/api/artworks',
    method: 'POST',
    headers: { 'Cookie': `adminToken=${staffToken}`, 'Content-Type': 'application/json' },
    body: { title: 'Unauthorized Artwork' }
  });
  assert('Junior admin with art:view CANNOT POST /api/artworks (403 Forbidden)', resStaffArtPost.status === 403, `Status: ${resStaffArtPost.status}`);

  // 3.4 Staff cannot access ungranted pages: /api/admin/orders
  const resStaffOrders = await request({
    path: '/api/admin/orders',
    headers: { 'Cookie': `adminToken=${staffToken}` }
  });
  assert('Junior admin CANNOT access /api/admin/orders (403 Forbidden)', resStaffOrders.status === 403, `Status: ${resStaffOrders.status}`);

  // 3.5 Staff cannot access superadmin settings: /api/admin/settings
  const resStaffSettings = await request({
    path: '/api/admin/settings',
    headers: { 'Cookie': `adminToken=${staffToken}` }
  });
  assert('Junior admin CANNOT access /api/admin/settings (403 Forbidden)', resStaffSettings.status === 403, `Status: ${resStaffSettings.status}`);

  // 3.6 Staff cannot access team management: /api/admin/staff
  const resStaffStaff = await request({
    path: '/api/admin/staff',
    headers: { 'Cookie': `adminToken=${staffToken}` }
  });
  assert('Junior admin CANNOT access /api/admin/staff (403 Forbidden)', resStaffStaff.status === 403, `Status: ${resStaffStaff.status}`);

  // 3.7 RBAC Path Traversal bypass test (e.g. /api/admin/me/../settings)
  const resStaffTraversal = await request({
    path: '/api/admin/me/../settings',
    headers: { 'Cookie': `adminToken=${staffToken}` }
  });
  assert('Path traversal attempt (/api/admin/me/../settings) blocked by RBAC (403)', resStaffTraversal.status === 403, `Status: ${resStaffTraversal.status}`);

  // 3.8 Deactivated staff account rejection
  await prisma.staffMember.update({
    where: { id: testStaff.id },
    data: { isActive: false }
  });
  const resStaffDeactivated = await request({
    path: '/api/admin/me',
    headers: { 'Cookie': `adminToken=${staffToken}` }
  });
  assert('Deactivated staff member token is IMMEDIATELY revoked (401)', resStaffDeactivated.status === 401, `Status: ${resStaffDeactivated.status}`);

  // Clean up test staff
  await prisma.staffMember.delete({ where: { id: testStaff.id } });

  // -------------------------------------------------------------
  // TEST GROUP 4: Sensitive Data Leakage in Admin Responses
  // -------------------------------------------------------------
  console.log('\n--- GROUP 4: Sensitive Data Exposure in Admin Responses ---');

  // Check /api/admin/staff response data
  const resStaffList = await request({
    path: '/api/admin/staff',
    headers: { 'Cookie': `adminToken=${validAdminToken}` }
  });
  if (resStaffList.status === 200 && resStaffList.data?.members) {
    const hasPasswordHash = resStaffList.data.members.some(m => m.passwordHash || m.password);
    assert('/api/admin/staff does NOT leak passwordHash', !hasPasswordHash);
  }

  // Check /api/users response data
  const resUsersList = await request({
    path: '/api/users',
    headers: { 'Cookie': `adminToken=${validAdminToken}` }
  });
  if (resUsersList.status === 200 && Array.isArray(resUsersList.data)) {
    const hasUserPassword = resUsersList.data.some(u => u.password || u.passwordHash || u.resetPasswordToken);
    assert('/api/users does NOT leak user password or reset tokens', !hasUserPassword);
  }

  // Check /api/admin/settings response data
  const resSettings = await request({
    path: '/api/admin/settings',
    headers: { 'Cookie': `adminToken=${validAdminToken}` }
  });
  if (resSettings.status === 200 && resSettings.data) {
    const leaksSecret = JSON.stringify(resSettings.data).includes('Hash') ||
                        JSON.stringify(resSettings.data).includes('secret') ||
                        JSON.stringify(resSettings.data).includes('key');
    assert('/api/admin/settings does NOT leak admin password hash or server secrets', !leaksSecret);
  }

  console.log('\n===============================================================');
  console.log(`SUMMARY: ${passed} PASSED | ${failed} FAILED | ${warnings} WARNINGS`);
  console.log('===============================================================\n');

  await prisma.$disconnect();
}

runSecuritySuite().catch(err => {
  console.error('Audit suite encountered error:', err);
  process.exit(1);
});
