'use strict';

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');

module.exports = function ({
  prisma,
  optionalUserToken,
  sendOrderConfirmationEmail,
  sendDigitalOrderDownloadEmail,
  sendTelegramAlert
}) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.warn('[Razorpay] Warning: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not configured in .env!');
  }

  const razorpay = new Razorpay({
    key_id: keyId || 'dummy_key_id',
    key_secret: keySecret || 'dummy_key_secret'
  });

  /**
   * Helper: Calculate authoritative cart prices directly from Neon database.
   * Prevents client-side price tampering.
   */
  async function computeAuthoritativeOrder(items, discountAmount = 0) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Order must contain at least one item.');
    }

    let computedSubtotal = 0;
    const dbItems = [];
    let hasPhysical = false;
    let hasDigital = false;

    for (const item of items) {
      // Dynamic Donation Items Support
      if (item.isDonation || String(item.id || '').startsWith('donation') || item.productId === 'DONATION') {
        hasDigital = true;
        let donationAmount = Number(item.price || item.originalAmount || 85);
        if (item.currency === 'USD' && item.originalAmount && donationAmount === Number(item.originalAmount)) {
          donationAmount = Math.round(donationAmount * 85);
        }
        donationAmount = Math.max(1, Math.round(donationAmount));
        computedSubtotal += donationAmount;

        let donationProduct = await prisma.product.findUnique({ where: { id: 'DONATION' } });
        if (!donationProduct) {
          try {
            donationProduct = await prisma.product.create({
              data: {
                id: 'DONATION',
                name: 'Community Support Donation',
                category: 'Community',
                subCategory: 'Donation',
                price: 1,
                description: 'Direct community supporter donation to SenpaiWorks Studio',
                img: 'https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/avatars/rem_happy_evhesz.webp',
                type: 'digital',
                format: 'Digital Contribution',
                isNew: false,
                available: true,
                stockQuantity: 999999
              }
            });
          } catch (e) {
            donationProduct = await prisma.product.findFirst({ where: { id: 'DONATION' } });
          }
        }

        dbItems.push({
          productId: donationProduct ? donationProduct.id : 'DONATION',
          productName: item.name || 'Community Support Donation',
          price: donationAmount,
          img: item.img || 'https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/avatars/rem_happy_evhesz.webp',
          variant: item.donorName ? `Donor: ${item.donorName}` : (item.currency ? `Currency: ${item.currency}` : null),
          quantity: 1
        });
        continue;
      }

      const prodIdStr = String(item.id || item.productId || '');
      let product = await prisma.product.findUnique({ where: { id: prodIdStr } });

      if (!product && item.name) {
        product = await prisma.product.findFirst({ where: { name: item.name } });
      }

      if (!product) {
        throw new Error(`Product '${item.name || prodIdStr}' does not exist in the catalog.`);
      }

      if (product.type === 'digital') {
        hasDigital = true;
      } else {
        hasPhysical = true;
      }

      const canonicalPrice = Number(product.price);
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      computedSubtotal += canonicalPrice * qty;

      dbItems.push({
        productId: product.id,
        productName: product.name,
        price: canonicalPrice,
        img: product.img || item.img || item.productImage || null,
        variant: item.variant || item.selectedVariant || item.size || null,
        quantity: qty
      });
    }

    const isDigitalOnly = hasDigital && !hasPhysical;
    // Free shipping above ₹999 for physical items; ₹0 for purely digital orders
    const shipping = isDigitalOnly ? 0 : (computedSubtotal > 999 ? 0 : 99);
    const validDiscount = Math.min(computedSubtotal, Math.max(0, Number(discountAmount) || 0));
    const grandTotal = Math.max(1, computedSubtotal + shipping - validDiscount);

    return {
      computedSubtotal,
      shipping,
      discount: validDiscount,
      grandTotal,
      isDigitalOnly,
      hasPhysical,
      hasDigital,
      dbItems
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 1. POST /api/payments/create-order
  // Creates an official Razorpay order with authoritative DB-calculated price
  // ──────────────────────────────────────────────────────────────────────────
  router.post('/create-order', optionalUserToken, async (req, res) => {
    try {
      const { items, discountAmount, email, address } = req.body;

      if (!keyId || !keySecret) {
        return res.status(500).json({ error: 'Razorpay payment gateway is not configured on the server.' });
      }

      const orderCalc = await computeAuthoritativeOrder(items, discountAmount);

      // Amount in paise (1 INR = 100 paise)
      const amountInPaise = Math.round(orderCalc.grandTotal * 100);
      const randReceipt = `rcpt_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;

      const rzpOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: randReceipt,
        notes: {
          customerEmail: email || req.userEmail || 'collector@senpaiworks.com',
          itemCount: String(items.length),
          isDigital: String(orderCalc.isDigitalOnly)
        }
      });

      res.json({
        success: true,
        keyId: process.env.RAZORPAY_KEY_ID,
        orderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        computedSubtotal: orderCalc.computedSubtotal,
        shipping: orderCalc.shipping,
        discount: orderCalc.discount,
        grandTotal: orderCalc.grandTotal
      });
    } catch (err) {
      console.error('[Razorpay Create-Order Error]:', err);
      res.status(400).json({ error: err.message || 'Failed to initialize payment.' });
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. POST /api/payments/verify
  // Cryptographically verifies HMAC-SHA256 signature and records order in Neon
  // ──────────────────────────────────────────────────────────────────────────
  router.post('/verify', optionalUserToken, async (req, res) => {
    try {
      const {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        orderData
      } = req.body;

      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return res.status(400).json({ error: 'Missing payment signature verification parameters.' });
      }

      if (!orderData || !Array.isArray(orderData.items) || orderData.items.length === 0) {
        return res.status(400).json({ error: 'Order payload is invalid or empty.' });
      }

      // Step A: Cryptographic Signature Verification
      const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
      hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const generatedSignature = hmac.digest('hex');

      if (generatedSignature !== razorpay_signature) {
        console.error('[Razorpay Security Alert]: Payment signature mismatch!', {
          received: razorpay_signature,
          generated: generatedSignature
        });
        return res.status(400).json({ error: 'Payment verification failed: Invalid cryptographic signature.' });
      }

      // Step B: Calculate authoritative pricing directly from Neon database
      const orderCalc = await computeAuthoritativeOrder(orderData.items, orderData.discountAmount);

      // Step C: Determine customer identity
      let customerId = null;
      let finalEmail = (orderData.email || '').trim();
      let guestName = null;
      let guestPhone = null;

      const addr = orderData.address || {};
      const parsedFirst = (addr.firstName || '').trim();
      const parsedLast = (addr.lastName || '').trim();
      if (parsedFirst || parsedLast) {
        guestName = `${parsedFirst} ${parsedLast}`.trim();
      }
      if (addr.phone) {
        guestPhone = String(addr.phone).trim();
      }

      if (req.userEmail) {
        const user = await prisma.user.findUnique({ where: { email: req.userEmail } });
        if (user) {
          customerId = user.id;
          finalEmail = user.email;
          if (!guestName && (user.name || user.username)) {
            guestName = user.name || user.username;
          }
        }
      }

      if (!finalEmail || !finalEmail.includes('@')) {
        return res.status(400).json({ error: 'A valid email address is required for order confirmation.' });
      }

      if (!orderCalc.isDigitalOnly) {
        if (!addr.address || !addr.city || !addr.state || !addr.pincode) {
          return res.status(400).json({ error: 'Physical items require a complete delivery address.' });
        }
      }

      // Step D: Create Order in Neon PostgreSQL
      const randSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
      const isDonationOrder = (orderCalc.dbItems || []).some(it => it.productId === 'DONATION' || (it.productName && it.productName.toLowerCase().includes('donation')));
      const prefix = isDonationOrder ? 'TXN-' : 'ORD-';
      const orderNumber = `${prefix}${Date.now().toString(36).toUpperCase()}-${randSuffix}`;

      const initialHistory = [
        { status: isDonationOrder ? 'Confirmed' : 'Placed', timestamp: new Date().toISOString() },
        { status: 'Paid', timestamp: new Date().toISOString(), note: `Razorpay payment ${razorpay_payment_id}` }
      ];

      if (isDonationOrder || orderCalc.isDigitalOnly) {
        initialHistory.push({ status: isDonationOrder ? 'Completed' : 'Delivered', timestamp: new Date().toISOString(), note: isDonationOrder ? 'Patron Contribution Acknowledged' : 'Instant Digital Delivery' });
      } else {
        initialHistory.push({ status: 'Processing', timestamp: new Date().toISOString(), note: 'Order confirmed and sent to warehouse' });
      }

      const shippingAddressObj = {
        ...addr,
        _statusHistory: initialHistory
      };

      const order = await prisma.order.create({
        data: {
          orderNumber,
          customerId,
          email: finalEmail,
          guestName,
          guestPhone,
          shippingAddress: JSON.stringify(shippingAddressObj),
          subtotal: orderCalc.computedSubtotal,
          shipping: orderCalc.shipping,
          discount: orderCalc.discount,
          total: orderCalc.grandTotal,
          status: orderCalc.isDigitalOnly ? 'Delivered' : 'Processing',
          deliveredAt: orderCalc.isDigitalOnly ? new Date() : null,
          paymentStatus: 'paid',
          paymentGateway: 'razorpay',
          paymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          razorpaySignature: razorpay_signature,
          items: {
            create: orderCalc.dbItems
          }
        },
        include: {
          items: {
            include: { product: true }
          }
        }
      });

      // Step E: Notifications and Email Dispatches
      // 1. In-app Admin Notification
      try {
        await prisma.notification.create({
          data: {
            userEmail: 'suhas_admin',
            type: 'order_created',
            title: `Paid Order: #${order.orderNumber}`,
            message: `Order #${order.orderNumber} placed by ${order.guestName || order.email} for ₹${order.total.toLocaleString('en-IN')}. (Razorpay: ${razorpay_payment_id})`,
            link: 'admin.html#tab-orders',
            icon: 'fa-solid fa-box'
          }
        });
      } catch (e) {
        console.warn('[Payments] Admin notification error:', e.message);
      }

      // 2. Email Confirmation via Resend
      if (typeof sendOrderConfirmationEmail === 'function') {
        try {
          await sendOrderConfirmationEmail(order);
        } catch (mailErr) {
          console.error('[Payments] Order confirmation email dispatch failed:', mailErr);
        }
      }

      // 3. Digital Asset Delivery Email via Resend
      if (orderCalc.hasDigital && typeof sendDigitalOrderDownloadEmail === 'function') {
        try {
          const digitalItems = order.items.filter(it => it.product && it.product.type === 'digital');
          for (const digItem of digitalItems) {
            await sendDigitalOrderDownloadEmail(
              order.email,
              order.guestName || 'Collector',
              digItem.product.name,
              order.orderNumber,
              digItem.product.downloadUrl || 'https://senpaiworks.com/profile.html#tab-orders'
            );
          }
        } catch (digErr) {
          console.error('[Payments] Digital order email delivery failed:', digErr);
        }
      }

      // 4. Telegram Notification
      if (typeof sendTelegramAlert === 'function') {
        try {
          await sendTelegramAlert(
            `🛒 *New Razorpay Payment Received!*\n` +
            `*Order:* \`#${order.orderNumber}\`\n` +
            `*Customer:* ${order.guestName || order.email}\n` +
            `*Amount:* ₹${order.total.toLocaleString('en-IN')}\n` +
            `*Items:* ${order.items.length} item(s)\n` +
            `*Payment ID:* \`${razorpay_payment_id}\``
          );
        } catch (tgErr) {
          console.warn('[Payments] Telegram alert failed:', tgErr.message);
        }
      }

      res.json({
        success: true,
        orderNumber: order.orderNumber,
        orderId: order.id,
        email: order.email,
        total: order.total,
        status: order.status
      });
    } catch (err) {
      console.error('[Razorpay Verification Error]:', err);
      res.status(500).json({ error: err.message || 'Payment verification failed.' });
    }
  });

  return router;
};
