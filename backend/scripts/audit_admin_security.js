const fs = require('fs');
const path = require('path');

console.log('=== SENPAIWORKS SECURITY SCAN: ROUTES & MIDDLEWARES ===\n');

// 1. Scan server.js
const serverJsContent = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
const serverLines = serverJsContent.split('\n');

const routePattern = /app\.(get|post|put|patch|delete)\s*\(\s*(['"`][^'"`]+['"`]|\[[^\]]+\])\s*,\s*([^)]+)\)/;

const extractedRoutes = [];

serverLines.forEach((line, index) => {
  const match = line.match(/app\.(get|post|put|patch|delete)\s*\(\s*(['"`][^'"`]+['"`]|\[[^\]]+\])\s*,(.*)/);
  if (match) {
    const method = match[1].toUpperCase();
    let rawPath = match[2].trim();
    let paths = [];
    if (rawPath.startsWith('[')) {
      try {
        // Parse array of strings e.g. ['/admin', '/admin.html']
        paths = rawPath.replace(/[\[\]'"`\s]/g, '').split(',').filter(Boolean);
      } catch (e) {
        paths = [rawPath];
      }
    } else {
      paths = [rawPath.replace(/['"`]/g, '')];
    }
    const rest = match[3].trim();
    const hasRequireAdminToken = rest.includes('requireAdminToken');
    const hasRequireUserToken = rest.includes('requireUserToken');
    const hasAdminLoginLimiter = rest.includes('adminLoginLimiter');
    
    paths.forEach(p => {
      extractedRoutes.push({
        source: 'server.js',
        line: index + 1,
        method,
        path: p,
        hasRequireAdminToken,
        hasRequireUserToken,
        hasAdminLoginLimiter,
        rawArgs: rest.slice(0, 100)
      });
    });
  }
});

// 2. Scan backend/routes/
const routesDir = path.join(__dirname, '../routes');
const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

routeFiles.forEach(file => {
  const fileContent = fs.readFileSync(path.join(routesDir, file), 'utf8');
  const lines = fileContent.split('\n');
  lines.forEach((line, index) => {
    const match = line.match(/router\.(get|post|put|patch|delete)\s*\(\s*(['"`][^'"`]+['"`]|\[[^\]]+\])\s*,(.*)/);
    if (match) {
      const method = match[1].toUpperCase();
      let rawPath = match[2].trim().replace(/['"`]/g, '');
      const rest = match[3].trim();
      const hasRequireAdminToken = rest.includes('requireAdminToken') || rest.includes('guard');
      const hasRequireUserToken = rest.includes('requireUserToken');
      extractedRoutes.push({
        source: `routes/${file}`,
        line: index + 1,
        method,
        path: rawPath,
        hasRequireAdminToken,
        hasRequireUserToken,
        rawArgs: rest.slice(0, 100)
      });
    }
  });
});

console.log(`Total HTTP route handlers detected: ${extractedRoutes.length}`);

// 3. Filter Admin Routes (/api/admin/* or routes intended for admin)
const adminRoutes = extractedRoutes.filter(r => r.path.startsWith('/api/admin') || r.path.includes('admin'));

console.log(`\n--- ADMIN ROUTES FOUND (${adminRoutes.length}) ---`);
const unauthenticatedAdminRoutes = adminRoutes.filter(r => {
  // Public admin endpoints allowed without token: /api/admin/login, /api/admin/logout, and page 404s
  if (r.path === '/api/admin/login') return false;
  if (r.path === '/api/admin/logout') return false;
  if (r.path === '/admin' || r.path === '/admin.html') return false;
  return !r.hasRequireAdminToken;
});

if (unauthenticatedAdminRoutes.length === 0) {
  console.log('✔ All /api/admin/* API routes declare requireAdminToken (or guard)!');
} else {
  console.log(`❌ WARNING: Found ${unauthenticatedAdminRoutes.length} /api/admin routes without requireAdminToken:`);
  unauthenticatedAdminRoutes.forEach(r => {
    console.log(`   ${r.method} ${r.path} [${r.source}:${r.line}] -> ${r.rawArgs}`);
  });
}

// 4. Check catalog / product / artwork / store admin mutations
const contentModificationRoutes = extractedRoutes.filter(r => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(r.method)) {
    if (r.path.startsWith('/api/products') || 
        r.path.startsWith('/api/artworks') || 
        r.path.startsWith('/api/categories') ||
        r.path.startsWith('/api/courses') ||
        r.path.startsWith('/api/coupons') ||
        r.path.startsWith('/api/news') ||
        r.path.startsWith('/api/upload')) {
      return true;
    }
  }
  return false;
});

console.log(`\n--- CATALOG / CONTENT MUTATION ROUTES (${contentModificationRoutes.length}) ---`);
contentModificationRoutes.forEach(r => {
  const status = r.hasRequireAdminToken ? '✔ PROTECTED (requireAdminToken)' : 
                (r.hasRequireUserToken ? '⚠ USER PROTECTED (requireUserToken)' : '❌ UNPROTECTED');
  console.log(`   ${r.method.padEnd(6)} ${r.path.padEnd(35)} [${r.source}:${r.line}] -> ${status}`);
});

// 5. Output summary
console.log('\nScan complete.');
