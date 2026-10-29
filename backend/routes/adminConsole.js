const express = require('express');

// Admin console CRUD routes for models that had no admin endpoints:
//   MotionRig (motion + rigs), DesignPollSuggestion (polls), Donation (read-only list).
// All routes require an admin token.
module.exports = function (prisma, requireAdminToken) {
  const router = express.Router();
  const MOTION_TYPES = ['motion', 'rig'];
  const MOTION_STATUSES = ['Active', 'Draft', 'Archived'];
  const POLL_STATUSES = ['Pending', 'Approved', 'Rejected', 'Implemented'];

  const str = (v) => (v === undefined || v === null ? '' : String(v).trim());
  const optStr = (v) => (str(v) || null);
  const handleError = (res, label, err) => {
    console.error(`[AdminConsole] ${label} failed:`, err);
    return res.status(500).json({ error: `Failed to ${label}` });
  };

  // ---------------------------------------------------------------------
  // Motion & rigs (MotionRig model)
  // ---------------------------------------------------------------------
  router.get('/api/admin/motion-rigs', requireAdminToken, async (req, res) => {
    try {
      const where = MOTION_TYPES.includes(req.query.type) ? { type: req.query.type } : {};
      const items = await prisma.motionRig.findMany({ where, orderBy: { createdAt: 'desc' } });
      res.json(items);
    } catch (err) {
      handleError(res, 'load motion and rigs', err);
    }
  });

  router.post('/api/admin/motion-rigs', requireAdminToken, async (req, res) => {
    try {
      const { title, type, format, status, img, videoUrl, duration, description } = req.body || {};
      if (!str(title) || !MOTION_TYPES.includes(type) || !str(format) || !str(img)) {
        return res.status(400).json({ error: 'title, type (motion|rig), format and img are required' });
      }
      const item = await prisma.motionRig.create({
        data: {
          title: str(title),
          type,
          format: str(format),
          status: MOTION_STATUSES.includes(status) ? status : 'Active',
          img: str(img),
          videoUrl: optStr(videoUrl),
          duration: optStr(duration),
          description: optStr(description)
        }
      });
      res.status(201).json(item);
    } catch (err) {
      handleError(res, 'create motion or rig', err);
    }
  });

  router.put('/api/admin/motion-rigs/:id', requireAdminToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
      const { title, type, format, status, img, videoUrl, duration, description } = req.body || {};
      const data = {};
      if (title !== undefined) data.title = str(title);
      if (type !== undefined) {
        if (!MOTION_TYPES.includes(type)) return res.status(400).json({ error: 'Invalid type' });
        data.type = type;
      }
      if (format !== undefined) data.format = str(format);
      if (status !== undefined) {
        if (!MOTION_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
        data.status = status;
      }
      if (img !== undefined) data.img = str(img);
      if (videoUrl !== undefined) data.videoUrl = optStr(videoUrl);
      if (duration !== undefined) data.duration = optStr(duration);
      if (description !== undefined) data.description = optStr(description);
      const item = await prisma.motionRig.update({ where: { id }, data });
      res.json(item);
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Not found' });
      handleError(res, 'update motion or rig', err);
    }
  });

  router.delete('/api/admin/motion-rigs/:id', requireAdminToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
      await prisma.motionRig.delete({ where: { id } });
      res.json({ success: true });
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Not found' });
      handleError(res, 'delete motion or rig', err);
    }
  });

  // ---------------------------------------------------------------------
  // Design poll suggestions (DesignPollSuggestion model)
  // ---------------------------------------------------------------------
  router.get('/api/admin/polls', requireAdminToken, async (req, res) => {
    try {
      const items = await prisma.designPollSuggestion.findMany({ orderBy: { createdAt: 'desc' } });
      res.json(items);
    } catch (err) {
      handleError(res, 'load polls', err);
    }
  });

  router.post('/api/admin/polls', requireAdminToken, async (req, res) => {
    try {
      const { suggestion, date, status } = req.body || {};
      if (!str(suggestion) || !str(date)) {
        return res.status(400).json({ error: 'suggestion and date are required' });
      }
      const item = await prisma.designPollSuggestion.create({
        data: {
          suggestion: str(suggestion),
          date: str(date),
          status: POLL_STATUSES.includes(status) ? status : 'Pending'
        }
      });
      res.status(201).json(item);
    } catch (err) {
      handleError(res, 'create poll', err);
    }
  });

  router.put('/api/admin/polls/:id', requireAdminToken, async (req, res) => {
    try {
      const { suggestion, date, status } = req.body || {};
      const data = {};
      if (suggestion !== undefined) data.suggestion = str(suggestion);
      if (date !== undefined) data.date = str(date);
      if (status !== undefined) {
        if (!POLL_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
        data.status = status;
      }
      const item = await prisma.designPollSuggestion.update({ where: { id: req.params.id }, data });
      res.json(item);
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Not found' });
      handleError(res, 'update poll', err);
    }
  });

  router.delete('/api/admin/polls/:id', requireAdminToken, async (req, res) => {
    try {
      await prisma.designPollSuggestion.delete({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Not found' });
      handleError(res, 'delete poll', err);
    }
  });

  // ---------------------------------------------------------------------
  // Donations (read-only, Donation model)
  // ---------------------------------------------------------------------
  router.get('/api/admin/donations', requireAdminToken, async (req, res) => {
    try {
      const items = await prisma.donation.findMany({ orderBy: { createdAt: 'desc' } });
      res.json(items);
    } catch (err) {
      handleError(res, 'load donations', err);
    }
  });

  return router;
};
