"use strict";

let cartData = [];
let discountPercentage = 0;
let flatDiscountAmount = 0;
let selectedPaymentMethod = "upi";
let isUsingSavedAddress = false;

// COMPREHENSIVE COUNTRY & STATE LIBRARY DATASET
const countryStatesMap = {
  IN: [
    "Karnataka", "Maharashtra", "Delhi", "Tamil Nadu", "Telangana", "Uttar Pradesh",
    "Gujarat", "Kerala", "West Bengal", "Punjab", "Haryana", "Rajasthan", "Madhya Pradesh",
    "Andhra Pradesh", "Bihar", "Odisha", "Assam", "Goa", "Himachal Pradesh", "Jammu & Kashmir",
    "Ladakh", "Uttarakhand", "Jharkhand", "Chhattisgarh", "Puducherry", "Chandigarh"
  ],
  US: [
    "California", "New York", "Texas", "Florida", "Washington", "Illinois", "Pennsylvania",
    "Ohio", "Georgia", "North Carolina", "Massachusetts", "Michigan", "Colorado", "Arizona", "Nevada"
  ],
  GB: [
    "England", "Scotland", "Wales", "Northern Ireland", "Greater London", "Manchester", "Birmingham"
  ],
  CA: [
    "Ontario", "Quebec", "British Columbia", "Alberta", "Manitoba", "Nova Scotia", "Saskatchewan"
  ],
  AU: [
    "New South Wales", "Victoria", "Queensland", "Western Australia", "South Australia", "Tasmania", "Australian Capital Territory"
  ],
  JP: [
    "Tokyo", "Osaka", "Kyoto", "Kanagawa", "Hokkaido", "Aichi", "Fukuoka", "Hyogo", "Saitama", "Chiba"
  ],
  DE: [
    "Bavaria", "Berlin", "North Rhine-Westphalia", "Baden-Württemberg", "Hesse", "Saxony", "Hamburg"
  ],
  AE: [
    "Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"
  ],
  SG: [
    "Central Region", "East Region", "North Region", "North-East Region", "West Region"
  ]
};

document.addEventListener("DOMContentLoaded", () => {
  initCheckoutPage();
});

function getCart() {
  const cart = localStorage.getItem("shoppingCart");
  return cart ? JSON.parse(cart) : [];
}

function getCurrentUser() {
  const user = localStorage.getItem("currentUser");
  return user ? JSON.parse(user) : null;
}

function initCheckoutPage() {
  cartData = getCart();

  if (cartData.length === 0) {
    alert("Your cart is empty! Redirecting to Store...");
    window.location.href = "store.html";
    return;
  }

  // Populate State dropdown dynamically for default country
  onCountryChange();

  // Check logged-in user state & load saved address
  const currentUser = getCurrentUser();
  const signinTrigger = document.getElementById("chk-signin-trigger");
  const loggedInBadge = document.getElementById("chk-logged-in-badge");

  if (currentUser) {
    const emailInput = document.getElementById("chk-email");
    if (emailInput && currentUser.email) emailInput.value = currentUser.email;

    if (signinTrigger) signinTrigger.style.display = "none";
    if (loggedInBadge) {
      loggedInBadge.style.display = "inline-block";
      loggedInBadge.textContent = `✓ Signed in as ${currentUser.name || currentUser.username}`;
    }
  } else {
    if (signinTrigger) {
      signinTrigger.style.display = "inline-block";
      signinTrigger.onclick = (e) => {
        e.preventDefault();
        if (window.checkAuthOrPrompt) {
          window.checkAuthOrPrompt("sign in to your account", () => {
            window.location.reload();
          });
        }
      };
    }
    if (loggedInBadge) loggedInBadge.style.display = "none";
  }

  // Load Saved Address selector if available
  loadSavedAddressCard();

  renderSummaryItems();
  updateSummaryTotals();
  initPaymentSelection();
}

// 1. DYNAMIC COUNTRY & STATE DROPDOWN HANDLER
window.onCountryChange = function() {
  const countrySelect = document.getElementById("chk-country");
  const stateSelect = document.getElementById("chk-state");
  if (!countrySelect || !stateSelect) return;

  const code = countrySelect.value;
  const states = countryStatesMap[code] || countryStatesMap["IN"];

  let html = "";
  states.forEach((st, idx) => {
    html += `<option value="${st}" ${idx === 0 ? 'selected' : ''}>${st}</option>`;
  });

  stateSelect.innerHTML = html;
};

// 2. SAVED DELIVERY ADDRESS CARD & CONDITIONAL FORM VISIBILITY
function getSavedAddress() {
  const saved = localStorage.getItem("savedUserAddress");
  if (saved) return JSON.parse(saved);

  const currentUser = getCurrentUser();
  if (currentUser && currentUser.address) {
    return currentUser.address;
  }
  return null;
}

function loadSavedAddressCard() {
  const container = document.getElementById("saved-address-container");
  const manualFormGroup = document.getElementById("manual-address-form-group");
  if (!container) return;

  const addr = getSavedAddress();
  if (!addr) {
    container.innerHTML = "";
    isUsingSavedAddress = false;
    if (manualFormGroup) manualFormGroup.style.display = "block";
    return;
  }

  // By default when saved address exists, use saved address and hide manual form
  isUsingSavedAddress = true;
  if (manualFormGroup) manualFormGroup.style.display = "none";

  container.innerHTML = `
    <div class="saved-address-selector-card active" id="saved-addr-card-elem">
      <div class="saved-addr-badge"><i class="fa-solid fa-circle-check" style="color: #059669;"></i> Using Saved Delivery Address</div>
      <div class="saved-addr-details">
        <strong>${addr.firstName} ${addr.lastName}</strong><br>
        <span>${addr.address}${addr.apartment ? ', ' + addr.apartment : ''}, ${addr.city}, ${addr.state} ${addr.pincode}</span><br>
        <span style="color: #64748b;">Phone: ${addr.phone}</span>
      </div>
      <div class="saved-addr-actions">
        <button type="button" class="btn-use-saved-addr active" id="btn-toggle-saved" onclick="useSavedAddressMode()">
          <i class="fa-solid fa-check"></i> Delivered to Saved Address
        </button>
        <button type="button" class="btn-clear-addr" id="btn-toggle-manual" onclick="useManualAddressMode()">
          + Enter Different Address
        </button>
      </div>
    </div>
  `;
}

window.useSavedAddressMode = function() {
  isUsingSavedAddress = true;
  const manualFormGroup = document.getElementById("manual-address-form-group");
  if (manualFormGroup) manualFormGroup.style.display = "none";

  const btnSaved = document.getElementById("btn-toggle-saved");
  const btnManual = document.getElementById("btn-toggle-manual");
  if (btnSaved) {
    btnSaved.className = "btn-use-saved-addr active";
    btnSaved.innerHTML = `<i class="fa-solid fa-check"></i> Delivered to Saved Address`;
  }
  if (btnManual) btnManual.className = "btn-clear-addr";
};

window.useManualAddressMode = function() {
  isUsingSavedAddress = false;
  const manualFormGroup = document.getElementById("manual-address-form-group");
  if (manualFormGroup) manualFormGroup.style.display = "block";

  const btnSaved = document.getElementById("btn-toggle-saved");
  const btnManual = document.getElementById("btn-toggle-manual");
  if (btnSaved) {
    btnSaved.className = "btn-use-saved-addr outline";
    btnSaved.innerHTML = `Use Saved Address`;
  }
  if (btnManual) btnManual.className = "btn-clear-addr active";

  clearAddressFields();
};

window.clearAddressFields = function() {
  const fields = ["chk-first-name", "chk-last-name", "chk-address", "chk-apartment", "chk-city", "chk-pincode", "chk-phone"];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
};

// 3. SECURE CHECKOUT TOOLTIP HANDLER
window.toggleSecureCheckoutTooltip = function(e) {
  if (e) e.stopPropagation();
  const tooltip = document.getElementById("secure-checkout-tooltip");
  if (tooltip) {
    tooltip.classList.toggle("active");
  }
};

window.closeSecureCheckoutTooltip = function(e) {
  if (e) e.stopPropagation();
  const tooltip = document.getElementById("secure-checkout-tooltip");
  if (tooltip) {
    tooltip.classList.remove("active");
  }
};

window.toggleMobileSummaryList = function() {
  if (window.innerWidth > 900) return;
  const itemsList = document.getElementById("summary-items-list");
  const promoBox = document.querySelector(".chk-discount-box");
  const promoMsg = document.getElementById("promo-message");
  const toggleIcon = document.getElementById("chk-summary-toggle-icon");

  if (!itemsList) return;
  const isHidden = itemsList.style.display === "none";

  if (isHidden) {
    itemsList.style.display = "flex";
    if (promoBox) promoBox.style.display = "flex";
    if (promoMsg) promoMsg.style.display = "block";
    if (toggleIcon) toggleIcon.innerHTML = `<i class="fa-solid fa-chevron-up"></i>`;
  } else {
    itemsList.style.display = "none";
    if (promoBox) promoBox.style.display = "none";
    if (promoMsg) promoMsg.style.display = "none";
    if (toggleIcon) toggleIcon.innerHTML = `<i class="fa-solid fa-chevron-down"></i>`;
  }
};

// 4. PRICE FORMATTING HELPERS
function getItemNumericPrice(item) {
  let p = item.price;
  if (typeof p === 'string') {
    p = parseFloat(p.replace(/[^0-9.]/g, '')) || 0;
  }
  if (p > 0 && p < 100) {
    p = Math.round(p * 83); // USD to INR conversion
  }
  return Math.round(p);
}

function formatINR(val) {
  const num = Math.round(val);
  return `₹${num.toLocaleString('en-IN')}.00`;
}

// 5. RENDER SUMMARY ITEMS SIDEBAR
function renderSummaryItems() {
  const summaryList = document.getElementById("summary-items-list");
  if (!summaryList) return;

  let html = "";
  cartData.forEach((item, index) => {
    const itemPrice = getItemNumericPrice(item);
    const lineTotal = itemPrice * item.quantity;

    html += `
      <div class="chk-sidebar-item">
        <div class="chk-item-thumb-wrap">
          <img src="${item.img}" alt="${item.name}">
          <span class="chk-item-badge-qty">${item.quantity}</span>
        </div>
        <div class="chk-item-info">
          <div class="chk-item-title-txt">${item.name}</div>
          <div class="chk-item-variant-txt">${item.variant || item.size || 'Standard Edition'}</div>
        </div>
        <div class="chk-item-price-txt">${formatINR(lineTotal)}</div>
        <button type="button" class="chk-item-remove-btn" onclick="removeCheckoutItem(${index})" title="Remove item">&times;</button>
      </div>
    `;
  });

  summaryList.innerHTML = html;
}

window.removeCheckoutItem = function(index) {
  cartData.splice(index, 1);
  localStorage.setItem("shoppingCart", JSON.stringify(cartData));

  if (cartData.length === 0) {
    alert("Your cart is now empty! Returning to Store...");
    window.location.href = "store.html";
    return;
  }

  renderSummaryItems();
  updateSummaryTotals();
};

// 6. CALCULATE & UPDATE TOTALS
function updateSummaryTotals() {
  let subtotal = cartData.reduce((sum, item) => sum + (getItemNumericPrice(item) * item.quantity), 0);
  let discountAmount = flatDiscountAmount > 0 ? flatDiscountAmount : (subtotal * discountPercentage) / 100;
  let hasPhysical = cartData.some(i => i.type === 'physical');
  let shipping = hasPhysical ? (subtotal > 999 ? 0 : 99) : 0;
  let grandTotal = Math.max(0, subtotal - discountAmount + shipping);

  const subtotalEl = document.getElementById("chk-subtotal-val");
  const shippingEl = document.getElementById("chk-shipping-val");
  const discountEl = document.getElementById("chk-discount-val");
  const totalEl = document.getElementById("chk-grand-total-val");
  const rzpModalAmountEl = document.getElementById("rzp-modal-amount");

  if (subtotalEl) subtotalEl.textContent = formatINR(subtotal);
  if (shippingEl) shippingEl.textContent = shipping === 0 ? "FREE" : formatINR(shipping);
  if (discountEl) discountEl.textContent = `-${formatINR(discountAmount)}`;
  if (totalEl) totalEl.textContent = formatINR(grandTotal);
  if (rzpModalAmountEl) rzpModalAmountEl.textContent = formatINR(grandTotal);
}

// 7. APPLY PROMO CODE (SENPAI100 or SENPAI25)
window.applyPromoCode = function() {
  const input = document.getElementById("chk-promo-input");
  const msgEl = document.getElementById("promo-message");
  if (!input) return;

  const currentUser = getCurrentUser();
  const code = input.value.trim().toUpperCase();

  if (code === "SENPAI100") {
    let usedDiscounts = localStorage.getItem("usedDiscounts");
    usedDiscounts = usedDiscounts ? JSON.parse(usedDiscounts) : [];

    const userKey = currentUser ? (currentUser.email || currentUser.username) : "guest";
    if (usedDiscounts.includes(userKey)) {
      flatDiscountAmount = 0;
      discountPercentage = 0;
      if (msgEl) {
        msgEl.innerHTML = `<span style="color:#ef4444; font-weight:700;">✕ SENPAI100 code has already been used on this account.</span>`;
      }
    } else {
      flatDiscountAmount = 100;
      discountPercentage = 0;
      if (msgEl) {
        msgEl.innerHTML = `<span style="color:#059669; font-weight:700;">✓ ₹100.00 Registration Discount Applied (SENPAI100)</span>`;
      }
    }
  } else if (code === "SENPAI25") {
    flatDiscountAmount = 0;
    discountPercentage = 25;
    if (msgEl) {
      msgEl.innerHTML = `<span style="color:#059669; font-weight:700;">✓ 25% Discount Applied (SENPAI25)</span>`;
    }
  } else {
    flatDiscountAmount = 0;
    discountPercentage = 0;
    if (msgEl) {
      msgEl.innerHTML = `<span style="color:#ef4444; font-weight:700;">✕ Invalid code. Use SENPAI100 for ₹100 OFF!</span>`;
    }
  }
  updateSummaryTotals();
};

// 8. SEPARATE PAYMENT METHOD HANDLER
function initPaymentSelection() {
  const payCards = document.querySelectorAll(".payment-method-card");
  payCards.forEach(card => {
    card.addEventListener("click", () => {
      payCards.forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      const radio = card.querySelector("input[type='radio']");
      if (radio) {
        radio.checked = true;
        selectedPaymentMethod = radio.value;
      }
    });
  });
}

window.selectPayOption = function(method) {
  selectedPaymentMethod = method;
};

// 9. CHECKOUT FORM SUBMISSION & VALIDATION
window.handleCheckoutSubmit = function(e) {
  if (e) e.preventDefault();

  const email = document.getElementById("chk-email").value.trim();
  if (!email) {
    alert("Please enter your email address for order confirmation.");
    return;
  }

  let finalAddressObj = null;

  if (isUsingSavedAddress) {
    finalAddressObj = getSavedAddress();
  } else {
    const firstName = document.getElementById("chk-first-name").value.trim();
    const lastName = document.getElementById("chk-last-name").value.trim();
    const address = document.getElementById("chk-address").value.trim();
    const apartment = document.getElementById("chk-apartment").value.trim();
    const city = document.getElementById("chk-city").value.trim();
    const country = document.getElementById("chk-country").value;
    const state = document.getElementById("chk-state").value;
    const pincode = document.getElementById("chk-pincode").value.trim();
    const phone = document.getElementById("chk-phone").value.trim();
    const saveInfo = document.getElementById("chk-save-info").checked;

    if (!firstName || !lastName || !address || !city || !state || !pincode || !phone) {
      alert("Please fill in all required delivery address fields.");
      return;
    }

    finalAddressObj = {
      firstName,
      lastName,
      address,
      apartment,
      city,
      country,
      state,
      pincode,
      phone
    };

    if (saveInfo) {
      localStorage.setItem("savedUserAddress", JSON.stringify(finalAddressObj));
    }
  }

  const currentUser = getCurrentUser() || { username: "Guest Collector", email: email };
  const subtotal = cartData.reduce((sum, item) => sum + (getItemNumericPrice(item) * item.quantity), 0);
  const discountAmount = flatDiscountAmount > 0 ? flatDiscountAmount : (subtotal * discountPercentage) / 100;
  const hasPhysical = cartData.some(i => i.type === 'physical');
  const shipping = hasPhysical ? (subtotal > 999 ? 0 : 99) : 0;
  const grandTotal = Math.max(0, subtotal - discountAmount + shipping);
  const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);

  const orderPayload = {
    orderId,
    email,
    address: finalAddressObj,
    items: cartData,
    subtotal,
    discountAmount,
    shipping,
    grandTotal,
    date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  };

  if (selectedPaymentMethod === "razorpay" || selectedPaymentMethod === "upi" || selectedPaymentMethod === "cards" || selectedPaymentMethod === "netbanking") {
    triggerRazorpaySDKPayment(orderPayload);
  } else if (selectedPaymentMethod === "cod") {
    processVerifiedOrderSuccess({
      ...orderPayload,
      paymentId: "COD-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
      paymentType: "Cash on Delivery (COD)"
    });
  }
};

// CONFIGURATION: Insert your official Razorpay Key ID when connecting a live backend server
const RAZORPAY_KEY_ID = ""; // e.g. "rzp_test_1234567890"

function triggerRazorpaySDKPayment(orderData) {
  window.pendingRazorpayOrder = orderData;

  const rzpModalAmountEl = document.getElementById("rzp-modal-amount");
  if (rzpModalAmountEl) {
    rzpModalAmountEl.textContent = `₹${orderData.grandTotal.toFixed(2)}`;
  }

  // If a valid live/test key is configured and Razorpay SDK is loaded, attempt official SDK popup
  if (RAZORPAY_KEY_ID && window.Razorpay) {
    try {
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: Math.round(orderData.grandTotal * 100),
        currency: "INR",
        name: "SenpaiWorks Studio",
        description: `Order ${orderData.orderId} - Official Merchandise & Assets`,
        image: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp",
        handler: function(response) {
          processVerifiedOrderSuccess({
            ...orderData,
            paymentId: response.razorpay_payment_id || ("pay_" + Math.random().toString(36).substring(2, 10)),
            paymentType: "Razorpay Official Gateway"
          });
        },
        prefill: {
          name: `${orderData.address ? orderData.address.firstName : 'Collector'} ${orderData.address ? orderData.address.lastName : ''}`,
          email: orderData.email || "collector@senpaiworks.com",
          contact: orderData.address ? orderData.address.phone : "9876543210"
        },
        notes: {
          address: orderData.address ? `${orderData.address.address}, ${orderData.address.city}` : "Bengaluru, Karnataka"
        },
        theme: {
          color: "#2563eb"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      return;
    } catch (e) {
      console.warn("Razorpay SDK initialization failed, launching embedded gateway modal.", e);
    }
  }

  // Seamless Embedded Gateway Modal for Local Testing
  openRazorpayModal();
}

function openRazorpayModal() {
  const rzpModal = document.getElementById("razorpay-checkout-modal");
  if (rzpModal) rzpModal.classList.add("active");
}

window.closeRazorpayModal = function() {
  const rzpModal = document.getElementById("razorpay-checkout-modal");
  if (rzpModal) rzpModal.classList.remove("active");
};

function processVerifiedOrderSuccess(orderData) {
  const currentUser = getCurrentUser() || { username: orderData.address ? orderData.address.firstName : "Collector", email: orderData.email };

  // Record discount usage if SENPAI100 was applied
  if (flatDiscountAmount === 100) {
    let usedDiscounts = localStorage.getItem("usedDiscounts");
    usedDiscounts = usedDiscounts ? JSON.parse(usedDiscounts) : [];
    const userKey = currentUser ? (currentUser.email || currentUser.username) : "guest";
    if (!usedDiscounts.includes(userKey)) {
      usedDiscounts.push(userKey);
      localStorage.setItem("usedDiscounts", JSON.stringify(usedDiscounts));
    }
  }

  // Save order object to localStorage for order confirmation & admin/profile history
  let existingOrders = localStorage.getItem("user_orders");
  existingOrders = existingOrders ? JSON.parse(existingOrders) : [];
  existingOrders.unshift(orderData);
  localStorage.setItem("user_orders", JSON.stringify(existingOrders));

  // Store latest order for receipt display
  localStorage.setItem("latestOrder", JSON.stringify(orderData));

  // Clear shopping cart
  localStorage.removeItem("shoppingCart");

  // Redirect to Order Confirmation Page
  window.location.href = `order-confirmation.html?orderId=${orderData.orderId}`;
}

window.processTestPayment = function(paymentType) {
  const pending = window.pendingRazorpayOrder;
  const email = document.getElementById("chk-email") ? document.getElementById("chk-email").value.trim() : "collector@senpaiworks.com";
  const address = getSavedAddress() || { firstName: "Guest", lastName: "Collector", city: "Bengaluru", state: "Karnataka" };
  const subtotal = cartData.reduce((sum, item) => sum + (getItemNumericPrice(item) * item.quantity), 0);
  const discountAmount = flatDiscountAmount > 0 ? flatDiscountAmount : (subtotal * discountPercentage) / 100;
  const hasPhysical = cartData.some(i => i.type === 'physical');
  const shipping = hasPhysical ? (subtotal > 999 ? 0 : 99) : 0;
  const grandTotal = Math.max(0, subtotal - discountAmount + shipping);
  const orderId = pending ? pending.orderId : ("ORD-" + Math.floor(100000 + Math.random() * 900000));

  closeRazorpayModal();

  processVerifiedOrderSuccess({
    orderId,
    email: pending ? pending.email : email,
    address: pending ? pending.address : address,
    items: pending ? pending.items : cartData,
    subtotal: pending ? pending.subtotal : subtotal,
    discountAmount: pending ? pending.discountAmount : discountAmount,
    shipping: pending ? pending.shipping : shipping,
    grandTotal: pending ? pending.grandTotal : grandTotal,
    paymentId: "pay_" + Math.random().toString(36).substring(2, 10),
    paymentType: paymentType || "Razorpay Gateway",
    date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  });
};
