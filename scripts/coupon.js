"use strict";

// Shared coupon state for cart and checkout. The server is the source of truth:
// it re-validates and recomputes the discount for every order.
(function () {
  const STORAGE_KEY = "appliedCoupon";

  function getAuthToken() {
    const loggedOut = localStorage.getItem("userLoggedOut") === "true" || localStorage.getItem("isLoggedIn") === "false" || !localStorage.getItem("currentUser");
    if (loggedOut) return null;
    return localStorage.getItem("userToken") || sessionStorage.getItem("userToken") || null;
  }

  function getAppliedCoupon() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setAppliedCoupon(coupon) {
    if (!coupon) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue
    }));
  }

  // Display-only mirror of the server rule (utils/coupons.js calculateCouponDiscount)
  function computeCouponDiscount(coupon, subtotal) {
    if (!coupon) return 0;
    const base = Math.max(0, Number(subtotal) || 0);
    const value = parseFloat(coupon.discountValue) || 0;
    const raw = coupon.discountType === "percentage" ? (base * value) / 100 : value;
    const amount = Math.min(base, Math.max(0, raw));
    return Math.round(amount * 100) / 100;
  }

  async function validateCouponCode(code, extra) {
    const headers = { "Content-Type": "application/json" };
    const token = getAuthToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers,
        body: JSON.stringify(Object.assign({ code: String(code || "").trim() }, extra || {}))
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return { error: data.error || "Invalid coupon code." };
      }
      return {
        coupon: {
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue
        }
      };
    } catch (e) {
      return { error: "Could not validate the code. Please try again." };
    }
  }

  // Re-checks the stored coupon on page load; clears it if the server now rejects it
  async function revalidateAppliedCoupon() {
    const applied = getAppliedCoupon();
    if (!applied || !applied.code) return null;
    const result = await validateCouponCode(applied.code);
    if (result.error) {
      setAppliedCoupon(null);
      return { error: result.error };
    }
    setAppliedCoupon(result.coupon);
    return { coupon: result.coupon };
  }

  function describeCoupon(coupon) {
    if (!coupon) return "";
    return coupon.discountType === "percentage"
      ? `${parseFloat(coupon.discountValue)}% off`
      : `\u20B9${parseFloat(coupon.discountValue)} off`;
  }

  window.SenpaiCoupon = {
    getAppliedCoupon,
    setAppliedCoupon,
    computeCouponDiscount,
    validateCouponCode,
    revalidateAppliedCoupon,
    describeCoupon
  };
})();
