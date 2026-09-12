"use strict";

document.addEventListener("DOMContentLoaded", () => {
  renderLatestOrderReceipt();
});

async function getOrderFromAPI(orderId, email) {
  try {
    const token = localStorage.getItem("userToken");
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    let url = `/api/orders/lookup?orderNumber=${orderId}`;
    if (email) url += `&email=${encodeURIComponent(email)}`;

    const res = await fetch(url, { headers });
    if (res.ok) {
      const data = await res.json();
      return (data && data.length > 0) ? data[0] : null;
    } else if (res.status === 404) {
       // if lookup fails (e.g. missing email), try fetching user's orders (if logged in) and matching
       if (token) {
           const res2 = await fetch("/api/orders", { headers });
           if (res2.ok) {
               const orders = await res2.json();
               return orders.find(o => o.orderNumber === orderId || (o.orderId === orderId)) || null;
           }
       }
    }
  } catch (err) {
    console.error("Failed to fetch order:", err);
  }
  return null;
}

async function renderLatestOrderReceipt() {
  const urlParams = new URLSearchParams(window.location.search);
  const paramOrderId = urlParams.get('orderId');
  const paramEmail = urlParams.get('email');

  let latestOrder = null;

  if (paramOrderId) {
    latestOrder = await getOrderFromAPI(paramOrderId, paramEmail);
  }

  // Fallback to local storage if API failed or no params
  if (!latestOrder) {
    const ordersStr = localStorage.getItem("user_orders") || localStorage.getItem("userOrders");
    const orders = ordersStr ? JSON.parse(ordersStr) : [];
    if (paramOrderId) {
       latestOrder = orders.find(o => o.orderId === paramOrderId || o.id === paramOrderId || o.orderNumber === paramOrderId);
    }
    if (!latestOrder && orders.length > 0) {
       latestOrder = orders[0];
    }
  }

  if (!latestOrder) {
    // Show error state
    document.body.innerHTML = "<div style='text-align:center; padding: 50px; font-family:sans-serif;'><h2>Order Not Found</h2><p>Could not locate the requested order.</p></div>";
    return;
  }

  const greetingNameEl = document.getElementById("rcpt-greeting-name");
  const greetingBoxEl = document.getElementById("rcpt-greeting-box");
  const greetingDescEl = document.getElementById("rcpt-greeting-desc");
  const addressTextEl = document.getElementById("rcpt-address-text");
  const addressHeadingEl = document.getElementById("rcpt-address-heading");
  const orderIdEl = document.getElementById("rcpt-order-id");
  const orderDateEl = document.getElementById("rcpt-order-date");
  const idLabelEl = document.getElementById("rcpt-id-label");
  const dateLabelEl = document.getElementById("rcpt-date-label");
  const deliveryDatesEl = document.getElementById("rcpt-delivery-dates");
  const itemsListEl = document.getElementById("rcpt-items-list");
  const paymentMethodEl = document.getElementById("rcpt-payment-method");
  const subtotalEl = document.getElementById("rcpt-subtotal-val");
  const subtotalLabelEl = document.getElementById("rcpt-subtotal-label");
  const shippingEl = document.getElementById("rcpt-shipping-val");
  const shippingRowEl = document.getElementById("rcpt-shipping-row");
  const grandTotalEl = document.getElementById("rcpt-grand-total-val");
  const totalLabelEl = document.getElementById("rcpt-total-label");

  // Determine user display name safely
  let userName = latestOrder.customerName || latestOrder.name || latestOrder.donorName || "";
  if (!userName && latestOrder.shippingAddress) {
    let addr = latestOrder.shippingAddress;
    if (typeof addr === "string") {
      try { addr = JSON.parse(addr); } catch(e) {}
    }
    if (typeof addr === "object" && addr) {
      userName = addr.firstName ? `${addr.firstName} ${addr.lastName || ""}`.trim() : addr.name || "";
    }
  }
  if (!userName) {
    const storedUser = localStorage.getItem("userData") || localStorage.getItem("user");
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        userName = u.name || u.username || u.displayName || "";
      } catch(e) {}
    }
  }
  if (!userName) userName = "Collector";

  // Check if this is a donation
  const isDonation = urlParams.get('isDonation') === 'true' || 
    (latestOrder.items || []).some(i => 
      i.productId === 'DONATION' ||
      (i.product && (i.product.id === 'DONATION' || i.product.isDonation)) || 
      i.isDonation || 
      (i.name && i.name.toLowerCase().includes('donation')) || 
      (i.productName && i.productName.toLowerCase().includes('donation')) ||
      (i.productName && i.productName.toLowerCase().includes('patron')) ||
      (i.name && i.name.toLowerCase().includes('patron'))
    );

  const heroBadgeEl = document.getElementById("rcpt-hero-badge") || document.querySelector(".confirmation-success-badge");
  const heroTitleEl = document.getElementById("rcpt-hero-title") || document.querySelector(".order-hero-title");
  const itemsHeadTitleEl = document.getElementById("rcpt-items-head-title") || document.querySelector(".order-items-head-title");
  const actionsRow = document.getElementById("rcpt-actions-row") || document.querySelector(".confirmation-actions-row");

  if (isDonation) {
    document.title = "Thank You for Your Contribution! — SenpaiWorks Patron Support";
    if (heroBadgeEl) {
      heroBadgeEl.innerHTML = `<i class="fa-solid fa-heart" style="color: #ef4444; margin-right: 6px;"></i> Contribution Confirmed`;
      heroBadgeEl.style.background = "rgba(239, 68, 68, 0.1)";
      heroBadgeEl.style.borderColor = "rgba(239, 68, 68, 0.3)";
      heroBadgeEl.style.color = "#ef4444";
    }
    if (heroTitleEl) heroTitleEl.textContent = "Thank you for supporting SenpaiWorks!";
    
    if (greetingNameEl) greetingNameEl.textContent = `Hi ${userName === "Collector" ? "Supporter" : userName},`;
    if (greetingDescEl) {
      greetingDescEl.innerHTML = `Your generous contribution directly fuels our original 2D/3D anime productions, indie creator resources, and community art releases.<br>A receipt and patron acknowledgement have been recorded for your account.`;
    }
    
    if (addressHeadingEl) addressHeadingEl.textContent = "Supporter Information";
    if (idLabelEl) idLabelEl.textContent = "Receipt nº";
    if (dateLabelEl) dateLabelEl.textContent = "Contribution Date";

    if (addressTextEl) {
      const emailDisplay = latestOrder.customerEmail || paramEmail || latestOrder.email || "Direct Patron Backer";
      addressTextEl.innerHTML = `
        <div style="font-weight: 800; color: #0f172a; font-size: 0.98rem; margin-bottom: 2px;">${userName === "Collector" ? "Creative Patron" : userName}</div>
        <div style="color: #64748b; font-size: 0.88rem; margin-bottom: 8px;">${emailDisplay}</div>
        <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(16, 185, 129, 0.1); color: #059669; padding: 4px 10px; border-radius: 999px; font-weight: 700; font-size: 0.78rem; border: 1px solid rgba(16, 185, 129, 0.25);">
          <i class="fa-solid fa-shield-halved"></i> Verified Community Patron
        </div>
      `;
    }

    if (itemsHeadTitleEl) itemsHeadTitleEl.textContent = "Your Patron Contribution";
    if (deliveryDatesEl) deliveryDatesEl.style.display = "none";
    if (shippingRowEl) shippingRowEl.style.display = "none";
    if (subtotalLabelEl) subtotalLabelEl.textContent = "Contribution Amount";
    if (totalLabelEl) totalLabelEl.textContent = "Total Contribution";

    if (actionsRow) {
      actionsRow.innerHTML = `
        <a href="community.html" class="btn-view-order" style="background: linear-gradient(135deg, #ef4444, #dc2626); border-color: #ef4444;">
          <i class="fa-solid fa-users"></i> Return to Community Hub
        </a>
        <a href="art-library.html" class="btn-secondary-order">
          <i class="fa-solid fa-palette"></i> Explore Art Library
        </a>
      `;
    }
  } else {
    if (greetingNameEl) greetingNameEl.textContent = `Hi ${userName},`;
    if (greetingDescEl) {
      greetingDescEl.innerHTML = `We are delighted that you have found something you like!<br>As soon as your package is on its way, you will receive a delivery confirmation from us by email.`;
    }
    if (addressTextEl) {
      let addrStr = "";
      if (latestOrder.shippingAddress) {
        let addr = latestOrder.shippingAddress;
        if (typeof addr === 'string') {
          try { addr = JSON.parse(addr); } catch(e) {}
        }
        if (typeof addr === 'object' && addr !== null) {
          addrStr = `${userName}<br>${addr.address || ''}<br>${addr.city || ''}, ${addr.state || ''} ${addr.pincode || ''}<br>${addr.country || 'India'}`;
        } else {
          addrStr = addr;
        }
      }
      addressTextEl.innerHTML = addrStr || "Address details not available";
    }

    if (actionsRow) {
      actionsRow.innerHTML = `
        <a href="store.html" class="btn-view-order">
          <i class="fa-solid fa-bag-shopping"></i> Continue Shopping
        </a>
        <a href="profile.html#orders" class="btn-secondary-order">
          <i class="fa-solid fa-box"></i> View Replacements & Orders
        </a>
      `;
    }
  }

  if (orderIdEl) orderIdEl.textContent = latestOrder.orderNumber || latestOrder.orderId || latestOrder.id;
  
  let dateObj = latestOrder.createdAt ? new Date(latestOrder.createdAt) : new Date();
  if (orderDateEl) orderDateEl.textContent = dateObj.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  // Calculate estimated delivery timeline
  const items = latestOrder.items || [];
  const hasPhysical = items.some(i => (i.product && i.product.type !== 'digital') || (!i.product && i.type !== 'digital'));
  const allDigital = items.length > 0 && !hasPhysical;

  if (isDonation) {
    if (deliveryDatesEl) deliveryDatesEl.style.display = "none";
  } else if (allDigital) {
    if (deliveryDatesEl) {
      deliveryDatesEl.style.display = "block";
      deliveryDatesEl.innerHTML = `<span style="color: #10b981; font-weight: 700;"><i class="fa-solid fa-bolt"></i> Instant Digital Delivery (Ready to Download)</span>`;
    }
  } else {
    const d1 = new Date(dateObj); d1.setDate(dateObj.getDate() + 3);
    const d2 = new Date(dateObj); d2.setDate(dateObj.getDate() + 5);
    const dateStr = `Standard Delivery: ${d1.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} - ${d2.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}`;
    if (deliveryDatesEl) {
      deliveryDatesEl.style.display = "block";
      deliveryDatesEl.textContent = dateStr;
    }
  }

  // Render Item Cards
  if (itemsListEl && latestOrder.items) {
    let itemsHtml = "";
    latestOrder.items.forEach(item => {
      const price = item.price || 0;
      const quantity = item.quantity || 1;
      const isDonItem = isDonation || item.isDonation || item.productId === "DONATION" || (item.id && String(item.id).startsWith("donation")) || (item.name && item.name.toLowerCase().includes("donation")) || (item.productName && item.productName.toLowerCase().includes("donation"));
      const isDigital = (item.product && item.product.type === "digital") || item.type === "digital";
      const downloadUrl = item.product?.downloadUrl || item.downloadUrl;

      itemsHtml += `
        <div class="order-item-card">
          <img src="${item.img || item.productImage || (isDonItem ? 'assets/Ayana.png' : 'assets/Videos/SenpaiWorks logo.png')}" alt="${item.name || item.productName || 'Item'}" class="order-item-img">
          <div class="order-item-details">
            <div class="order-item-name" style="display: flex; align-items: center; gap: 8px;">
              ${item.name || item.productName || (isDonItem ? 'Community Patron Contribution' : 'SenpaiWorks Item')}
              ${isDonItem ? '<span style="background: rgba(239, 68, 68, 0.12); color: #ef4444; font-size: 0.68rem; padding: 2px 8px; border-radius: 12px; font-weight: 800;"><i class="fa-solid fa-heart"></i> Patron Support</span>' : (isDigital ? '<span style="background: rgba(6, 182, 212, 0.15); color: #06b6d4; font-size: 0.68rem; padding: 2px 6px; border-radius: 4px; font-weight: 700;"><i class="fa-solid fa-cloud-arrow-down"></i> Digital Asset</span>' : '')}
            </div>
            <div style="color: #666666; margin-bottom: 4px;">${isDonItem ? 'Tier: Creative Community Supporter' : `Variant / Size: ${item.variant || item.size || (isDigital ? 'Digital Edition' : 'Standard Edition')}`}</div>
            ${isDonItem ? '' : `<div style="color: #666666;">Quantity: ${quantity}</div>`}
            ${isDigital && !isDonItem ? `
              <div style="margin-top: 8px;">
                <a href="${downloadUrl || '#'}" target="_blank" class="btn-download-asset" style="display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #06b6d4, #3b82f6); color: #ffffff; padding: 6px 14px; border-radius: 6px; text-decoration: none; font-size: 0.8rem; font-weight: 700; box-shadow: 0 2px 8px rgba(6, 182, 212, 0.3);">
                  <i class="fa-solid fa-cloud-arrow-down"></i> Download Asset
                </a>
              </div>
            ` : ''}
          </div>
          <div class="order-item-price">₹${(price * quantity).toLocaleString()}.00</div>
        </div>
      `;
    });
    itemsListEl.innerHTML = itemsHtml;
  }

  // Totals breakdown
  let subtotal = latestOrder.subtotal || latestOrder.total || 0;
  let shipping = latestOrder.shipping || 0;
  let discount = latestOrder.discount || 0;
  let grandTotal = latestOrder.total || (subtotal + shipping - discount);

  if (paymentMethodEl) {
    let pmtText = "Razorpay Gateway / Online";
    if (latestOrder.paymentId && latestOrder.paymentId.startsWith("COD")) {
      pmtText = "Cash on Delivery (COD)";
    } else if (latestOrder.paymentType) {
      pmtText = latestOrder.paymentType;
    }
    paymentMethodEl.textContent = pmtText;
  }

  if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toLocaleString()}.00`;
  if (shippingEl) shippingEl.textContent = shipping > 0 ? `₹${shipping.toLocaleString()}.00` : "Free";
  
  // Create a discount row if needed
  if (discount > 0 && !isDonation) {
    const parent = subtotalEl.parentElement.parentElement;
    let discountRow = document.getElementById("rcpt-discount-row");
    if (!discountRow) {
       discountRow = document.createElement("div");
       discountRow.id = "rcpt-discount-row";
       discountRow.className = "order-total-line-item";
       discountRow.innerHTML = `<span>Discount Applied</span><span style="color: #10b981; font-weight: 700;">-₹${discount.toLocaleString()}.00</span>`;
       parent.insertBefore(discountRow, grandTotalEl.parentElement);
    }
  }

  if (grandTotalEl) grandTotalEl.textContent = `₹${grandTotal.toLocaleString()}.00`;

  // Render Real Status Timeline (or Patron Appreciation Banner for donations)
  const timelineContainer = document.getElementById("rcpt-status-timeline-container");
  if (timelineContainer) {
    if (isDonation) {
      timelineContainer.innerHTML = `
        <div style="margin: 20px 0; padding: 20px 22px; background: linear-gradient(135deg, #fff1f2 0%, #f0fdf4 100%); border: 1.5px solid #fecdd3; border-radius: 14px; box-shadow: 0 4px 14px rgba(244, 63, 94, 0.06); display: flex; align-items: center; gap: 18px;">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #ef4444, #f43f5e); color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; flex-shrink: 0; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.35);">
            <i class="fa-solid fa-hand-holding-heart"></i>
          </div>
          <div>
            <div style="font-weight: 800; color: #9f1239; font-size: 1rem; margin-bottom: 2px;">Direct Studio Supporter Badge Active</div>
            <div style="font-size: 0.85rem; color: #475569; line-height: 1.45;">
              Your patronage is now logged. You have helped power independent anime creators, animation tools, and open art archives. Thank you!
            </div>
          </div>
        </div>
      `;
    } else {
      timelineContainer.innerHTML = generateOrderTimelineHtml(latestOrder);
    }
  }
}

// =========================================================================
// REAL STATUS TIMELINE GENERATOR (Using order.status & statusHistory only)
// =========================================================================
function generateOrderTimelineHtml(order) {
  if (!order) return "";

  const isDigital = (order.items || []).every(i => (i.product && i.product.type === "digital") || i.type === "digital") && (order.items || []).length > 0;
  const statusStr = (order.status || "Processing").trim();
  const isCancelled = statusStr.toLowerCase().includes("cancel");

  // Parse statusHistory if present
  let history = [];
  if (order.statusHistory) {
    try {
      history = typeof order.statusHistory === "string" ? JSON.parse(order.statusHistory) : order.statusHistory;
    } catch (e) {
      history = [];
    }
  }

  function getTimestampForStatus(name) {
    const found = history.find(h => (h.status || "").toLowerCase() === name.toLowerCase());
    if (found && found.timestamp) return new Date(found.timestamp);
    if (name.toLowerCase() === "placed" && order.createdAt) return new Date(order.createdAt);
    if (name.toLowerCase() === "delivered" && order.deliveredAt) return new Date(order.deliveredAt);
    if (name.toLowerCase() === statusStr.toLowerCase()) return new Date(order.updatedAt || order.createdAt || Date.now());
    return null;
  }

  function formatTimelineTime(d) {
    if (!d || isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  if (isDigital) {
    const deliveredDate = getTimestampForStatus("delivered") || (order.deliveredAt ? new Date(order.deliveredAt) : (order.createdAt ? new Date(order.createdAt) : new Date()));
    return `
      <div class="status-timeline-container" style="margin: 18px 0; padding: 18px; background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 12px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: #16a34a; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">
            <i class="fa-solid fa-bolt"></i>
          </div>
          <div>
            <div style="font-weight: 800; color: #166534; font-size: 0.95rem;">Instant Digital Delivery Confirmed</div>
            <div style="font-size: 0.8rem; color: #15803d; margin-top: 2px;">Asset delivered to your account on ${formatTimelineTime(deliveredDate) || "Instant Delivery"}</div>
          </div>
        </div>
      </div>
    `;
  }

  if (isCancelled) {
    const placedDate = getTimestampForStatus("placed");
    const cancelDate = getTimestampForStatus("cancelled") || new Date();
    return `
      <div class="status-timeline-container" style="margin: 18px 0; padding: 18px; background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 12px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: #ef4444; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">
            <i class="fa-solid fa-ban"></i>
          </div>
          <div>
            <div style="font-weight: 800; color: #991b1b; font-size: 0.95rem;">Order Cancelled</div>
            <div style="font-size: 0.8rem; color: #b91c1c; margin-top: 2px;">This order was cancelled on ${formatTimelineTime(cancelDate) || "Recently"}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; font-size: 0.82rem; color: #7f1d1d; border-top: 1px dashed #fca5a5; padding-top: 10px;">
          <span><strong>Order Placed:</strong> ${formatTimelineTime(placedDate) || "Confirmed"}</span>
          <span>&rarr;</span>
          <span><strong>Cancelled:</strong> ${formatTimelineTime(cancelDate) || "Processed"}</span>
        </div>
      </div>
    `;
  }

  const steps = [
    { key: "placed", label: "Placed", icon: "fa-solid fa-receipt" },
    { key: "processing", label: "Processing", icon: "fa-solid fa-boxes-packing" },
    { key: "shipped", label: "Shipped", icon: "fa-solid fa-truck" },
    { key: "delivered", label: "Delivered", icon: "fa-solid fa-house-circle-check" }
  ];

  const stLower = statusStr.toLowerCase();
  let currentStepIdx = 0;
  if (stLower.includes("deliver")) currentStepIdx = 3;
  else if (stLower.includes("transit") || stLower.includes("ship")) currentStepIdx = 2;
  else if (stLower.includes("process") || stLower.includes("pending")) currentStepIdx = 1;
  else currentStepIdx = 0;

  const stepsHtml = steps.map((s, idx) => {
    const isCompleted = idx < currentStepIdx;
    const isActive = idx === currentStepIdx;
    const isPending = idx > currentStepIdx;

    const dt = getTimestampForStatus(s.key);
    const dateStr = dt ? formatTimelineTime(dt) : (isActive && s.key === "processing" ? "In Progress" : "");

    let circleBg = "#e2e8f0";
    let circleColor = "#64748b";
    let textColor = "#64748b";

    if (isCompleted) {
      circleBg = "#0f172a";
      circleColor = "#ffffff";
      textColor = "#0f172a";
    } else if (isActive) {
      circleBg = "#0284c7";
      circleColor = "#ffffff";
      textColor = "#0284c7";
    }

    return `
      <div style="display: flex; flex-direction: column; align-items: center; text-align: center; flex: 1; position: relative; z-index: 2;">
        <div style="width: 38px; height: 38px; border-radius: 50%; background: ${circleBg}; color: ${circleColor}; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; font-weight: 700; margin-bottom: 8px; box-shadow: ${isActive ? '0 0 0 4px rgba(2, 132, 199, 0.2)' : 'none'}; transition: all 0.3s ease;">
          <i class="${isCompleted ? 'fa-solid fa-check' : s.icon}"></i>
        </div>
        <div style="font-weight: 800; font-size: 0.88rem; color: ${textColor}; margin-bottom: 2px;">
          ${s.label}
        </div>
        <div style="font-size: 0.72rem; color: ${isActive ? '#0284c7' : '#64748b'}; line-height: 1.2; max-width: 110px;">
          ${dateStr || (isPending ? 'Upcoming' : '')}
        </div>
      </div>
    `;
  }).join("");

  const progressPct = currentStepIdx === 0 ? 0 : currentStepIdx === 1 ? 33.3 : currentStepIdx === 2 ? 66.6 : 100;

  return `
    <div class="order-status-timeline-widget" style="margin: 20px 0; padding: 22px 18px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
      <div style="font-size: 0.75rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center;">
        <span><i class="fa-solid fa-timeline" style="color: #0284c7; margin-right: 6px;"></i> Order Status Timeline</span>
        <span style="background: ${currentStepIdx === 3 ? '#dcfce7' : '#e0f2fe'}; color: ${currentStepIdx === 3 ? '#166534' : '#0369a1'}; padding: 2px 8px; border-radius: 12px; font-size: 0.72rem; font-weight: 800;">${statusStr}</span>
      </div>
      <div style="position: relative; display: flex; align-items: flex-start; justify-content: space-between; width: 100%;">
        <div style="position: absolute; top: 19px; left: 10%; right: 10%; height: 3px; background: #e2e8f0; z-index: 1;"></div>
        <div style="position: absolute; top: 19px; left: 10%; width: ${progressPct * 0.8}%; height: 3px; background: #0f172a; z-index: 1; transition: width 0.4s ease;"></div>
        ${stepsHtml}
      </div>
    </div>
  `;
}
