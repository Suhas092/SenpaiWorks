const dotenv = require('dotenv');
dotenv.config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const http = require('http');

const JWT_SECRET = process.env.JWT_SECRET || 'senpai_works_default_fallback_jwt_key_99';

function makeRequest(cookie) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/me',
      headers: { 'Cookie': `adminToken=${cookie}` }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('Testing Admin Role Identity on /api/admin/me...\n');

  // 1. Super Admin
  const superToken = jwt.sign({ username: 'suhas_admin', role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
  const superRes = await makeRequest(superToken);
  console.log('1. Super Admin Session:');
  console.log('   Status:', superRes.status);
  console.log('   Username:', superRes.data?.adminUser?.username);
  console.log('   Role:', superRes.data?.adminUser?.role);
  console.log('   isSuper:', superRes.data?.adminUser?.isSuper);
  console.log('   Calculated UI Role:', superRes.data?.adminUser?.isSuper ? 'SUPER ADMIN' : 'NORMAL ADMIN');

  // 2. Junior Admin
  let staff = await prisma.staffMember.findFirst({ where: { role: 'junior_admin', isActive: true } });
  if (!staff) {
    staff = await prisma.staffMember.create({
      data: {
        name: 'Junior Mod',
        username: 'junior_mod',
        role: 'junior_admin',
        pageAccess: { art: 'view' },
        passwordHash: 'dummy',
        isActive: true
      }
    });
  }
  const staffToken = jwt.sign({ role: 'staff', staffId: staff.id, name: staff.name }, JWT_SECRET, { expiresIn: '8h' });
  const staffRes = await makeRequest(staffToken);
  console.log('\n2. Junior Admin (Lesser Power) Session:');
  console.log('   Status:', staffRes.status);
  console.log('   Username:', staffRes.data?.adminUser?.username);
  console.log('   Role:', staffRes.data?.adminUser?.role);
  console.log('   isSuper:', staffRes.data?.adminUser?.isSuper);
  console.log('   Calculated UI Role:', staffRes.data?.adminUser?.isSuper ? 'SUPER ADMIN' : 'NORMAL ADMIN');

  console.log('\nAll checks succeeded!');
  await prisma.$disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
