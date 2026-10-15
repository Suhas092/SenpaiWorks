const express = require('express');
const bcrypt = require('bcryptjs');
const staffAccess = require('../utils/staffAccess');

// Admin site settings persisted as key/value rows in the SiteSetting table.
// Alert toggles decide which notification types appear in the admin bell.
const ALERT_TOGGLES = {
  orderCreated: 'order_created',
  replacementRequested: 'replacement_requested',
  reviewReported: 'review_reported'
};
// Types shown in the admin bell before any toggle is applied.
const ADMIN_FEED_TYPES = ['order_created', 'replacement_requested', 'donation_received', 'review_reported'];
const DEFAULTS = { storeName: 'SenpaiWorks', supportEmail: '', supportPhone: '' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function loadSettings(prisma) {
  const rows = await prisma.siteSetting.findMany();
  const stored = new Map(rows.map((row) => [row.key, row.value]));
  const pick = (key) => (stored.has(key) ? stored.get(key) : DEFAULTS[key]);
  return {
    storeName: pick('storeName'),
    supportEmail: pick('supportEmail'),
    supportPhone: pick('supportPhone'),
    alerts: Object.fromEntries(
      Object.keys(ALERT_TOGGLES).map((key) => [key, stored.get(`alerts.${key}`) !== false])
    )
  };
}

// Where clause for the admin bell feed, excluding alert types the admin has switched off.
async function adminAlertWhere(prisma) {
  const { alerts } = await loadSettings(prisma);
  const hidden = Object.entries(alerts)
    .filter(([, enabled]) => !enabled)
    .map(([key]) => ALERT_TOGGLES[key]);
  return {
    deletedAt: null,
    AND: [
      { OR: [{ userEmail: 'suhas_admin' }, { type: { in: ADMIN_FEED_TYPES } }] },
      { type: { notIn: hidden } }
    ]
  };
}

const text = (v) => (typeof v === 'string' ? v.trim() : null);

function validateUpdates(body) {
  const updates = {};

  if (body.storeName !== undefined) {
    const v = text(body.storeName);
    if (!v || v.length > 80) return { error: 'Store name must be 1-80 characters.' };
    updates.storeName = v;
  }
  if (body.supportEmail !== undefined) {
    const v = text(body.supportEmail);
    if (v === null || v.length > 254 || (v && !EMAIL_RE.test(v))) {
      return { error: 'Support email is not valid.' };
    }
    updates.supportEmail = v;
  }
  if (body.supportPhone !== undefined) {
    const v = text(body.supportPhone);
    if (v === null || v.length > 30) return { error: 'Support phone must be 30 characters or fewer.' };
    updates.supportPhone = v;
  }
  if (body.alerts !== undefined) {
    if (!body.alerts || typeof body.alerts !== 'object' || Array.isArray(body.alerts)) {
      return { error: 'Alerts must be an object.' };
    }
    for (const key of Object.keys(ALERT_TOGGLES)) {
      if (body.alerts[key] === undefined) continue;
      if (typeof body.alerts[key] !== 'boolean') {
        return { error: `Alert setting "${key}" must be true or false.` };
      }
      updates[`alerts.${key}`] = body.alerts[key];
    }
  }
  return { updates };
}

const PROFILE_KEYS = {
  name: 'adminProfile.name',
  email: 'adminProfile.email',
  phone: 'adminProfile.phone',
  avatar: 'adminProfile.avatar'
};
const PROFILE_DEFAULTS = { name: 'Suhas H', email: 'admin@senpaiworks.com', phone: '', avatar: '' };
const PASSWORD_HASH_KEY = 'adminPasswordHash';
const ACCESS_PRIVILEGES = 'Super Administrator';

async function loadProfile(prisma, username) {
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: Object.values(PROFILE_KEYS) } } });
  const stored = new Map(rows.map((row) => [row.key, row.value]));
  const pick = (field) =>
    stored.has(PROFILE_KEYS[field]) ? stored.get(PROFILE_KEYS[field]) : PROFILE_DEFAULTS[field];
  return {
    name: pick('name'),
    email: pick('email'),
    phone: pick('phone'),
    avatar: pick('avatar'),
    username,
    role: 'admin',
    roleLabel: ACCESS_PRIVILEGES,
    accessPrivileges: ACCESS_PRIVILEGES
  };
}

async function loadAdminPasswordHash(prisma) {
  const row = await prisma.siteSetting.findUnique({ where: { key: PASSWORD_HASH_KEY } });
  return typeof row?.value === 'string' && row.value ? row.value : null;
}

// Super administrator password check: stored hash first, then the ADMIN_PASSWORD_HASH env fallback used by login.
async function verifyAdminPassword(prisma, password) {
  const hash = (await loadAdminPasswordHash(prisma)) || process.env.ADMIN_PASSWORD_HASH || '';
  return bcrypt.compare(password, hash);
}

function validateProfile(body) {
  const rows = {};
  let password = null;

  if (body.name !== undefined) {
    const v = text(body.name);
    if (!v || v.length > 80) return { error: 'Admin name must be 1-80 characters.' };
    rows[PROFILE_KEYS.name] = v;
  }
  if (body.email !== undefined) {
    const v = text(body.email);
    if (!v || v.length > 254 || !EMAIL_RE.test(v)) return { error: 'Admin email is not valid.' };
    rows[PROFILE_KEYS.email] = v;
  }
  if (body.phone !== undefined) {
    const v = text(body.phone);
    if (v === null || v.length > 30) return { error: 'Phone number must be 30 characters or fewer.' };
    rows[PROFILE_KEYS.phone] = v;
  }
  if (body.avatar !== undefined) {
    const v = text(body.avatar);
    if (v === null || v.length > 500 || (v && !/^https?:\/\//i.test(v))) {
      return { error: 'Avatar must be an http(s) URL or left empty.' };
    }
    rows[PROFILE_KEYS.avatar] = v;
  }
  if (typeof body.password === 'string' && body.password !== '') {
    if (body.password.length < 8 || body.password.length > 200) {
      return { error: 'New password must be 8-200 characters.' };
    }
    password = body.password;
  }
  return { rows, password };
}

// Staff profile: name, email and password only. Role is assigned by the super administrator.
async function loadStaffProfile(prisma, staffId) {
  const member = await prisma.staffMember.findUnique({ where: { id: staffId } });
  if (!member) return null;
  const roleLabel = staffAccess.ROLES[member.role]?.label ?? member.role;
  return {
    name: member.name,
    email: member.email ?? '',
    phone: member.phone ?? '',
    avatar: member.avatar ?? '',
    username: member.username,
    role: member.role,
    roleLabel,
    accessPrivileges: roleLabel,
    pages: staffAccess.pagesFor(member.role, member.pageAccess)
  };
}

async function updateStaffProfile(prisma, staffId, body) {
  const data = {};
  if (body.name !== undefined) {
    const v = text(body.name);
    if (!v || v.length > 80) return { error: 'Name must be 1-80 characters.' };
    data.name = v;
  }
  if (body.email !== undefined) {
    const v = text(body.email);
    if (v && (v.length > 254 || !EMAIL_RE.test(v))) return { error: 'Email is not valid.' };
    data.email = v || null;
  }
  if (body.phone !== undefined) {
    const v = text(body.phone);
    if (v && v.length > 30) return { error: 'Phone number must be 30 characters or fewer.' };
    data.phone = v || null;
  }
  if (typeof body.password === 'string' && body.password !== '') {
    if (body.password.length < 8 || body.password.length > 200) {
      return { error: 'New password must be 8-200 characters.' };
    }
    if (typeof body.currentPassword !== 'string' || !body.currentPassword) {
      return { error: 'Enter your current password to set a new one.' };
    }
    const member = await prisma.staffMember.findUnique({ where: { id: staffId } });
    if (!member || !(await bcrypt.compare(body.currentPassword, member.passwordHash))) {
      return { error: 'Current password is incorrect.' };
    }
    data.passwordHash = await bcrypt.hash(body.password, 10);
  }
  if (Object.keys(data).length) {
    await prisma.staffMember.update({ where: { id: staffId }, data });
  }
  return { profile: await loadStaffProfile(prisma, staffId) };
}

module.exports = function (prisma, requireAdminToken) {
  const router = express.Router();

  router.get('/api/admin/settings', requireAdminToken, async (req, res) => {
    try {
      res.json(await loadSettings(prisma));
    } catch (err) {
      console.error('[SiteSettings] load failed:', err);
      res.status(500).json({ error: 'Failed to load settings' });
    }
  });

  router.put('/api/admin/settings', requireAdminToken, async (req, res) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { updates, error } = validateUpdates(body);
    if (error) return res.status(400).json({ error });

    try {
      await prisma.$transaction(
        Object.entries(updates).map(([key, value]) =>
          prisma.siteSetting.upsert({
            where: { key },
            create: { key, value },
            update: { value }
          })
        )
      );
      res.json(await loadSettings(prisma));
    } catch (err) {
      console.error('[SiteSettings] save failed:', err);
      res.status(500).json({ error: 'Failed to save settings' });
    }
  });

  router.get('/api/admin/profile', requireAdminToken, async (req, res) => {
    try {
      if (req.adminUser?.staffId) {
        const profile = await loadStaffProfile(prisma, req.adminUser.staffId);
        if (!profile) return res.status(404).json({ error: 'Profile not found.' });
        return res.json(profile);
      }
      res.json(await loadProfile(prisma, req.adminUser.username));
    } catch (err) {
      console.error('[AdminProfile] load failed:', err);
      res.status(500).json({ error: 'Failed to load admin profile' });
    }
  });

  router.put('/api/admin/profile', requireAdminToken, async (req, res) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    if (req.adminUser?.staffId) {
      try {
        const { profile, error: staffError } = await updateStaffProfile(prisma, req.adminUser.staffId, body);
        if (staffError) return res.status(400).json({ error: staffError });
        return res.json(profile);
      } catch (err) {
        console.error('[StaffProfile] save failed:', err);
        return res.status(500).json({ error: 'Failed to save profile' });
      }
    }
    const { rows, password, error } = validateProfile(body);
    if (error) return res.status(400).json({ error });

    try {
      if (password) {
        if (typeof body.currentPassword !== 'string' || !body.currentPassword) {
          return res.status(400).json({ error: 'Enter your current password to set a new one.' });
        }
        if (!(await verifyAdminPassword(prisma, body.currentPassword))) {
          return res.status(400).json({ error: 'Current password is incorrect.' });
        }
      }
      const writes = { ...rows };
      if (password) writes[PASSWORD_HASH_KEY] = await bcrypt.hash(password, 10);
      if (Object.keys(writes).length) {
        await prisma.$transaction(
          Object.entries(writes).map(([key, value]) =>
            prisma.siteSetting.upsert({ where: { key }, create: { key, value }, update: { value } })
          )
        );
      }
      res.json(await loadProfile(prisma, req.adminUser.username));
    } catch (err) {
      console.error('[AdminProfile] save failed:', err);
      res.status(500).json({ error: 'Failed to save admin profile' });
    }
  });

  return router;
};

module.exports.adminAlertWhere = adminAlertWhere;
module.exports.loadAdminPasswordHash = loadAdminPasswordHash;
module.exports.loadAdminProfile = loadProfile;
module.exports.ADMIN_AVATAR_KEY = PROFILE_KEYS.avatar;
