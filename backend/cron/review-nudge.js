const cron = require('node-cron');

/**
 * Checks for delivered orders that are 3+ days old and sends in-app review nudge notifications.
 * @param {import('@prisma/client').PrismaClient} prisma 
 */
async function processReviewNudges(prisma) {
  try {
    const now = new Date();
    // 3 days ago threshold
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const qualifyingOrders = await prisma.order.findMany({
      where: {
        deliveredAt: {
          lte: threeDaysAgo
        },
        reviewNudgeSentAt: null,
        customerId: {
          not: null
        }
      },
      include: {
        customer: true,
        items: true
      }
    });

    for (const order of qualifyingOrders) {
      const customerId = order.customerId;
      const targetEmail = order.customer?.email || order.email;
      const items = order.items || [];

      if (items.length === 0 || !targetEmail) {
        await prisma.order.update({
          where: { id: order.id },
          data: { reviewNudgeSentAt: now }
        });
        continue;
      }

      // Check which products in this order have already been reviewed by this user
      const productIds = items.map(item => item.productId);
      const existingReviews = await prisma.review.findMany({
        where: {
          userId: customerId,
          productId: { in: productIds }
        },
        select: { productId: true }
      });

      const reviewedSet = new Set(existingReviews.map(r => r.productId));
      const unreviewedItems = items.filter(item => !reviewedSet.has(item.productId));

      // If all items are already reviewed, mark nudge as sent and skip notification
      if (unreviewedItems.length === 0) {
        await prisma.order.update({
          where: { id: order.id },
          data: { reviewNudgeSentAt: now }
        });
        continue;
      }

      const targetItem = unreviewedItems[0];
      const itemTitle = targetItem.productName || 'your item';

      // Create in-app notification
      await prisma.notification.create({
        data: {
          userEmail: targetEmail,
          type: 'review_request',
          title: 'How was your recent order?',
          message: `Share your thoughts on ${itemTitle}! Your review helps fellow anime fans and creators.`,
          link: `store-detail.html?id=${encodeURIComponent(targetItem.productId)}&openReview=true`,
          icon: 'fa-regular fa-star'
        }
      });

      // Mark nudge sent on the order
      await prisma.order.update({
        where: { id: order.id },
        data: { reviewNudgeSentAt: now }
      });

      console.log(`[Review Nudge] Sent notification to ${targetEmail} for order #${order.orderNumber} (product: ${targetItem.productId})`);
    }
  } catch (err) {
    console.error('[Review Nudge Cron] Error processing review nudges:', err);
  }
}

/**
 * Initializes the review nudge daily cron job
 * @param {import('@prisma/client').PrismaClient} prisma 
 */
function initReviewNudgeCron(prisma) {
  // Run once daily at 9:00 AM (0 9 * * *)
  cron.schedule('0 9 * * *', () => {
    console.log('[Review Nudge Cron] Running daily delivered orders review nudge scan...');
    processReviewNudges(prisma);
  });

  // Also run a lightweight initial check 10 seconds after server start
  setTimeout(() => {
    processReviewNudges(prisma);
  }, 10000);
}

module.exports = {
  initReviewNudgeCron,
  processReviewNudges
};
