const express = require('express');
const router = express.Router();

const FEEDBACK_STATUSES = ['Pending', 'Reviewed', 'Resolved', 'Flagged'];
const MAX_MESSAGE_LENGTH = 2000;
const MAX_REPLY_LENGTH = 2000;
const MAX_CATEGORY_LENGTH = 100;
const COMMUNITY_VISIBILITY = ['Public', 'Hidden'];

module.exports = function (prisma, requireUserToken, requireAdminToken) {
  // =========================================================================
  // 1. CUSTOMER: SUBMIT FEEDBACK (profile page)
  // =========================================================================
  router.post('/api/feedback', requireUserToken, async (req, res) => {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    const category = (typeof req.body?.category === 'string' ? req.body.category.trim() : '') || 'General';
    const rating = Number.parseInt(req.body?.rating, 10);

    if (!message) {
      return res.status(400).json({ error: 'Please write your feedback before submitting.' });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ error: `Feedback must be ${MAX_MESSAGE_LENGTH} characters or fewer.` });
    }
    if (category.length > MAX_CATEGORY_LENGTH) {
      return res.status(400).json({ error: 'Category is too long.' });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Please log in to your account.' });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, username: true, email: true }
      });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized: Please log in to your account.' });
      }

      const feedback = await prisma.feedback.create({
        data: {
          userId: user.id,
          customerName: user.name || user.username || 'Customer',
          customerEmail: user.email,
          category,
          rating,
          message,
          status: 'Pending'
        }
      });

      return res.status(201).json({ success: true, message: 'Thanks for your feedback.', feedback });
    } catch (err) {
      console.error('Error saving customer feedback:', err);
      return res.status(500).json({ error: 'Failed to submit feedback. Please try again.' });
    }
  });

  // =========================================================================
  // 2. CUSTOMER: LIST OWN FEEDBACK (includes admin replies)
  // =========================================================================
  router.get('/api/users/me/feedback', requireUserToken, async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Please log in to your account.' });
    }

    try {
      const feedback = await prisma.feedback.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          category: true,
          rating: true,
          message: true,
          status: true,
          adminReply: true,
          adminReplyAt: true,
          createdAt: true
        }
      });
      return res.json({ success: true, feedback });
    } catch (err) {
      console.error('Error loading customer feedback:', err);
      return res.status(500).json({ error: 'Failed to load feedback.' });
    }
  });

  // =========================================================================
  // 3. ADMIN: LIST PROFILE FEEDBACK AND COMMUNITY REVIEWS (optional ?status= filter)
  // =========================================================================
  router.get('/api/admin/feedback', requireAdminToken, async (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : '';
    const wantsProfile = !status || FEEDBACK_STATUSES.includes(status);
    const wantsCommunity = !status || COMMUNITY_VISIBILITY.includes(status);

    try {
      const [profile, community] = await Promise.all([
        wantsProfile
          ? prisma.feedback.findMany({ where: status ? { status } : {}, orderBy: { createdAt: 'desc' } })
          : [],
        wantsCommunity
          ? prisma.communityReview.findMany({
              where: status ? { isPublic: status === 'Public' } : {},
              orderBy: { createdAt: 'desc' }
            })
          : []
      ]);

      const rows = [
        ...profile.map((f) => ({ ...f, source: 'profile' })),
        ...community.map((c) => ({
          source: 'community',
          id: c.id,
          customerName: c.author,
          customerEmail: c.email,
          category: c.category,
          rating: c.rating,
          title: c.title,
          message: c.text,
          status: c.isPublic ? 'Public' : 'Hidden',
          adminReply: null,
          adminReplyAt: null,
          createdAt: c.createdAt
        }))
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return res.json({ success: true, feedback: rows });
    } catch (err) {
      console.error('Error listing feedback:', err);
      return res.status(500).json({ error: 'Failed to load feedback.' });
    }
  });

  // =========================================================================
  // 4. ADMIN: UPDATE STATUS AND REPLY (empty reply clears it)
  // =========================================================================
  router.patch('/api/admin/feedback/:id', requireAdminToken, async (req, res) => {
    const feedbackId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(feedbackId)) {
      return res.status(400).json({ error: 'Invalid feedback ID.' });
    }

    const hasStatus = req.body?.status !== undefined;
    if (hasStatus && !FEEDBACK_STATUSES.includes(req.body.status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const hasReply = typeof req.body?.adminReply === 'string';
    const reply = hasReply ? req.body.adminReply.trim() : '';
    if (reply.length > MAX_REPLY_LENGTH) {
      return res.status(400).json({ error: `Reply must be ${MAX_REPLY_LENGTH} characters or fewer.` });
    }

    try {
      const existing = await prisma.feedback.findUnique({ where: { id: feedbackId } });
      if (!existing) {
        return res.status(404).json({ error: 'Feedback not found.' });
      }

      const data = {};
      if (hasStatus) data.status = req.body.status;
      if (hasReply) {
        const adminReply = reply || null;
        const replyChanged = (existing.adminReply || null) !== adminReply;
        data.adminReply = adminReply;
        data.adminReplyAt = replyChanged ? (adminReply ? new Date() : null) : existing.adminReplyAt;
      }

      const feedback = await prisma.feedback.update({ where: { id: feedbackId }, data });
      return res.json({ success: true, message: 'Feedback updated.', feedback });
    } catch (err) {
      console.error('Error updating feedback:', err);
      return res.status(500).json({ error: 'Failed to update feedback.' });
    }
  });

  // =========================================================================
  // 5. ADMIN: SHOW OR HIDE A COMMUNITY REVIEW
  // =========================================================================
  router.patch('/api/admin/feedback/community/:id', requireAdminToken, async (req, res) => {
    if (typeof req.body?.isPublic !== 'boolean') {
      return res.status(400).json({ error: 'isPublic must be true or false.' });
    }

    try {
      const review = await prisma.communityReview.update({
        where: { id: req.params.id },
        data: { isPublic: req.body.isPublic }
      });
      return res.json({ success: true, message: 'Visibility updated.', review });
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Review not found.' });
      }
      console.error('Error updating community review:', err);
      return res.status(500).json({ error: 'Failed to update review.' });
    }
  });

  // =========================================================================
  // 6. ADMIN: DELETE FEEDBACK OR COMMUNITY REVIEW
  // =========================================================================
  router.delete('/api/admin/feedback/community/:id', requireAdminToken, async (req, res) => {
    try {
      await prisma.communityReview.delete({ where: { id: req.params.id } });
      return res.json({ success: true, message: 'Review deleted.' });
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Review not found.' });
      }
      console.error('Error deleting community review:', err);
      return res.status(500).json({ error: 'Failed to delete review.' });
    }
  });

  router.delete('/api/admin/feedback/:id', requireAdminToken, async (req, res) => {
    const feedbackId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(feedbackId)) {
      return res.status(400).json({ error: 'Invalid feedback ID.' });
    }

    try {
      await prisma.feedback.delete({ where: { id: feedbackId } });
      return res.json({ success: true, message: 'Feedback deleted.' });
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Feedback not found.' });
      }
      console.error('Error deleting feedback:', err);
      return res.status(500).json({ error: 'Failed to delete feedback.' });
    }
  });

  return router;
};
