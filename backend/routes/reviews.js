const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

// XSS HTML entity escaper
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Rate limiter for review submissions and modifications
const reviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: { error: 'Too many review requests. Please wait a few minutes before trying again.' }
});

module.exports = function (prisma, requireUserToken, requireAdminToken, JWT_SECRET) {
  // Helper: Optional user ID extractor from cookie or header
  function extractOptionalUserId(req) {
    let token = req.cookies?.userToken;
    if (!token && req.headers['authorization']) {
      const authHeader = req.headers['authorization'];
      token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    }
    if (!token) return null;
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded?.id || null;
    } catch (e) {
      return null;
    }
  }

  // Helper: Recomputes a product's rating and count across ALL Published reviews
  async function recomputeProductRating(tx, productId) {
    const agg = await tx.review.aggregate({
      where: { productId, status: 'Published' },
      _avg: { rating: true },
      _count: true
    });
    await tx.product.update({
      where: { id: productId },
      data: {
        rating: agg._avg.rating ? parseFloat(agg._avg.rating.toFixed(1)) : 5.0,
        ratingCount: agg._count
      }
    });
  }

  // =========================================================================
  // 1. PUBLIC PRODUCT REVIEWS ENDPOINT (with Star & Verified Filters)
  // =========================================================================
  router.get('/api/products/:id/reviews', async (req, res) => {
    const { id: productId } = req.params;
    const sort = req.query.sort || 'recent';
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 5);
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
    const starFilter = req.query.star ? parseInt(req.query.star, 10) : null;
    const verifiedOnly = req.query.verifiedOnly === 'true';

    try {
      // 1. Distribution & overall average across all published reviews for this product
      const allPublished = await prisma.review.findMany({
        where: { productId, status: 'Published' },
        select: { id: true, rating: true, orderItemId: true }
      });

      const totalCount = allPublished.length;
      const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      let sumRating = 0;

      for (const r of allPublished) {
        const star = Math.min(5, Math.max(1, Math.round(r.rating)));
        distribution[star] = (distribution[star] || 0) + 1;
        sumRating += r.rating;
      }

      const avgRating = totalCount > 0 ? parseFloat((sumRating / totalCount).toFixed(1)) : 5.0;

      // 2. Build where filter for paginated list
      const whereClause = {
        productId,
        status: 'Published'
      };

      if (starFilter && starFilter >= 1 && starFilter <= 5) {
        whereClause.rating = starFilter;
      }

      if (verifiedOnly) {
        whereClause.orderItemId = { not: null };
      }

      // 3. Define sorting
      let orderBy = [{ createdAt: 'desc' }];
      if (sort === 'highest') {
        orderBy = [{ rating: 'desc' }, { createdAt: 'desc' }];
      } else if (sort === 'lowest') {
        orderBy = [{ rating: 'asc' }, { createdAt: 'desc' }];
      } else if (sort === 'helpful') {
        orderBy = [{ helpfulCount: 'desc' }, { createdAt: 'desc' }];
      }

      // 4. Fetch filtered reviews
      const [reviews, filteredCount] = await Promise.all([
        prisma.review.findMany({
          where: whereClause,
          orderBy,
          skip: offset,
          take: limit,
          include: {
            user: {
              select: { id: true, name: true, username: true, avatar: true }
            },
            orderItem: {
              select: { variant: true }
            }
          }
        }),
        prisma.review.count({ where: whereClause })
      ]);

      // 5. Determine active user's helpful votes
      const currentUserId = extractOptionalUserId(req);
      let userVotedReviewIds = [];
      if (currentUserId && reviews.length > 0) {
        const reviewIds = reviews.map(r => r.id);
        const votes = await prisma.reviewHelpfulVote.findMany({
          where: {
            userId: currentUserId,
            reviewId: { in: reviewIds }
          },
          select: { reviewId: true }
        });
        userVotedReviewIds = votes.map(v => v.reviewId);
      }

      // Map reviews to include verifiedPurchase boolean
      const mappedReviews = reviews.map(rev => ({
        ...rev,
        verifiedPurchase: rev.orderItemId !== null,
        variant: rev.orderItem?.variant || null
      }));

      return res.json({
        reviews: mappedReviews,
        totalCount,
        filteredCount,
        avgRating,
        distribution,
        userVotedReviewIds
      });
    } catch (error) {
      console.error('Error fetching product reviews:', error);
      return res.status(500).json({ error: 'Failed to fetch reviews.' });
    }
  });

  // =========================================================================
  // 2. ELIGIBILITY & USER STATUS ENDPOINT
  // =========================================================================
  router.get('/api/products/:id/reviews/eligibility', requireUserToken, async (req, res) => {
    const { id: productId } = req.params;
    const userId = req.user.id;

    try {
      // 1. Check if user already reviewed this product
      const existingReview = await prisma.review.findUnique({
        where: {
          userId_productId: { userId, productId }
        },
        include: {
          user: {
            select: { id: true, name: true, username: true, avatar: true }
          },
          orderItem: {
            select: { variant: true }
          }
        }
      });

      // 2. Check if user has an order for this product (to know if it will be verified)
      const purchaseItem = await prisma.orderItem.findFirst({
        where: {
          productId,
          order: { customerId: userId }
        },
        select: { id: true, variant: true }
      });

      return res.json({
        eligible: true, // All authenticated users are eligible
        alreadyReviewed: !!existingReview,
        existingReview: existingReview ? {
          ...existingReview,
          verifiedPurchase: existingReview.orderItemId !== null,
          variant: existingReview.orderItem?.variant || null
        } : null,
        hasPurchase: !!purchaseItem,
        variant: purchaseItem?.variant || null
      });
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      return res.status(500).json({ error: 'Failed to verify review eligibility.' });
    }
  });

  // =========================================================================
  // 3. CREATE PRODUCT REVIEW (Open to all authenticated users)
  // =========================================================================
  router.post('/api/products/:id/reviews', requireUserToken, reviewLimiter, async (req, res) => {
    const { id: productId } = req.params;
    const userId = req.user.id;
    const { rating, title, text } = req.body;

    const parsedRating = parseInt(rating, 10);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }

    const cleanTitle = escapeHtml((title || '').trim());
    const cleanText = escapeHtml((text || '').trim());

    if (!cleanTitle || cleanTitle.length < 2) {
      return res.status(400).json({ error: 'Review title is required (minimum 2 characters).' });
    }
    if (cleanTitle.length > 150) {
      return res.status(400).json({ error: 'Review title must not exceed 150 characters.' });
    }

    if (!cleanText || cleanText.length < 5) {
      return res.status(400).json({ error: 'Review text is required (minimum 5 characters).' });
    }
    if (cleanText.length > 2000) {
      return res.status(400).json({ error: 'Review text must not exceed 2000 characters.' });
    }

    try {
      // 1. Guard against duplicate reviews
      const existing = await prisma.review.findUnique({
        where: { userId_productId: { userId, productId } }
      });
      if (existing) {
        return res.status(409).json({
          error: 'You have already reviewed this product. Please edit your existing review instead.'
        });
      }

      // 2. Check if user owns any OrderItem for this product (Verified Purchase link)
      const matchingOrderItem = await prisma.orderItem.findFirst({
        where: {
          productId,
          order: { customerId: userId }
        },
        select: { id: true, variant: true }
      });

      const orderItemId = matchingOrderItem ? matchingOrderItem.id : null;

      // 3. Create review & recalculate rating in transaction
      const result = await prisma.$transaction(async (tx) => {
        const review = await tx.review.create({
          data: {
            productId,
            userId,
            orderItemId,
            rating: parsedRating,
            title: cleanTitle,
            text: cleanText,
            status: 'Published',
            helpfulCount: 0
          },
          include: {
            user: {
              select: { id: true, name: true, username: true, avatar: true }
            },
            orderItem: {
              select: { variant: true }
            }
          }
        });

        await recomputeProductRating(tx, productId);

        return review;
      });

      return res.status(201).json({
        success: true,
        message: 'Your review has been published successfully.',
        review: {
          ...result,
          verifiedPurchase: result.orderItemId !== null,
          variant: result.orderItem?.variant || null
        }
      });
    } catch (error) {
      console.error('Error creating product review:', error);
      return res.status(500).json({ error: 'Failed to submit review.' });
    }
  });

  // =========================================================================
  // 4. EDIT PRODUCT REVIEW (Customer Protected)
  // =========================================================================
  router.put('/api/reviews/:id', requireUserToken, reviewLimiter, async (req, res) => {
    const reviewId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const { rating, title, text } = req.body;

    if (isNaN(reviewId)) {
      return res.status(400).json({ error: 'Invalid review ID.' });
    }

    const parsedRating = parseInt(rating, 10);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }

    const cleanTitle = escapeHtml((title || '').trim());
    const cleanText = escapeHtml((text || '').trim());

    if (!cleanTitle || cleanTitle.length < 2) {
      return res.status(400).json({ error: 'Review title is required (minimum 2 characters).' });
    }
    if (cleanTitle.length > 150) {
      return res.status(400).json({ error: 'Review title must not exceed 150 characters.' });
    }

    if (!cleanText || cleanText.length < 5) {
      return res.status(400).json({ error: 'Review text is required (minimum 5 characters).' });
    }
    if (cleanText.length > 2000) {
      return res.status(400).json({ error: 'Review text must not exceed 2000 characters.' });
    }

    try {
      const review = await prisma.review.findUnique({
        where: { id: reviewId }
      });

      if (!review) {
        return res.status(404).json({ error: 'Review not found.' });
      }

      if (review.userId !== userId) {
        return res.status(403).json({ error: 'Forbidden: You can only edit your own reviews.' });
      }

      // Check if user has since purchased the item to update verified status
      let orderItemId = review.orderItemId;
      if (!orderItemId) {
        const purchase = await prisma.orderItem.findFirst({
          where: {
            productId: review.productId,
            order: { customerId: userId }
          },
          select: { id: true }
        });
        if (purchase) orderItemId = purchase.id;
      }

      const updatedReview = await prisma.$transaction(async (tx) => {
        const updated = await tx.review.update({
          where: { id: reviewId },
          data: {
            rating: parsedRating,
            title: cleanTitle,
            text: cleanText,
            orderItemId
          },
          include: {
            user: {
              select: { id: true, name: true, username: true, avatar: true }
            },
            orderItem: {
              select: { variant: true }
            }
          }
        });

        await recomputeProductRating(tx, review.productId);

        return updated;
      });

      return res.json({
        success: true,
        message: 'Your review has been updated successfully.',
        review: {
          ...updatedReview,
          verifiedPurchase: updatedReview.orderItemId !== null,
          variant: updatedReview.orderItem?.variant || null
        }
      });
    } catch (error) {
      console.error('Error updating review:', error);
      return res.status(500).json({ error: 'Failed to update review.' });
    }
  });

  // =========================================================================
  // 5. DELETE PRODUCT REVIEW (Customer Self-Deletion)
  // =========================================================================
  router.delete('/api/reviews/:id', requireUserToken, async (req, res) => {
    const reviewId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    if (isNaN(reviewId)) {
      return res.status(400).json({ error: 'Invalid review ID.' });
    }

    try {
      const review = await prisma.review.findUnique({
        where: { id: reviewId }
      });

      if (!review) {
        return res.status(404).json({ error: 'Review not found.' });
      }

      if (review.userId !== userId) {
        return res.status(403).json({ error: 'Forbidden: You can only delete your own reviews.' });
      }

      await prisma.$transaction(async (tx) => {
        await tx.reviewHelpfulVote.deleteMany({ where: { reviewId } });
        await tx.review.delete({ where: { id: reviewId } });
        await recomputeProductRating(tx, review.productId);
      });

      return res.json({ success: true, message: 'Review deleted successfully.' });
    } catch (error) {
      console.error('Error deleting review:', error);
      return res.status(500).json({ error: 'Failed to delete review.' });
    }
  });

  // =========================================================================
  // 6. GET MY REVIEWS (Logged-in User Profile Endpoint)
  // =========================================================================
  router.get('/api/users/me/reviews', requireUserToken, async (req, res) => {
    const userId = req.user.id;
    try {
      const reviews = await prisma.review.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, name: true, img: true, price: true, category: true, type: true }
          },
          orderItem: {
            select: { variant: true }
          }
        }
      });

      const mapped = reviews.map(r => ({
        ...r,
        verifiedPurchase: r.orderItemId !== null,
        variant: r.orderItem?.variant || null
      }));

      return res.json({ success: true, reviews: mapped });
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      return res.status(500).json({ error: 'Failed to fetch your reviews.' });
    }
  });

  // =========================================================================
  // 7. HELPFUL VOTE TOGGLE
  // =========================================================================
  router.post('/api/reviews/:id/helpful', requireUserToken, async (req, res) => {
    const reviewId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    if (isNaN(reviewId)) {
      return res.status(400).json({ error: 'Invalid review ID.' });
    }

    try {
      const review = await prisma.review.findUnique({
        where: { id: reviewId }
      });

      if (!review) {
        return res.status(404).json({ error: 'Review not found.' });
      }

      if (review.userId === userId) {
        return res.status(400).json({ error: 'You cannot vote on your own review.' });
      }

      const result = await prisma.$transaction(async (tx) => {
        const existingVote = await tx.reviewHelpfulVote.findUnique({
          where: {
            reviewId_userId: { reviewId, userId }
          }
        });

        let newHelpfulCount = review.helpfulCount;
        let voted = false;

        if (existingVote) {
          await tx.reviewHelpfulVote.delete({
            where: { id: existingVote.id }
          });
          newHelpfulCount = Math.max(0, review.helpfulCount - 1);
          voted = false;
        } else {
          await tx.reviewHelpfulVote.create({
            data: { reviewId, userId }
          });
          newHelpfulCount = review.helpfulCount + 1;
          voted = true;
        }

        await tx.review.update({
          where: { id: reviewId },
          data: { helpfulCount: newHelpfulCount }
        });

        return { helpfulCount: newHelpfulCount, voted };
      });

      return res.json({
        success: true,
        helpfulCount: result.helpfulCount,
        voted: result.voted
      });
    } catch (error) {
      console.error('Error toggling helpful vote:', error);
      return res.status(500).json({ error: 'Failed to process helpful vote.' });
    }
  });

  // =========================================================================
  // 8. REPORT PRODUCT REVIEW (Customer Flagging)
  // =========================================================================
  router.post('/api/reviews/:id/report', requireUserToken, async (req, res) => {
    const reviewId = parseInt(req.params.id, 10);
    const reporterId = req.user.id;
    const { reason, details } = req.body;

    if (isNaN(reviewId)) {
      return res.status(400).json({ error: 'Invalid review ID.' });
    }

    const VALID_REASONS = [
      'Off topic',
      'Inappropriate',
      'Disrespectful/hateful/obscene',
      'Fake',
      'Paid for/inauthentic',
      'Other'
    ];

    if (!reason || !VALID_REASONS.includes(reason)) {
      return res.status(400).json({ error: 'Please select a valid report reason.' });
    }

    try {
      const review = await prisma.review.findUnique({
        where: { id: reviewId }
      });

      if (!review) {
        return res.status(404).json({ error: 'Review not found.' });
      }

      // Check if user already reported this review
      const existingReport = await prisma.reviewReport.findUnique({
        where: {
          reviewId_reporterId: { reviewId, reporterId }
        }
      });

      if (existingReport) {
        return res.json({
          success: true,
          alreadyReported: true,
          message: 'You have already reported this review. Our moderation team is looking into it.'
        });
      }

      const cleanDetails = details ? escapeHtml(details.trim()) : null;

      await prisma.reviewReport.create({
        data: {
          reviewId,
          reporterId,
          reason,
          details: cleanDetails
        }
      });

      return res.json({
        success: true,
        alreadyReported: false,
        message: "Thank you. We'll check if this review meets our community guidelines."
      });
    } catch (error) {
      console.error('Error reporting review:', error);
      return res.status(500).json({ error: 'Failed to submit report.' });
    }
  });

  // =========================================================================
  // 9. ADMIN MODERATION ENDPOINTS (requireAdminToken)
  // =========================================================================

  // GET /api/admin/reviews/product-health (Ratings Health Overview sorted ascending by rating)
  router.get('/api/admin/reviews/product-health', requireAdminToken, async (req, res) => {
    try {
      const products = await prisma.product.findMany({
        select: {
          id: true,
          name: true,
          img: true,
          category: true,
          type: true,
          price: true,
          rating: true,
          ratingCount: true
        },
        orderBy: [
          { rating: 'asc' },
          { ratingCount: 'desc' }
        ]
      });

      return res.json({ success: true, products });
    } catch (err) {
      console.error('Error fetching product ratings health:', err);
      return res.status(500).json({ error: 'Failed to fetch product ratings health.' });
    }
  });

  // GET /api/admin/reviews (List with filters & search)
  router.get('/api/admin/reviews', requireAdminToken, async (req, res) => {
    const { productId, rating, verifiedOnly, reportedOnly, status, search, sort = 'recent', limit = 50, offset = 0 } = req.query;

    const whereClause = {};

    if (productId) whereClause.productId = productId;
    if (rating) whereClause.rating = parseInt(rating, 10);
    if (verifiedOnly === 'true') whereClause.orderItemId = { not: null };
    if (reportedOnly === 'true') whereClause.reports = { some: {} };
    if (status) whereClause.status = status;

    if (search && search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { title: { contains: q } },
        { text: { contains: q } },
        { user: { name: { contains: q } } },
        { user: { username: { contains: q } } },
        { product: { name: { contains: q } } }
      ];
    }

    let orderBy = [{ createdAt: 'desc' }];
    if (sort === 'rating_high') orderBy = [{ rating: 'desc' }, { createdAt: 'desc' }];
    if (sort === 'rating_low') orderBy = [{ rating: 'asc' }, { createdAt: 'desc' }];
    if (sort === 'helpful') orderBy = [{ helpfulCount: 'desc' }, { createdAt: 'desc' }];
    if (sort === 'reported') orderBy = [{ reports: { _count: 'desc' } }, { createdAt: 'desc' }];

    try {
      const [reviews, totalCount] = await Promise.all([
        prisma.review.findMany({
          where: whereClause,
          orderBy,
          skip: Math.max(0, parseInt(offset, 10) || 0),
          take: Math.max(1, parseInt(limit, 10) || 50),
          include: {
            product: {
              select: { id: true, name: true, img: true, category: true }
            },
            user: {
              select: { id: true, name: true, username: true, email: true, avatar: true }
            },
            orderItem: {
              select: { id: true, variant: true }
            },
            reports: {
              select: {
                id: true,
                reason: true,
                details: true,
                createdAt: true
              }
            },
            _count: {
              select: { reports: true }
            }
          }
        }),
        prisma.review.count({ where: whereClause })
      ]);

      const mapped = reviews.map(r => ({
        ...r,
        verifiedPurchase: r.orderItemId !== null,
        variant: r.orderItem?.variant || null,
        reportCount: r._count?.reports || 0
      }));

      return res.json({ success: true, reviews: mapped, totalCount });
    } catch (err) {
      console.error('Error fetching admin reviews:', err);
      return res.status(500).json({ error: 'Failed to fetch reviews for admin.' });
    }
  });

  // PATCH /api/admin/reviews/:id/status (Hide / Unhide moderation action)
  router.patch('/api/admin/reviews/:id/status', requireAdminToken, async (req, res) => {
    const reviewId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (isNaN(reviewId) || !['Published', 'Hidden'].includes(status)) {
      return res.status(400).json({ error: 'Valid status ("Published" or "Hidden") is required.' });
    }

    try {
      const review = await prisma.review.findUnique({ where: { id: reviewId } });
      if (!review) return res.status(404).json({ error: 'Review not found.' });

      const updated = await prisma.$transaction(async (tx) => {
        const r = await tx.review.update({
          where: { id: reviewId },
          data: { status }
        });
        await recomputeProductRating(tx, review.productId);
        return r;
      });

      return res.json({
        success: true,
        message: `Review marked as ${status}.`,
        review: updated
      });
    } catch (err) {
      console.error('Error updating review status:', err);
      return res.status(500).json({ error: 'Failed to update review status.' });
    }
  });

  // DELETE /api/admin/reviews/:id (Hard delete moderation action)
  router.delete('/api/admin/reviews/:id', requireAdminToken, async (req, res) => {
    const reviewId = parseInt(req.params.id, 10);
    if (isNaN(reviewId)) {
      return res.status(400).json({ error: 'Invalid review ID.' });
    }

    try {
      const review = await prisma.review.findUnique({ where: { id: reviewId } });
      if (!review) return res.status(404).json({ error: 'Review not found.' });

      await prisma.$transaction(async (tx) => {
        await tx.reviewHelpfulVote.deleteMany({ where: { reviewId } });
        await tx.review.delete({ where: { id: reviewId } });
        await recomputeProductRating(tx, review.productId);
      });

      return res.json({ success: true, message: 'Review permanently deleted.' });
    } catch (err) {
      console.error('Error deleting admin review:', err);
      return res.status(500).json({ error: 'Failed to delete review.' });
    }
  });

  return router;
};
