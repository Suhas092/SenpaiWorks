'use strict';

const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

/**
 * Helper to format currency cleanly in INR without missing font glyph artifacts
 */
function formatMoney(amount) {
  const num = Number(amount || 0);
  return 'Rs. ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Pure JavaScript Indian Number to Words converter (no external dependency)
 */
function numberToWordsINR(amount) {
  const num = Math.round(Number(amount || 0));
  if (num === 0) return 'Zero Rupees Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertHundreds(n) {
    let str = '';
    if (n > 99) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
    } else if (n > 0) {
      str += a[n];
    }
    return str.trim();
  }

  const crore = Math.floor(num / 10000000);
  let rem = num % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;
  const hundred = rem;

  let res = '';
  if (crore) res += convertHundreds(crore) + ' Crore ';
  if (lakh) res += convertHundreds(lakh) + ' Lakh ';
  if (thousand) res += convertHundreds(thousand) + ' Thousand ';
  if (hundred) res += convertHundreds(hundred);

  res = res.trim();
  return res ? `${res} Rupees Only` : 'Zero Rupees Only';
}

/**
 * Parse and format address lines cleanly without repetition or misplaced landmarks
 */
function formatAddressLines(addressObj) {
  if (!addressObj) return [];
  if (typeof addressObj === 'string') {
    try {
      addressObj = JSON.parse(addressObj);
    } catch (e) {
      return [addressObj.trim()];
    }
  }
  if (typeof addressObj !== 'object' || !addressObj) return [];

  const lines = [];

  const apt = (addressObj.apartment || addressObj.landmark || addressObj.flat || '').trim();
  const street = (addressObj.address || addressObj.street || '').trim();

  // Combine street and landmark/apartment naturally
  if (apt && street) {
    if (street.toLowerCase().includes(apt.toLowerCase())) {
      lines.push(street);
    } else {
      lines.push(`${street}, ${apt}`);
    }
  } else if (street) {
    lines.push(street);
  } else if (apt) {
    lines.push(apt);
  }

  const city = (addressObj.city || '').trim();
  const state = (addressObj.state || '').trim();
  const pin = (addressObj.pincode || addressObj.pin || addressObj.postalCode || '').trim();

  const localityParts = [];
  if (city) localityParts.push(city);
  if (state) localityParts.push(state);
  if (pin) localityParts.push(pin);
  const localityLine = localityParts.join(', ');

  // Avoid repeating city/state/pin if street already contains all of them
  if (localityLine) {
    const streetLower = (street || '').toLowerCase();
    const isDuplicate = (city && streetLower.includes(city.toLowerCase())) &&
                        (state && streetLower.includes(state.toLowerCase())) &&
                        (pin && streetLower.includes(pin.toLowerCase()));
    if (!isDuplicate) {
      lines.push(localityLine);
    }
  }

  const country = (addressObj.country || 'India').trim();
  if (country) {
    lines.push(country);
  }

  return lines;
}

/**
 * Ensure crisp dark PNG assets for PDF generation
 */
function getAssetPath(filename) {
  const assetDir = path.resolve(__dirname, 'assets');
  if (!fs.existsSync(assetDir)) {
    fs.mkdirSync(assetDir, { recursive: true });
  }
  return path.join(assetDir, filename);
}

function ensureDarkBrandAssets() {
  const logoDark = getAssetPath('senpaiworks_logo_dark.png');
  const nameLogoDark = getAssetPath('senpaiworks_name_logo_dark.png');

  if (fs.existsSync(logoDark) && fs.existsSync(nameLogoDark)) {
    return { logoPath: logoDark, nameLogoPath: nameLogoDark };
  }

  try {
    const sharp = require('sharp');
    const srcLogo = path.resolve(__dirname, '../../assets/Videos/SenpaiWorks logo.png');
    const srcNameLogo = path.resolve(__dirname, '../../assets/Videos/senpaiworks name logo no bg.png');

    async function makeDarkPng(srcPath, outPath) {
      if (!fs.existsSync(srcPath)) return;
      const img = sharp(srcPath);
      const meta = await img.metadata();
      const alpha = await sharp(srcPath).extractChannel(3).toBuffer();
      await sharp({
        create: {
          width: meta.width,
          height: meta.height,
          channels: 3,
          background: { r: 15, g: 23, b: 42 }
        }
      })
      .joinChannel(alpha)
      .png()
      .toFile(outPath);
    }

    if (!fs.existsSync(logoDark) && fs.existsSync(srcLogo)) {
      makeDarkPng(srcLogo, logoDark).catch(e => console.error(e));
    }
    if (!fs.existsSync(nameLogoDark) && fs.existsSync(srcNameLogo)) {
      makeDarkPng(srcNameLogo, nameLogoDark).catch(e => console.error(e));
    }
  } catch (e) {
    console.error('Sharp asset processing notice:', e.message);
  }

  return {
    logoPath: fs.existsSync(logoDark) ? logoDark : path.resolve(__dirname, '../../assets/Videos/SenpaiWorks logo.png'),
    nameLogoPath: fs.existsSync(nameLogoDark) ? nameLogoDark : path.resolve(__dirname, '../../assets/Videos/senpaiworks name logo no bg.png')
  };
}

/**
 * Generate a clean, professional PDF Invoice using PDFKit
 * @param {Object} order - Order object containing items, address, payment details
 * @param {Stream} res - Express response stream to pipe the PDF to
 */
function generateOrderInvoicePDF(order, res) {
  const isDonation = (order.orderNumber && order.orderNumber.startsWith('TXN-')) ||
    (order.items || []).some(i => i && (i.isDonation || i.productId === 'DONATION' || (i.name && i.name.toLowerCase().includes('donation'))));

  const docTitle = isDonation ? `Donation Receipt - ${order.orderNumber || order.id}` : `Invoice - ${order.orderNumber || order.id}`;

  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    info: {
      Title: docTitle,
      Author: 'SenpaiWorks Official',
      Subject: isDonation ? 'Donation Receipt & Supporter Acknowledgment' : 'Official Order Invoice',
      Keywords: 'SenpaiWorks, Invoice, Receipt, Anime Streetwear'
    }
  });

  const filenamePrefix = isDonation ? 'SenpaiWorks-Donation-Receipt' : 'SenpaiWorks-Invoice';
  if (typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filenamePrefix}-${order.orderNumber || order.id}.pdf"`);
  }

  doc.pipe(res);

  // --- 1. HEADER SECTION ---
  const { logoPath, nameLogoPath } = ensureDarkBrandAssets();
  let logoDrawn = false;
  let nameLogoDrawn = false;

  // Draw Emblem Logo (left, 36x36)
  if (fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, 40, 36, { width: 36, height: 36 });
      logoDrawn = true;
    } catch (e) {}
  }

  // Draw Brand Name Logo Image next to emblem
  const nameLogoX = logoDrawn ? 84 : 40;
  if (fs.existsSync(nameLogoPath)) {
    try {
      doc.image(nameLogoPath, nameLogoX, 38, { height: 18 });
      nameLogoDrawn = true;
    } catch (e) {}
  }

  // Fallback text if image not available
  if (!nameLogoDrawn) {
    doc
      .font('Helvetica-Bold')
      .fontSize(17)
      .fillColor('#0f172a')
      .text('SENPAIWORKS', nameLogoX, 38);
  }

  // Support / Store link under the logo (no tagline per user instruction)
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor('#64748b')
    .text('support@senpaiworks.com  |  https://www.senpaiworks.com', nameLogoX, 60);

  // Right-aligned Invoice Title & Number
  // Per user instruction: "Rename header from 'TAX INVOICE' to 'INVOICE' (no GSTIN yet — confirmed not registered)"
  const invoiceTitle = isDonation ? 'DONATION RECEIPT' : 'INVOICE';
  doc
    .font('Helvetica-Bold')
    .fontSize(16)
    .fillColor(isDonation ? '#e11d48' : '#0f172a')
    .text(invoiceTitle, 350, 36, { align: 'right', width: 205 });

  const idLabel = isDonation ? 'Transaction ID' : 'Order ID';
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor('#475569')
    .text(`${idLabel}: ${order.orderNumber || order.id}`, 350, 56, { align: 'right', width: 205 })
    .text(`Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, 350, 68, { align: 'right', width: 205 });

  // Header Divider Line
  doc
    .strokeColor('#e2e8f0')
    .lineWidth(1)
    .moveTo(40, 88)
    .lineTo(555, 88)
    .stroke();

  // --- 2. BILLING & ORDER META SECTION ---
  const startMetaY = 102;

  // Billed To Box (Left Column, x = 40)
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor('#0f172a')
    .text(isDonation ? 'SUPPORTER DETAILS' : 'BILLED & DELIVERED TO', 40, startMetaY);

  let addressObj = order.shippingAddress;
  if (typeof addressObj === 'string') {
    try { addressObj = JSON.parse(addressObj); } catch (e) {}
  }

  // Determine actual display name:
  // 1. For donations: prioritize the donor name entered on checkout (order.guestName or addressObj)
  // 2. For store orders: prioritize delivery/recipient name in addressObj or order.guestName
  // 3. Only fallback to customer account profile if no order-level name exists
  let custName = '';
  if (isDonation) {
    let nameCandidate = order.guestName || (addressObj ? `${addressObj.firstName || ''} ${addressObj.lastName || ''}`.trim() : '') || (order.customer && (order.customer.name || order.customer.username)) || 'Community Supporter';
    if (nameCandidate && nameCandidate.toLowerCase().endsWith(' supporter') && nameCandidate.toLowerCase() !== 'community supporter') {
      nameCandidate = nameCandidate.replace(/\s+[Ss]upporter$/, '').trim() || nameCandidate;
    }
    custName = nameCandidate || 'Community Supporter';
  } else {
    const addrName = addressObj ? `${addressObj.firstName || ''} ${addressObj.lastName || ''}`.trim() : '';
    custName = addrName || order.guestName || (order.customer && (order.customer.name || order.customer.username)) || 'Valued Customer';
  }

  // Email: Prioritize the order's specific email address over account email
  const custEmail = order.email || order.guestEmail || order.customer?.email || '';

  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor('#1e293b')
    .text(custName, 40, startMetaY + 16, { width: 250 });

  let leftY = startMetaY + 28;

  // Email
  if (custEmail) {
    doc.font('Helvetica').fontSize(8.5).fillColor('#64748b').text(custEmail, 40, leftY, { width: 250, lineGap: 1 });
    leftY += Math.max(12, doc.heightOfString(custEmail, { width: 250, lineGap: 1 }) + 2);
  }

  // Address lines (only for physical / store orders)
  if (!isDonation) {
    const addressLines = formatAddressLines(addressObj || order.shippingAddress);
    addressLines.forEach(line => {
      doc.font('Helvetica').fontSize(8.5).fillColor('#64748b').text(line, 40, leftY, { width: 250, lineGap: 1 });
      leftY += Math.max(12, doc.heightOfString(line, { width: 250, lineGap: 1 }) + 2);
    });
  }

  // Payment Details Box (Right Column, x = 340)
  const metaRightX = 340;
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor('#0f172a')
    .text('PAYMENT DETAILS', metaRightX, startMetaY);

  const rawPaymentStatus = (order.paymentStatus || 'PAID').toUpperCase();
  const paymentMethod = order.paymentType || (order.paymentGateway === 'cod' ? 'Cash on Delivery (COD)' : 'Razorpay Gateway (Online)');
  const paymentId = order.razorpayPaymentId || order.paymentId || (order.paymentGateway === 'cod' ? 'COD - Pay on Delivery' : '—');

  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor('#475569')
    .text('Payment Status: ', metaRightX, startMetaY + 16, { continued: true })
    .font('Helvetica-Bold')
    .fillColor(rawPaymentStatus === 'PAID' ? '#059669' : '#0284c7')
    .text(rawPaymentStatus);

  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor('#475569')
    .text('Payment Method: ', metaRightX, startMetaY + 28, { continued: true })
    .font('Helvetica')
    .fillColor('#1e293b')
    .text(paymentMethod, { width: 215 });

  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor('#475569')
    .text('Transaction Ref: ', metaRightX, startMetaY + 40, { continued: true })
    .font('Helvetica-Bold')
    .fillColor('#1e293b')
    .text(paymentId, { width: 215 });

  // --- 3. ITEMS TABLE ---
  const tableTopY = Math.max(leftY + 18, startMetaY + 68);

  // Table Header Background
  doc
    .rect(40, tableTopY, 515, 22)
    .fill('#0f172a');

  // Table Column Titles
  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor('#ffffff')
    .text('ITEM / DESCRIPTION', 50, tableTopY + 6, { width: 240 })
    .text('QTY', 300, tableTopY + 6, { width: 40, align: 'center' })
    .text('UNIT PRICE', 355, tableTopY + 6, { width: 85, align: 'right' })
    .text('TOTAL (INR)', 455, tableTopY + 6, { width: 90, align: 'right' });

  let rowY = tableTopY + 28;
  const items = order.items || [];

  items.forEach((item, idx) => {
    const name = item.productName || item.name || (item.product && item.product.name) || (isDonation ? 'Community Patron Support' : 'SenpaiWorks Merchandise Item');
    const variant = item.variant || item.size || (isDonation ? 'Creative Supporter' : (item.product?.type === 'digital' ? 'Digital Edition' : 'Standard Edition'));
    const qty = item.quantity || 1;
    const price = Number(item.price || (item.product && item.product.price) || 0);
    const lineTotal = price * qty;

    // Alternate row zebra tint
    if (idx % 2 === 1) {
      doc
        .rect(40, rowY - 4, 515, 28)
        .fill('#f8fafc');
    }

    doc
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .fillColor('#0f172a')
      .text(name, 50, rowY, { width: 240, ellipsis: true });

    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor('#64748b')
      .text(isDonation ? 'Supporter Contribution' : `Variant: ${variant}`, 50, rowY + 11, { width: 240 });

    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor('#1e293b')
      .text(String(qty), 300, rowY + 3, { width: 40, align: 'center' })
      .text(formatMoney(price), 355, rowY + 3, { width: 85, align: 'right' })
      .text(formatMoney(lineTotal), 455, rowY + 3, { width: 90, align: 'right' });

    rowY += 32;
  });

  // Table bottom divider
  doc
    .strokeColor('#e2e8f0')
    .lineWidth(1)
    .moveTo(40, rowY + 2)
    .lineTo(555, rowY + 2)
    .stroke();

  // --- 4. TOTALS SECTION ---
  let totalsY = rowY + 14;
  const subtotal = Number(order.subtotal || order.total || 0);
  const discount = Number(order.discount || order.discountAmount || 0);
  const shipping = Number(order.shipping || 0);
  const grandTotal = Number(order.total || (subtotal - discount + shipping));

  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor('#475569')
    .text(isDonation ? 'Contribution Amount:' : 'Subtotal:', 340, totalsY, { width: 100, align: 'right' })
    .font('Helvetica-Bold')
    .fillColor('#1e293b')
    .text(formatMoney(subtotal), 455, totalsY, { width: 90, align: 'right' });

  totalsY += 15;

  if (discount > 0 && !isDonation) {
    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor('#059669')
      .text('Discount Applied:', 340, totalsY, { width: 100, align: 'right' })
      .font('Helvetica-Bold')
      .text(`-${formatMoney(discount)}`, 455, totalsY, { width: 90, align: 'right' });
    totalsY += 15;
  }

  if (!isDonation) {
    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor('#475569')
      .text('Shipping & Handling:', 340, totalsY, { width: 100, align: 'right' })
      .font('Helvetica-Bold')
      .fillColor('#1e293b')
      .text(shipping === 0 ? 'FREE' : formatMoney(shipping), 455, totalsY, { width: 90, align: 'right' });

    totalsY += 18;
  }

  // Grand Total Highlight Bar
  doc
    .rect(340, totalsY - 4, 215, 24)
    .fill('#f1f5f9');

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor('#0f172a')
    .text(isDonation ? 'Total (INR):' : 'Grand Total (INR):', 345, totalsY + 3, { width: 105, align: 'right' })
    .text(formatMoney(grandTotal), 455, totalsY + 3, { width: 90, align: 'right' });

  totalsY += 28;

  // Amount in Words (Directly underneath totals bar)
  const wordsText = numberToWordsINR(grandTotal);
  doc
    .font('Helvetica-Oblique')
    .fontSize(8)
    .fillColor('#475569')
    .text(`Amount in words: ${wordsText}`, 180, totalsY, { width: 375, align: 'right' });

  totalsY += 16;

  // --- 5. FOOTER & COMPLIANCE NOTES ---
  // Excess whitespace fix: anchor footer notes dynamically relative to totals rather than bottom-of-page
  const footerY = Math.max(totalsY + 30, 320);

  doc
    .strokeColor('#f1f5f9')
    .lineWidth(1)
    .moveTo(40, footerY)
    .lineTo(555, footerY)
    .stroke();

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor('#64748b')
    .text(isDonation ? 'Thank You for Backing SenpaiWorks:' : 'Important Information & Customer Care:', 40, footerY + 12);

  if (isDonation) {
    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor('#94a3b8')
      .text('• Your contribution directly powers independent anime creations, animator toolsets, and open community releases.', 40, footerY + 24)
      .text('• For contribution records or receipt queries, please contact support@senpaiworks.com with your Transaction ID.', 40, footerY + 34)
      .text('• This is an official electronic contribution receipt and requires no physical signature.', 40, footerY + 44);
  } else {
    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor('#94a3b8')
      .text('• 7-Day Replacement Policy: Eligible on physical merchandise after delivery via your SenpaiWorks Profile > Orders tab.', 40, footerY + 24)
      .text('• For inquiries, order tracking, or support, please contact support@senpaiworks.com with your Order ID.', 40, footerY + 34)
      .text('• This is a system-generated electronic invoice/receipt and requires no physical signature.', 40, footerY + 44);
  }

  doc.end();
}

module.exports = {
  generateOrderInvoicePDF
};
