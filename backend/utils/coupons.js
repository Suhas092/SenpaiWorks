'use strict';

// Codes that represent the one-per-account welcome offer
const WELCOME_COUPON_CODES = ['SENPAI100', 'WLCOME100'];

function normalizeCouponCode(code) {
  return String(code || '').trim().toUpperCase();
}

function isWelcomeCoupon(code) {
  return WELCOME_COUPON_CODES.includes(normalizeCouponCode(code));
}

function hasUsageCap(coupon) {
  return coupon.maxUses !== null && coupon.maxUses !== undefined && Number(coupon.maxUses) > 0;
}

// Expiry dates are calendar days (IST); a coupon stays valid through the end of that day
function isExpired(expiryDate, now = new Date()) {
  if (!expiryDate) return false;
  const raw = String(expiryDate).trim();
  const expiry = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T23:59:59.999+05:30`)
    : new Date(raw);
  if (isNaN(expiry)) return false;
  return expiry < now;
}

/**
 * Resolves a coupon code into a usable coupon.
 * With enforceLimits=false only existence and configuration are checked (used after payment is captured).
 * Returns { coupon } on success or { error, status } on failure.
 */
async function resolveCoupon(prisma, rawCode, { userEmail = null, enforceLimits = true } = {}) {
  const code = normalizeCouponCode(rawCode);
  if (!code) return { error: 'Coupon code is required.', status: 400 };

  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon) return { error: 'Invalid coupon code.', status: 404 };

  const discountType = String(coupon.discountType || '').trim().toLowerCase();
  const discountValue = parseFloat(coupon.discountValue);
  const isMisconfigured =
    !['percentage', 'flat'].includes(discountType) ||
    !(discountValue > 0) ||
    (discountType === 'percentage' && discountValue > 100);
  if (isMisconfigured) {
    return { error: 'This coupon is not configured correctly.', status: 400 };
  }

  if (enforceLimits) {
    if (coupon.status !== 'Active') {
      return { error: 'This coupon is no longer active.', status: 400 };
    }
    if (isExpired(coupon.expiryDate)) {
      return { error: 'This coupon has expired.', status: 400 };
    }
    if (hasUsageCap(coupon) && coupon.usageCount >= coupon.maxUses) {
      return { error: 'This coupon has reached its maximum usage limit.', status: 400 };
    }
    if (isWelcomeCoupon(code) && userEmail) {
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { welcomeOfferUsed: true }
      });
      if (user && user.welcomeOfferUsed) {
        return { error: 'The welcome offer has already been used on this account.', status: 400 };
      }
    }
  }

  return { coupon: { ...coupon, code, discountType } };
}

// Server-side discount for a subtotal (course or cart). Never exceeds the subtotal.
function calculateCouponDiscount(coupon, subtotal) {
  const base = Math.max(0, Number(subtotal) || 0);
  const value = parseFloat(coupon.discountValue) || 0;
  const raw = coupon.discountType === 'percentage' ? (base * value) / 100 : value;
  const amount = Math.min(base, Math.max(0, raw));
  return Math.round(amount * 100) / 100;
}

/**
 * Counts one redemption against a coupon. Called only after an order is saved.
 * Capped coupons are incremented conditionally so usage never exceeds maxUses.
 */
async function recordCouponRedemption(prisma, rawCode) {
  const code = normalizeCouponCode(rawCode);
  if (!code) return false;

  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon) return false;

  if (hasUsageCap(coupon)) {
    const result = await prisma.coupon.updateMany({
      where: { code, usageCount: { lt: coupon.maxUses } },
      data: { usageCount: { increment: 1 } }
    });
    return result.count === 1;
  }

  await prisma.coupon.update({ where: { code }, data: { usageCount: { increment: 1 } } });
  return true;
}

module.exports = {
  WELCOME_COUPON_CODES,
  normalizeCouponCode,
  isWelcomeCoupon,
  resolveCoupon,
  calculateCouponDiscount,
  recordCouponRedemption
};
