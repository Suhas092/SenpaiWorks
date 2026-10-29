const crypto = require('crypto');
const path = require('path');


// Staff roles. The super administrator (ADMIN_USERNAME) is not a staff role and keeps full access.
//   admin        - full access, the same as the super administrator (every page, team, payments, settings).
//   junior_admin - access only to the pages granted to the member: 'view' (read) or 'edit' (read and write).
const ROLES = {
  admin: {
    label: 'Admin',
    description: 'Full access to every page, including team, roles, payments and site settings. Same as the super administrator.'
  },
  junior_admin: {
    label: 'Junior admin',
    description: 'Access only to the pages chosen for this member, each as view only or with edit rights.'
  }
};

// Console pages that can be granted to a junior admin. Keys are stored in StaffMember.pageAccess.
// Each page lists the API route prefixes it calls.
const PAGES = {
  dashboard: { label: 'Overview', paths: ['/api/admin/dashboard', '/api/admin/stats', '/api/admin/metrics'] },
  home: { label: 'Home page', paths: ['/api/admin/homepage', '/api/admin/courses', '/api/admin/faqs'] },
  products: { label: 'Products', paths: ['/api/products', '/api/categories'] },
  orders: { label: 'Orders', paths: ['/api/admin/orders'] },
  replacements: { label: 'Replacements', paths: ['/api/admin/replacements'] },
  reviews: { label: 'Product reviews', paths: ['/api/admin/reviews', '/api/admin/feedback', '/api/feedback/reply'] },
  community: { label: 'Community', paths: ['/api/community'] },
  polls: { label: 'Polls', paths: ['/api/admin/polls'] },
  art: { label: 'Art library', paths: ['/api/artworks'] },
  motion: { label: 'Motion & 3D rigs', paths: ['/api/admin/motion-rigs'] },
  news: { label: 'News & articles', paths: ['/api/admin/news'] },
  coupons: { label: 'Discounts & coupons', paths: ['/api/admin/coupons'] },
  donations: { label: 'Donations & patrons', paths: ['/api/admin/donations'] },
  customers: { label: 'Users & permissions', paths: ['/api/users'] }
};

const PAGE_KEYS = Object.keys(PAGES);
const ACCESS_LEVELS = ['view', 'edit'];
// Uploads are shared by every page, so any edit grant allows them.
const UPLOAD_PATHS = ['/api/upload'];

// Available to every signed-in staff member. Everything else (settings, team, trash, triggers) is denied.
const ALWAYS_ALLOWED = ['/api/admin/me', '/api/admin/profile', '/api/admin/alerts'];

const READ_METHODS = ['GET', 'HEAD', 'OPTIONS'];
const normalizePath = (pathname) => {
  if (!pathname || typeof pathname !== 'string') return '/';
  let cleaned = pathname.split('?')[0];
  try {
    cleaned = decodeURIComponent(cleaned);
  } catch (e) {}
  return path.posix.normalize(cleaned).replace(/\/+$/, '') || '/';
};
const matchesPrefix = (path, prefix) => path === prefix || path.startsWith(`${prefix}/`);
const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const isRole = (roleKey) => hasOwn(ROLES, roleKey);

// Roles with the same reach as the super administrator.
const hasFullAccess = (roleKey) => roleKey === 'admin';

// Page grants for a member. Admins hold edit on every page.
function grantsFor(roleKey, pageAccess) {
  if (roleKey === 'admin') return Object.fromEntries(PAGE_KEYS.map((key) => [key, 'edit']));
  if (roleKey === 'junior_admin' && pageAccess && typeof pageAccess === 'object') return pageAccess;
  return {};
}

// Highest access the member has on a path: 'edit', 'view', or null.
function levelFor(roleKey, pageAccess, path) {
  if (!isRole(roleKey)) return null;
  const grants = grantsFor(roleKey, pageAccess);
  if (UPLOAD_PATHS.some((prefix) => matchesPrefix(path, prefix))) {
    return Object.values(grants).includes('edit') ? 'edit' : null;
  }
  let level = null;
  for (const key of PAGE_KEYS) {
    if (!PAGES[key].paths.some((prefix) => matchesPrefix(path, prefix))) continue;
    if (grants[key] === 'edit') return 'edit';
    if (grants[key] === 'view') level = 'view';
  }
  return level;
}

// Read methods need view or edit. Any other method needs edit.
function canAccessPath(roleKey, pathname, method = 'GET', pageAccess = {}) {
  const path = normalizePath(pathname);
  if (hasFullAccess(roleKey)) return true;
  if (ALWAYS_ALLOWED.some((prefix) => matchesPrefix(path, prefix))) return true;
  const level = levelFor(roleKey, pageAccess, path);
  if (!level) return false;
  return level === 'edit' || READ_METHODS.includes(String(method).toUpperCase());
}

// Per-page access for the /me response: { pageKey: 'view' | 'edit' }.
function pagesFor(roleKey, pageAccess) {
  const grants = grantsFor(roleKey, pageAccess);
  return Object.fromEntries(PAGE_KEYS.filter((key) => grants[key]).map((key) => [key, grants[key]]));
}

// Validates a page access map from a request. 'none' means no access and is dropped.
function normalizePageAccess(input) {
  if (input === undefined || input === null) return { grants: {} };
  if (typeof input !== 'object' || Array.isArray(input)) return { error: 'Page access must be an object.' };
  const grants = {};
  for (const [key, level] of Object.entries(input)) {
    if (!hasOwn(PAGES, key)) return { error: `Unknown page "${key}".` };
    if (level === 'none') continue;
    if (!ACCESS_LEVELS.includes(level)) {
      return { error: `Access for "${PAGES[key].label}" must be none, view or edit.` };
    }
    grants[key] = level;
  }
  return { grants };
}

function roleList() {
  return Object.entries(ROLES).map(([key, role]) => ({
    key,
    label: role.label,
    description: role.description
  }));
}

function pageList() {
  return PAGE_KEYS.map((key) => ({ key, label: PAGES[key].label }));
}

// "Priya Sharma" -> "priya.sharma"
function usernameBase(name) {
  const slug = String(name || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 20);
  return slug || 'staff';
}

// Unambiguous characters only (no 0/O, 1/l/I).
const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

function generatePassword(length = 12) {
  let password = '';
  for (let i = 0; i < length; i += 1) {
    password += PASSWORD_ALPHABET[crypto.randomInt(PASSWORD_ALPHABET.length)];
  }
  return password;
}

function generateUsernameSuffix() {
  return String(crypto.randomInt(100, 1000));
}

module.exports = {
  ROLES,
  PAGES,
  isRole,
  hasFullAccess,
  pagesFor,
  normalizePageAccess,
  canAccessPath,
  roleList,
  pageList,
  usernameBase,
  generatePassword,
  generateUsernameSuffix
};
