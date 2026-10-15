const express = require('express');
const bcrypt = require('bcryptjs');
const staffAccess = require('../utils/staffAccess');

// Team management: the super administrator creates staff accounts with generated
// usernames and passwords, assigns a role, and can reset, deactivate or remove them.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const superUsername = () => process.env.ADMIN_USERNAME || 'suhas_admin';

const publicMember = (member) => ({
  id: member.id,
  name: member.name,
  email: member.email,
  username: member.username,
  role: member.role,
  roleLabel: staffAccess.ROLES[member.role]?.label ?? member.role,
  pageAccess: staffAccess.pagesFor(member.role, member.pageAccess),
  isActive: member.isActive,
  createdAt: member.createdAt,
  lastLoginAt: member.lastLoginAt
});

const text = (v) => (typeof v === 'string' ? v.trim() : null);

function validateFields(body, { requireAll }) {
  const data = {};
  if (requireAll || body.name !== undefined) {
    const name = text(body.name);
    if (!name || name.length > 80) return { error: 'Name must be 1-80 characters.' };
    data.name = name;
  }
  if (body.email !== undefined) {
    const email = text(body.email);
    if (email && (email.length > 254 || !EMAIL_RE.test(email))) return { error: 'Email is not valid.' };
    data.email = email || null;
  }
  if (requireAll || body.role !== undefined) {
    if (!staffAccess.isRole(body.role)) return { error: 'Choose a valid role.' };
    data.role = body.role;
  }
  if (body.isActive !== undefined) {
    if (typeof body.isActive !== 'boolean') return { error: 'isActive must be true or false.' };
    data.isActive = body.isActive;
  }
  return { data };
}

// Junior admins need at least one granted page. Admins hold no page grants, so their map is stored empty.
function resolveAccess(role, pageAccessInput) {
  if (role !== 'junior_admin') return { pageAccess: {} };
  const { grants, error } = staffAccess.normalizePageAccess(pageAccessInput);
  if (error) return { error };
  if (Object.keys(grants).length === 0) return { error: 'Choose at least one page for this junior admin.' };
  return { pageAccess: grants };
}

async function uniqueUsername(prisma, name) {
  const base = staffAccess.usernameBase(name);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = `${base}${staffAccess.generateUsernameSuffix()}`;
    if (candidate === superUsername()) continue;
    const taken = await prisma.staffMember.findUnique({ where: { username: candidate }, select: { id: true } });
    if (!taken) return candidate;
  }
  throw new Error('Could not generate a unique username');
}

module.exports = function (prisma, requireAdminToken) {
  const router = express.Router();

  const requireSuperAdmin = (req, res, next) => {
    if (req.adminUser?.isSuper) return next();
    return res.status(403).json({ error: 'Only the super administrator can manage team members.' });
  };
  const guard = [requireAdminToken, requireSuperAdmin];

  const parseId = (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid team member id.' });
      return null;
    }
    return id;
  };

  router.get('/api/admin/staff', guard, async (req, res) => {
    try {
      const members = await prisma.staffMember.findMany({ orderBy: { createdAt: 'desc' } });
      res.json({
        members: members.map(publicMember),
        roles: staffAccess.roleList(),
        pages: staffAccess.pageList()
      });
    } catch (err) {
      console.error('[Staff] list failed:', err);
      res.status(500).json({ error: 'Failed to load team members' });
    }
  });

  // Creates the account and returns the generated password once. Only the hash is stored.
  router.post('/api/admin/staff', guard, async (req, res) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { data, error } = validateFields(body, { requireAll: true });
    if (error) return res.status(400).json({ error });
    const access = resolveAccess(data.role, body.pageAccess);
    if (access.error) return res.status(400).json({ error: access.error });

    try {
      const username = await uniqueUsername(prisma, data.name);
      const password = staffAccess.generatePassword();
      const member = await prisma.staffMember.create({
        data: {
          ...data,
          pageAccess: access.pageAccess,
          username,
          passwordHash: await bcrypt.hash(password, 10),
          isActive: true
        }
      });
      res.status(201).json({ member: publicMember(member), credentials: { username, password } });
    } catch (err) {
      console.error('[Staff] create failed:', err);
      res.status(500).json({ error: 'Failed to create team member' });
    }
  });

  router.post('/api/admin/staff/:id/reset-password', guard, async (req, res) => {
    const id = parseId(req, res);
    if (!id) return;
    try {
      const password = staffAccess.generatePassword();
      const member = await prisma.staffMember.update({
        where: { id },
        data: { passwordHash: await bcrypt.hash(password, 10) }
      });
      res.json({ member: publicMember(member), credentials: { username: member.username, password } });
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Team member not found.' });
      console.error('[Staff] reset failed:', err);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });

  router.patch('/api/admin/staff/:id', guard, async (req, res) => {
    const id = parseId(req, res);
    if (!id) return;
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { data, error } = validateFields(body, { requireAll: false });
    if (error) return res.status(400).json({ error });
    if (body.pageAccess !== undefined) {
      const normalized = staffAccess.normalizePageAccess(body.pageAccess);
      if (normalized.error) return res.status(400).json({ error: normalized.error });
      data.pageAccess = normalized.grants;
    }
    if (Object.keys(data).length === 0) return res.status(400).json({ error: 'Nothing to update.' });

    try {
      // Role or page changes are checked against the member's resulting role and pages.
      if (data.role !== undefined || data.pageAccess !== undefined) {
        const existing = await prisma.staffMember.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ error: 'Team member not found.' });
        const access = resolveAccess(data.role ?? existing.role, data.pageAccess ?? existing.pageAccess);
        if (access.error) return res.status(400).json({ error: access.error });
        data.pageAccess = access.pageAccess;
      }
      const member = await prisma.staffMember.update({ where: { id }, data });
      res.json({ member: publicMember(member) });
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Team member not found.' });
      console.error('[Staff] update failed:', err);
      res.status(500).json({ error: 'Failed to update team member' });
    }
  });

  router.delete('/api/admin/staff/:id', guard, async (req, res) => {
    const id = parseId(req, res);
    if (!id) return;
    try {
      await prisma.staffMember.delete({ where: { id } });
      res.json({ success: true });
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Team member not found.' });
      console.error('[Staff] delete failed:', err);
      res.status(500).json({ error: 'Failed to remove team member' });
    }
  });

  return router;
};
