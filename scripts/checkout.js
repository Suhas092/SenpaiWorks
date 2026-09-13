"use strict";

let cartData = [];
let discountPercentage = 0;
let flatDiscountAmount = 0;
let selectedPaymentMethod = null;
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
  const single = sessionStorage.getItem("checkoutSingleItem");
  if (single) {
    return [JSON.parse(single)];
  }
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

  // Check if cart contains donation items (No delivery address required for donations!)
  const isDonationMode = cartData.some(i => i && i.isDonation);
  const hasPhysical = cartData.some(i => i.type === 'physical');
  const isDigitalOnly = !hasPhysical && !isDonationMode;

  const deliveryCardBox = document.getElementById("delivery-address-card-box");
  const codOptionCard = document.getElementById("pay-card-cod");
  const submitBtn = document.getElementById("chk-submit-btn");
  const rightSummaryCol = document.getElementById("chk-right-summary-col");
  const donationSummaryBar = document.getElementById("donation-summary-bar");
  const layoutGrid = document.querySelector(".chk-layout-grid");
  const promoBox = document.querySelector(".chk-discount-box");
  const promoMsg = document.getElementById("promo-message");
  const cartHeaderLink = document.querySelector(".chk-header-cart-link");
  const newsOptinWrap = document.getElementById("chk-news-optin")?.closest(".chk-checkbox-wrap");
  let digitalNoticeBanner = document.getElementById("chk-digital-banner");

  if (isDonationMode) {
    // Hide delivery address, COD, order summary sidebar, promo code, cart link
    if (deliveryCardBox) deliveryCardBox.style.display = "none";
    if (codOptionCard) codOptionCard.style.display = "none";
    if (rightSummaryCol) rightSummaryCol.style.display = "none";
    if (promoBox) promoBox.style.display = "none";
    if (promoMsg) promoMsg.style.display = "none";
    if (cartHeaderLink) cartHeaderLink.style.display = "none";
    if (newsOptinWrap) newsOptinWrap.style.display = "none";
    if (digitalNoticeBanner) digitalNoticeBanner.style.display = "none";

    // Make layout full-width single column
    if (layoutGrid) layoutGrid.classList.add("donation-mode-layout");

    // Show donation summary bar
    if (donationSummaryBar) donationSummaryBar.style.display = "block";

    const donationObj = cartData.find(i => i && i.isDonation);
    if (donationObj) {
      if (donationObj.donorEmail) {
        const emailInput = document.getElementById("chk-email");
        if (emailInput && !emailInput.value) emailInput.value = donationObj.donorEmail;
      }
      if (donationObj.donorName) {
        const donorNameInput = document.getElementById("chk-donor-name");
        if (donorNameInput && !donorNameInput.value) donorNameInput.value = donationObj.donorName;
      }

      // Populate donation summary bar with amount and currency conversion
      populateDonationSummaryBar(donationObj);
    }

    // Update submit button
    if (submitBtn) {
      submitBtn.innerHTML = `<i class="fa-solid fa-heart"></i> Donate`;
      submitBtn.classList.add("donate-btn");
    }

    // Update page title
    document.title = "Donate — SenpaiWorks Community Support";
    const headerTitle = document.querySelector(".chk-secure-txt");
    if (headerTitle) headerTitle.textContent = "Secure Donation";

  } else if (isDigitalOnly) {
    // Hide delivery address card & hide COD payment method
    if (deliveryCardBox) deliveryCardBox.style.display = "none";
    if (codOptionCard) {
      codOptionCard.style.display = "none";
      if (selectedPaymentMethod === "cod") {
        selectedPaymentMethod = "razorpay";
      }
    }
    if (rightSummaryCol) rightSummaryCol.style.display = "";
    if (donationSummaryBar) donationSummaryBar.style.display = "none";

    // Inject/Show Digital Notice Banner above payment options
    if (!digitalNoticeBanner && deliveryCardBox) {
      digitalNoticeBanner = document.createElement("div");
      digitalNoticeBanner.id = "chk-digital-banner";
      digitalNoticeBanner.style.cssText = "background: rgba(6, 182, 212, 0.08); border: 1px solid rgba(6, 182, 212, 0.25); border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; display: flex; align-items: center; gap: 14px; color: #06b6d4;";
      digitalNoticeBanner.innerHTML = `
        <i class="fa-solid fa-bolt" style="font-size: 1.4rem; color: #06b6d4; flex-shrink: 0;"></i>
        <div>
          <strong style="display: block; font-size: 0.95rem; color: #f8fafc; margin-bottom: 2px;">Instant Digital Asset Delivery</strong>
          <span style="font-size: 0.84rem; color: #94a3b8; line-height: 1.4;">Your files will be unlocked for download immediately upon checkout. No shipping address needed.</span>
        </div>
      `;
      deliveryCardBox.parentNode.insertBefore(digitalNoticeBanner, deliveryCardBox);
    } else if (digitalNoticeBanner) {
      digitalNoticeBanner.style.display = "flex";
    }

  } else {
    // Physical or Mixed cart: full delivery address and COD option active
    if (deliveryCardBox) deliveryCardBox.style.display = "block";
    if (codOptionCard) codOptionCard.style.display = "block";
    if (rightSummaryCol) rightSummaryCol.style.display = "";
    if (donationSummaryBar) donationSummaryBar.style.display = "none";
    if (digitalNoticeBanner) digitalNoticeBanner.style.display = "none";
  }

  // Populate State dropdown dynamically for default country
  if (!isDonationMode && !isDigitalOnly) onCountryChange();

  // Check logged-in user state & load saved address
  const currentUser = getCurrentUser();
  const signinTrigger = document.getElementById("chk-signin-trigger");
  const loggedInBadge = document.getElementById("chk-logged-in-badge");

  if (currentUser) {
    const emailInput = document.getElementById("chk-email");
    if (emailInput && currentUser.email && !emailInput.value) emailInput.value = currentUser.email;

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
  if (!isDonationMode && !isDigitalOnly) {
    loadSavedAddressCard();
  }

  if (!isDonationMode) {
    renderSummaryItems();
    updateSummaryTotals();
  }
  initPaymentSelection();
}

// Donation Summary Bar — Currency Conversion Display
const USD_TO_INR = 85;

function populateDonationSummaryBar(donationObj) {
  const amount = donationObj.originalAmount || donationObj.price || 0;
  const currency = donationObj.currency || "USD";

  let amountInINR, amountInUSD;
  if (currency === "USD") {
    amountInUSD = amount;
    amountInINR = Math.round(amount * USD_TO_INR * 100) / 100;
  } else {
    amountInINR = amount;
    amountInUSD = Math.round((amount / USD_TO_INR) * 100) / 100;
  }

  const pillINR = document.getElementById("donate-pill-inr-val");
  const pillUSD = document.getElementById("donate-pill-usd-val");
  const lineAmount = document.getElementById("donate-line-amount");
  const conversionRate = document.getElementById("donate-conversion-rate");
  const pillINRBtn = document.getElementById("donate-pill-inr");
  const pillUSDBtn = document.getElementById("donate-pill-usd");

  if (pillINR) pillINR.textContent = `₹${amountInINR.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (pillUSD) pillUSD.textContent = `$${amountInUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (conversionRate) conversionRate.textContent = `1 USD = ${USD_TO_INR} INR (includes conversion)`;

  // Set active pill based on original currency
  if (currency === "INR") {
    if (pillINRBtn) pillINRBtn.classList.add("active");
    if (pillUSDBtn) pillUSDBtn.classList.remove("active");
    if (lineAmount) lineAmount.textContent = `₹${amountInINR.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else {
    if (pillUSDBtn) pillUSDBtn.classList.add("active");
    if (pillINRBtn) pillINRBtn.classList.remove("active");
    if (lineAmount) lineAmount.textContent = `$${amountInUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // Store amounts for switchDonateCurrency
  window._donateAmountINR = amountInINR;
  window._donateAmountUSD = amountInUSD;
}

window.switchDonateCurrency = function (curr) {
  const pillINRBtn = document.getElementById("donate-pill-inr");
  const pillUSDBtn = document.getElementById("donate-pill-usd");
  const lineAmount = document.getElementById("donate-line-amount");

  if (curr === "INR") {
    if (pillINRBtn) pillINRBtn.classList.add("active");
    if (pillUSDBtn) pillUSDBtn.classList.remove("active");
    if (lineAmount && window._donateAmountINR) {
      lineAmount.textContent = `₹${window._donateAmountINR.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  } else {
    if (pillUSDBtn) pillUSDBtn.classList.add("active");
    if (pillINRBtn) pillINRBtn.classList.remove("active");
    if (lineAmount && window._donateAmountUSD) {
      lineAmount.textContent = `$${window._donateAmountUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }
};

// 1. DYNAMIC COUNTRY & STATE DROPDOWN HANDLER
window.onCountryChange = function () {
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
let selectedSavedAddressId = null;

function getSavedAddressesStorageKey() {
  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem("currentUser"));
  } catch (e) {}
  if (currentUser && currentUser.email) {
    return "savedUserAddresses_" + encodeURIComponent(currentUser.email.toLowerCase().trim());
  }
  return "savedUserAddresses";
}

function getSavedAddressesList() {
  const key = getSavedAddressesStorageKey();
  let addrs = [];
  try {
    addrs = JSON.parse(localStorage.getItem(key)) || [];
  } catch (e) { addrs = []; }

  // Filter out any legacy hardcoded dummy placeholder addresses
  addrs = (addrs || []).filter(a => {
    if (!a) return false;
    if (a.id === "ADDR-DEF-1") return false;
    if (a.flat && typeof a.flat === 'string' && a.flat.includes("SenpaiWorks Studio, High Street")) return false;
    return true;
  });

  return addrs;
}

function loadSavedAddressCard() {
  const container = document.getElementById("saved-address-container");
  const manualFormGroup = document.getElementById("manual-address-form-group");
  if (!container) return;

  const addrs = getSavedAddressesList();
  if (addrs.length === 0) {
    container.innerHTML = "";
    isUsingSavedAddress = false;
    if (manualFormGroup) manualFormGroup.style.display = "block";
    return;
  }

  // 1. Get ONLY the Default Address (or first saved address if no default is flagged)
  const defaultAddr = addrs.find(a => a.isDefault) || addrs[0];
  selectedSavedAddressId = defaultAddr.id;

  if (isUsingSavedAddress) {
    if (manualFormGroup) manualFormGroup.style.display = "none";
  } else {
    if (manualFormGroup) manualFormGroup.style.display = "block";
  }

  let html = `
    <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
      <div class="saved-address-selector-card ${isUsingSavedAddress ? 'active' : ''}" id="saved-card-${defaultAddr.id}" onclick="window.useSavedAddressMode('${defaultAddr.id}')" style="border: 2px solid ${isUsingSavedAddress ? '#0284c7' : '#cbd5e1'}; background: ${isUsingSavedAddress ? 'rgba(14, 165, 233, 0.04)' : '#ffffff'}; padding: 14px 16px; border-radius: 12px; cursor: pointer; transition: all 0.2s ease;">
        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;">
          <div style="display: flex; align-items: flex-start; gap: 10px;">
            <input type="radio" name="chk_saved_addr_radio" ${isUsingSavedAddress ? 'checked' : ''} style="margin-top: 4px; accent-color: #0284c7; width: 18px; height: 18px; cursor: pointer;">
            <div>
              <div style="font-weight: 800; color: #0f172a; font-size: 0.95rem; display: flex; align-items: center; gap: 6px;">
                ${defaultAddr.fullName}
                <span style="background: #e0f2fe; color: #0284c7; font-size: 0.75rem; padding: 2px 8px; border-radius: 12px; font-weight: 700;">Default</span>
              </div>
              <div style="font-size: 0.88rem; color: #475569; margin-top: 4px; line-height: 1.4;">
                ${defaultAddr.flat}, ${defaultAddr.street}${defaultAddr.landmark ? ', ' + defaultAddr.landmark : ''}, ${defaultAddr.city ? defaultAddr.city.toUpperCase() : ''}, ${defaultAddr.state ? defaultAddr.state.toUpperCase() : ''} ${defaultAddr.pincode}, ${defaultAddr.country}
              </div>
              <div style="font-size: 0.82rem; color: #64748b; margin-top: 4px; font-weight: 600;">Phone number: ${defaultAddr.phone}</div>
            </div>
          </div>
          ${isUsingSavedAddress ? '<i class="fa-solid fa-circle-check" style="color: #0284c7; font-size: 1.2rem;"></i>' : ''}
        </div>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px; flex-wrap: wrap; gap: 8px;">
        <button type="button" class="btn-clear-addr" onclick="window.useManualAddressMode()" style="background: ${!isUsingSavedAddress ? '#0f172a' : '#ffffff'}; border: 1.5px solid ${!isUsingSavedAddress ? '#0f172a' : '#0284c7'}; color: ${!isUsingSavedAddress ? '#ffffff' : '#0284c7'}; padding: 8px 18px; border-radius: 20px; font-weight: 700; font-size: 0.86rem; cursor: pointer; transition: all 0.2s ease;">
          + Deliver to a different address
        </button>
        <a href="profile.html#addresses" style="font-weight: 700; font-size: 0.85rem; color: #0284c7; text-decoration: underline;">Manage Saved Addresses</a>
      </div>
    </div>`;

  container.innerHTML = html;
}

window.selectCheckoutAddress = function (id) {
  selectedSavedAddressId = id;
  isUsingSavedAddress = true;

  const manualFormGroup = document.getElementById("manual-address-form-group");
  if (manualFormGroup) manualFormGroup.style.display = "none";

  loadSavedAddressCard();
};

window.useSavedAddressMode = function (id) {
  isUsingSavedAddress = true;
  if (id) selectedSavedAddressId = id;
  const manualFormGroup = document.getElementById("manual-address-form-group");
  if (manualFormGroup) manualFormGroup.style.display = "none";

  loadSavedAddressCard();
};

window.useManualAddressMode = function () {
  isUsingSavedAddress = false;
  const manualFormGroup = document.getElementById("manual-address-form-group");
  if (manualFormGroup) manualFormGroup.style.display = "block";

  loadSavedAddressCard();
  clearAddressFields();
};

window.clearAddressFields = function () {
  const fields = ["chk-first-name", "chk-last-name", "chk-address", "chk-apartment", "chk-city", "chk-pincode", "chk-phone"];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
};

window.autofillCheckoutLocation = function (e) {
  const evt = e || window.event;
  const btn = evt ? (evt.target ? evt.target.closest("button") : null) : null;
  const originalHtml = btn ? btn.innerHTML : '<i class="fa-solid fa-crosshairs"></i> Autofill';

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Detecting location...';
  }

  function applyCheckoutLoc(city, state, pincode, street, countryCode) {
    const cityEl = document.getElementById("chk-city");
    const stateEl = document.getElementById("chk-state");
    const pinEl = document.getElementById("chk-pincode");
    const addrEl = document.getElementById("chk-address");
    const countryEl = document.getElementById("chk-country");

    if (cityEl && city) cityEl.value = city;
    if (pinEl && pincode) pinEl.value = pincode;
    if (addrEl && street && !addrEl.value) addrEl.value = street;

    if (countryEl && countryCode) {
      countryEl.value = countryCode;
      window.onCountryChange();
    }

    if (stateEl && state) {
      for (let i = 0; i < stateEl.options.length; i++) {
        if (stateEl.options[i].value.toLowerCase() === state.toLowerCase()) {
          stateEl.selectedIndex = i;
          break;
        }
      }
    }

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Location Autofilled!';
      setTimeout(() => { btn.innerHTML = originalHtml; }, 2500);
    }
  }

  async function fetchCoords(lat, lon) {
    try {
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
      if (res.ok) {
        const data = await res.json();
        const city = data.city || data.locality || data.principalSubdivision || "Mysuru";
        const state = data.principalSubdivision || "Karnataka";
        const pincode = data.postcode ? data.postcode.replace(/\D/g, "").slice(0, 6) : "570016";
        const street = data.localityInfo && data.localityInfo.informative ? data.localityInfo.informative[0].name : "";
        const countryCode = data.countryCode || "IN";

        applyCheckoutLoc(city, state, pincode, street, countryCode);
        return true;
      }
    } catch (err) {
      console.warn("BigDataCloud checkout lookup error:", err);
    }
    return false;
  }

  async function fetchIp() {
    try {
      const res = await fetch("https://ipapi.co/json/");
      if (res.ok) {
        const data = await res.json();
        const city = data.city || "Mysuru";
        const state = data.region || "Karnataka";
        const pincode = data.postal ? data.postal.replace(/\D/g, "").slice(0, 6) : "570016";
        const countryCode = data.country_code || "IN";

        applyCheckoutLoc(city, state, pincode, "", countryCode);
        return true;
      }
    } catch (err) {
      console.warn("IP lookup error:", err);
    }
    return false;
  }

  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const ok = await fetchCoords(pos.coords.latitude, pos.coords.longitude);
        if (!ok) await fetchIp();
      },
      async (err) => {
        const ok = await fetchIp();
        if (!ok) applyCheckoutLoc("Mysuru", "Karnataka", "570016", "", "IN");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  } else {
    fetchIp();
  }
};

// 3. SECURE CHECKOUT TOOLTIP HANDLER
window.toggleSecureCheckoutTooltip = function (e) {
  if (e) e.stopPropagation();
  const tooltip = document.getElementById("secure-checkout-tooltip");
  if (tooltip) {
    tooltip.classList.toggle("active");
  }
};

window.closeSecureCheckoutTooltip = function (e) {
  if (e) e.stopPropagation();
  const tooltip = document.getElementById("secure-checkout-tooltip");
  if (tooltip) {
    tooltip.classList.remove("active");
  }
};

window.toggleMobileSummaryList = function () {
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
  if (!item) return 0;
  if (item.isDonation) {
    if (item.currency === 'USD' || (item.originalAmount && item.price === item.originalAmount)) {
      return Math.round(Number(item.originalAmount || item.price) * 85);
    }
    return Math.round(Number(item.price)) || 85;
  }
  let p = item.price;
  if (typeof p === 'string') {
    p = parseFloat(p.replace(/[^0-9.]/g, '')) || 0;
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

window.removeCheckoutItem = function (index) {
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
window.applyPromoCode = function () {
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

// 8. SEPARATE PAYMENT METHOD HANDLER (AMAZON-STYLE)
function updateSubmitBtnState() {
  const submitBtn = document.getElementById("chk-submit-btn");
  if (!submitBtn) return;

  if (!selectedPaymentMethod) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Use this payment method";
    submitBtn.setAttribute("title", "Please select a payment method to continue");
  } else {
    submitBtn.disabled = false;
    submitBtn.removeAttribute("title");
    if (selectedPaymentMethod === "cod") {
      submitBtn.textContent = "Use this payment method (Cash on Delivery)";
    } else {
      submitBtn.textContent = "Use this payment method";
    }
  }
}

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
      updateSubmitBtnState();
    });
  });

  const hasPhysical = cartData.some(i => i.type === 'physical');
  const isDonationMode = cartData.some(i => i && i.isDonation);
  if (!hasPhysical || isDonationMode) {
    const codCard = document.getElementById("pay-card-cod");
    if (codCard) {
      codCard.style.display = "none";
      const codRadio = codCard.querySelector("input[type='radio']");
      if (codRadio) codRadio.checked = false;
    }
  }

  // Initial state: nothing selected by default, button unclickable
  selectedPaymentMethod = null;
  payCards.forEach(c => {
    c.classList.remove("active");
    const radio = c.querySelector("input[type='radio']");
    if (radio) radio.checked = false;
  });
  updateSubmitBtnState();
}

window.selectPayOption = function (method) {
  selectedPaymentMethod = method;
  const targetCard = document.getElementById(`pay-card-${method}`);
  const payCards = document.querySelectorAll(".payment-method-card");
  payCards.forEach(c => c.classList.remove("active"));
  if (targetCard) {
    targetCard.classList.add("active");
    const radio = targetCard.querySelector("input[type='radio']");
    if (radio) radio.checked = true;
  }
  updateSubmitBtnState();
};

// 9. CHECKOUT FORM SUBMISSION & VALIDATION
window.handleCheckoutSubmit = function (e) {
  if (e) e.preventDefault();

  const email = document.getElementById("chk-email").value.trim();
  if (!email) {
    alert("Please enter your email address for order confirmation.");
    return;
  }

  let finalAddressObj = null;

  const isDonationMode = cartData.some(i => i && i.isDonation);
  const hasPhysical = cartData.some(i => i.type === 'physical');
  const isDigitalOnly = !hasPhysical && !isDonationMode;

  const currentUser = getCurrentUser() || { username: "Collector", email: email };

  if (isDonationMode) {
    const donorNameInput = document.getElementById("chk-donor-name");
    const donorNameVal = donorNameInput ? donorNameInput.value.trim() : "";
    const donationObj = cartData.find(i => i && i.isDonation) || {};
    const finalName = donorNameVal || donationObj.donorName || "Community Supporter";

    finalAddressObj = {
      firstName: finalName,
      lastName: "",
      address: "Online Community Donation",
      apartment: "",
      city: "Digital",
      country: "IN",
      state: "Online",
      pincode: "000000",
      phone: ""
    };
  } else if (isDigitalOnly) {
    const defaultName = (currentUser && (currentUser.name || currentUser.username)) || (email.split('@')[0]) || "Collector";
    finalAddressObj = {
      firstName: defaultName,
      lastName: "",
      address: "Instant Digital Delivery",
      apartment: "",
      city: "Online",
      country: "IN",
      state: "Digital",
      pincode: "000000",
      phone: document.getElementById("chk-phone")?.value.trim() || ""
    };
  } else if (isUsingSavedAddress) {
    const addrs = getSavedAddressesList();
    const target = addrs.find(a => a.id === selectedSavedAddressId) || addrs[0];
    if (target) {
      const nameParts = (target.fullName || "").trim().split(" ");
      finalAddressObj = {
        firstName: nameParts[0] || "Collector",
        lastName: nameParts.slice(1).join(" ") || "",
        address: `${target.flat}, ${target.street}`,
        apartment: target.landmark || "",
        city: target.city,
        country: target.country,
        state: target.state,
        pincode: target.pincode,
        phone: target.phone
      };
    }
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

  const subtotal = cartData.reduce((sum, item) => sum + (getItemNumericPrice(item) * item.quantity), 0);
  const discountAmount = flatDiscountAmount > 0 ? flatDiscountAmount : (subtotal * discountPercentage) / 100;
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

  if (!selectedPaymentMethod) {
    alert("Please select a payment method before proceeding.");
    const stack = document.querySelector(".chk-payment-methods-stack");
    if (stack) stack.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

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

async function triggerRazorpaySDKPayment(orderData) {
  const submitBtn = document.getElementById("chk-submit-btn");
  const originalBtnText = submitBtn ? submitBtn.innerHTML : "Pay with Razorpay";

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="margin-right: 8px;"></i> Initializing Razorpay...`;
    }

    // 1. Call backend to compute authoritative prices and create Razorpay Order
    const createRes = await fetch("/api/payments/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: orderData.items,
        discountAmount: orderData.discountAmount,
        email: orderData.email,
        address: orderData.address
      })
    });

    const createData = await createRes.json();
    if (!createRes.ok || !createData.success) {
      throw new Error(createData.error || "Failed to initialize payment.");
    }

    const { keyId, orderId, amount, currency } = createData;

    if (!window.Razorpay) {
      throw new Error("Razorpay Checkout SDK failed to load. Please check your internet connection.");
    }

    // 2. Strict method mapping & isolation: only show the chosen method in Razorpay popup
    let rzpConfig = undefined;
    const methodPrefill = selectedPaymentMethod === 'upi' 
      ? 'upi' 
      : (selectedPaymentMethod === 'cards' || selectedPaymentMethod === 'card' ? 'card' : (selectedPaymentMethod === 'netbanking' ? 'netbanking' : undefined));

    if (selectedPaymentMethod === 'upi') {
      rzpConfig = {
        display: {
          blocks: {
            upi: {
              name: "Pay using UPI (Google Pay, PhonePe, Paytm, QR)",
              instruments: [
                {
                  method: "upi",
                  flows: ["qr", "intent", "collect"]
                }
              ]
            }
          },
          sequence: ["block.upi"],
          preferences: { show_default_blocks: false }
        }
      };
    } else if (selectedPaymentMethod === 'cards' || selectedPaymentMethod === 'card') {
      rzpConfig = {
        display: {
          blocks: {
            card: {
              name: "Credit & Debit Cards",
              instruments: [{ method: "card" }]
            }
          },
          sequence: ["block.card"],
          preferences: { show_default_blocks: false }
        }
      };
    } else if (selectedPaymentMethod === 'netbanking') {
      rzpConfig = {
        display: {
          blocks: {
            netbanking: {
              name: "Net Banking",
              instruments: [{ method: "netbanking" }]
            }
          },
          sequence: ["block.netbanking"],
          preferences: { show_default_blocks: false }
        }
      };
    }

    const isDonationOrder = (orderData.items || []).some(i => i && (i.isDonation || i.productId === 'DONATION' || (i.id && String(i.id).startsWith("donation"))));
    const isDigitalOrder = (orderData.items || []).every(i => i && (i.type === "digital" || (i.product && i.product.type === "digital")));

    const logoAsset = window.SENPAIWORKS_LOGO_STACKED || window.SENPAIWORKS_LOGO_BLACK_BG || `${window.location.origin}/assets/Videos/senpaiworks_razorpay_stacked_logo.png`;

    window.lastOrderPayload = orderData;

    // 3. Open official Razorpay Checkout Popup
    const options = {
      key: keyId,
      amount: amount,
      currency: currency || "INR",
      name: "SenpaiWorks",
      description: isDonationOrder ? "Community Patron Support" : (isDigitalOrder ? "Digital Art Assets" : "Anime Streetwear & Collectibles"),
      image: logoAsset,
      order_id: orderId,
      ...(rzpConfig ? { config: rzpConfig } : {}),
      handler: async function (response) {
        // Customer completed payment -> Cryptographic verification on server
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="margin-right: 8px;"></i> Verifying Payment...`;
        }

        try {
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(localStorage.getItem("userToken") ? { "Authorization": `Bearer ${localStorage.getItem("userToken")}` } : {})
            },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              orderData: orderData
            })
          });

          const verifyData = await verifyRes.json();
          if (!verifyRes.ok || !verifyData.success) {
            throw new Error(verifyData.error || "Payment signature verification failed.");
          }

          // Clear shopping cart or single item
          const singleStr = sessionStorage.getItem("checkoutSingleItem");
          if (singleStr) {
            let singleItem = JSON.parse(singleStr);
            let fullCart = localStorage.getItem("shoppingCart");
            if (fullCart) {
              let cart = JSON.parse(fullCart);
              const existingIdx = cart.findIndex(c => c.id === singleItem.id && c.variant === singleItem.variant);
              if (existingIdx > -1) {
                cart.splice(existingIdx, 1);
                localStorage.setItem("shoppingCart", JSON.stringify(cart));
              }
            }
            sessionStorage.removeItem("checkoutSingleItem");
          } else {
            localStorage.removeItem("shoppingCart");
          }

          // Redirect to Order Confirmation Page with donation flag if applicable
          const emailParam = verifyData.email ? `&email=${encodeURIComponent(verifyData.email)}` : "";
          const donationParam = isDonationOrder ? "&isDonation=true" : "";
          window.location.href = `order-confirmation.html?orderId=${verifyData.orderNumber}${emailParam}${donationParam}`;
        } catch (verErr) {
          console.error("Payment verification failed:", verErr);
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
          }
        }
      },
      prefill: {
        name: `${orderData.address ? orderData.address.firstName : "Collector"} ${orderData.address ? (orderData.address.lastName || "") : ""}`.trim(),
        email: orderData.email || "",
        contact: orderData.address ? (orderData.address.phone || "") : "",
        ...(methodPrefill ? { method: methodPrefill } : {})
      },
      notes: {
        address: orderData.address ? `${orderData.address.address || ""}, ${orderData.address.city || ""}` : "Bengaluru, Karnataka"
      },
      theme: {
        color: "#000000",
        backdrop_color: "rgba(0, 0, 0, 0.85)"
      },
      modal: {
        ondismiss: function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
          }
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", function (failResponse) {
      console.warn("Razorpay payment failed:", failResponse.error);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });

    rzp.open();
  } catch (err) {
    console.error("Razorpay initiation error:", err);
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  }
}


async function processVerifiedOrderSuccess(orderData) {
  const currentUser = getCurrentUser() || { username: orderData.address ? orderData.address.firstName : "Collector", email: orderData.email };

  // Sync donation records to backend if order contains a donation item
  if (orderData.items && orderData.items.length > 0) {
    const donationItem = orderData.items.find(i => i && i.isDonation);
    if (donationItem) {
      try {
        fetch("/api/donate/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            donorName: donationItem.donorName || (orderData.address ? orderData.address.firstName : "Community Supporter"),
            donorEmail: donationItem.donorEmail || orderData.email || "",
            amount: donationItem.originalAmount || donationItem.price || 1,
            currency: donationItem.currency || "USD",
            paymentMethod: orderData.paymentType || "store_checkout",
            paymentDetails: { paymentId: orderData.paymentId, orderId: orderData.orderId },
            message: donationItem.donorMessage || ""
          })
        }).catch(e => console.warn("Donation API background sync error:", e));
      } catch (e) { }
    }
  }

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

  // Sync order to backend and use the real DB order for confirmation
  let finalOrder = orderData;
  console.log("Checking token before order fetch:", localStorage.getItem("userToken"));
  const headers = {
    "Content-Type": "application/json"
  };
  const token = localStorage.getItem("userToken");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    console.log("Added Authorization header to order request");
  } else {
    console.warn("No userToken found in localStorage for order request");
  }

  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(orderData)
    });
    
    if (res.ok) {
      finalOrder = await res.json();
    } else {
      const errorData = await res.json().catch(() => ({}));
      const errorMessage = errorData.error || `Server returned status ${res.status}`;
      console.error("Order API sync returned non-OK status:", errorMessage);
      throw new Error(errorMessage);
    }
  } catch (e) {
    console.error("Order API sync failed:", e);
    alert("Checkout failed: Could not save order. " + e.message);
    return; // STOP! Do not clear cart or redirect to fake success page
  }

  // Clear shopping cart or just the checked out single item
  const singleStr = sessionStorage.getItem("checkoutSingleItem");
  if (singleStr) {
    let singleItem = JSON.parse(singleStr);
    let fullCart = localStorage.getItem("shoppingCart");
    if (fullCart) {
      let cart = JSON.parse(fullCart);
      const existingIdx = cart.findIndex(c => c.id === singleItem.id && c.variant === singleItem.variant);
      if (existingIdx > -1) {
        cart.splice(existingIdx, 1);
        localStorage.setItem("shoppingCart", JSON.stringify(cart));
      }
    }
    sessionStorage.removeItem("checkoutSingleItem");
  } else {
    localStorage.removeItem("shoppingCart");
  }

  // Redirect to Order Confirmation Page with the real DB orderNumber
  const finalId = finalOrder.orderNumber || finalOrder.orderId || finalOrder.id;
  const isDonationOrder = (orderData.items || []).some(i => i && (i.isDonation || i.productId === "DONATION" || (i.id && String(i.id).startsWith("donation"))));
  const donationParam = isDonationOrder ? "&isDonation=true" : "";
  
  // order-confirmation page uses query params for lookup now
  const emailParam = finalOrder.email ? `&email=${encodeURIComponent(finalOrder.email)}` : '';
  window.location.href = `order-confirmation.html?orderId=${finalId}${emailParam}${donationParam}`;
}

window.processTestPayment = function (paymentType) {
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
