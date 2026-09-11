"use strict";

let cartData = [];
let promoDiscountAmount = 0;
let promoDiscountPercent = 0;

document.addEventListener("DOMContentLoaded", () => {
  renderCartPage();
});

function getCartData() {
  const c = localStorage.getItem("shoppingCart");
  return c ? JSON.parse(c) : [];
}

// Curated Store Suggested Products (Matches Store UI & Catalog)
const SUGGESTED_STORE_PRODUCTS = [
  {
    id: "itachi-colored-tshirt",
    name: "Itachi Uchiha Duo Graphic Colored T-Shirt",
    price: 1499,
    type: "physical",
    subLabel: "Merchandise • India Only 🇮🇳",
    badge: "Best Seller",
    discount: "48% OFF",
    variant: "Oversized / Black",
    img: "assets/Store/Tshirts/Colored itachi tshirts/itachi_black_tshirt_colored.jpg"
  },
  {
    id: "zoro-colored-tshirt",
    name: "Roronoa Zoro Three-Sword Colored T-Shirt",
    price: 1499,
    type: "physical",
    subLabel: "Merchandise • India Only 🇮🇳",
    badge: "New Arrival",
    discount: "48% OFF",
    variant: "Oversized / Black",
    img: "assets/Store/Tshirts/colored Zoro tshirts/zoro_colored_black_tshirt.jpg"
  },
  {
    id: "kaneki-bw-tshirt",
    name: "Ken Kaneki Tokyo Ghoul B&W Edition T-Shirt",
    price: 1499,
    type: "physical",
    subLabel: "Merchandise • India Only 🇮🇳",
    badge: "Limited Edition",
    discount: "48% OFF",
    variant: "Oversized / Black",
    img: "assets/Store/Tshirts/Black and white kaneki tshirts/kaneki_bw_black_tshirt.jpg"
  },
  {
    id: "suzan-art-poster",
    name: "Suzens Idol Band Official Art Poster",
    price: 799,
    type: "physical",
    subLabel: "Art Poster • Glossy Print",
    badge: "Official",
    discount: "25% OFF",
    variant: "A2 Glossy Print",
    img: "https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/homepage/suzan_godrays_jggu36.webp"
  }
];

function getWishlistData() {
  const w = localStorage.getItem("userWishlist");
  if (w !== null) {
    try {
      return JSON.parse(w);
    } catch(e) {
      return [];
    }
  }
  return [];
}

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

function renderWishlistOrSuggestionsSection() {

  // 2. IF WISHLIST IS EMPTY -> RENDER SUGGESTED PRODUCTS SECTION (EXACT STORE PRODUCT CARD UI)
  const suggestedHtml = SUGGESTED_STORE_PRODUCTS.map((item, idx) => `
    <div class="product-card ${item.type}">
      <div class="prod-img-wrap">
        <a href="store-detail.html?id=${item.id}">
          <img src="${item.img}" alt="${item.name}">
        </a>
        <div class="prod-badges-row">
          <span class="prod-badge badge-custom">${item.badge}</span>
          <span class="prod-discount-badge">${item.discount}</span>
        </div>
      </div>
      <div class="prod-body">
        <h3 class="prod-title"><a href="store-detail.html?id=${item.id}">${item.name}</a></h3>
        <div class="prod-sub-row">
          <span class="prod-sub-text">${item.subLabel}</span>
        </div>
        <div class="prod-price-row">
          <span class="prod-price">${formatINR(item.price)}</span>
        </div>
        <button type="button" class="btn-store-cart-action" onclick="addSuggestedItemToCart(${idx})">
          <i class="fa-solid fa-cart-plus"></i> <span class="btn-txt-full">Add to Cart</span><span class="btn-txt-short">Add</span>
        </button>
      </div>
    </div>
  `).join("");

  return `
    <section class="wishlist-section-container suggested-section-container">
      <div class="wishlist-section-header">
        <div class="wishlist-header-title">
          <i class="fa-solid fa-sparkles" style="color: #f59e0b;"></i>
          <h2>Suggested for You</h2>
        </div>
        <p class="wishlist-header-desc">Trending anime apparel, art prints, and collectibles you might like.</p>
      </div>
      <div class="product-grid wishlist-store-grid">
        ${suggestedHtml}
      </div>
    </section>
  `;
}

function renderCartPage() {
  cartData = getCartData();
  if (window.clearCartHighlight) window.clearCartHighlight();

  const container = document.getElementById("cart-main-container");
  const countLabel = document.getElementById("cart-item-count-label");

  if (countLabel) {
    const totalQty = cartData.reduce((sum, item) => sum + item.quantity, 0);
    countLabel.textContent = `${totalQty} Item${totalQty === 1 ? '' : 's'}`;
  }

  if (!container) return;

  // 1. EMPTY CART STATE (USE ATTACHED CART ICON & SINGLE SHOPPING BUTTON)
  if (cartData.length === 0) {
    container.innerHTML = `
      <div class="empty-cart-hero-container">
        <div class="empty-cart-illustration-box">
          <img src="assets/empty-cart.svg" alt="Empty Cart Icon" class="empty-cart-icon-svg">
        </div>
        <h2 class="empty-cart-title">Your Cart is Empty</h2>
        <p class="empty-cart-desc">Looks like you haven't added anything to your cart yet. Explore our store to find your favorite anime apparel and art prints!</p>
        <div class="empty-cart-btn-row">
          <a href="store.html" class="btn-empty-cart-primary"><i class="fa-solid fa-bag-shopping"></i> Start Shopping</a>
        </div>

        <div class="empty-cart-perks-row">
          <div class="perk-item">
            <i class="fa-solid fa-truck-fast"></i>
            <span>Free Shipping over ₹999</span>
          </div>
          <div class="perk-item">
            <i class="fa-solid fa-shield-halved"></i>
            <span>Secure Checkout</span>
          </div>
          <div class="perk-item">
            <i class="fa-solid fa-rotate-left"></i>
            <span>7-Day Easy Replacements</span>
          </div>
          <div class="perk-item">
            <i class="fa-solid fa-headset"></i>
            <span>24/7 Customer Support</span>
          </div>
        </div>
      </div>

      <!-- WISHLIST (IF NOT EMPTY) OR SUGGESTED PRODUCTS (EXACT STORE UI) -->
      ${renderWishlistOrSuggestionsSection()}
    `;
    return;
  }

  // 2. POPULATED CART LAYOUT
  let subtotal = cartData.reduce((sum, item) => sum + (getItemNumericPrice(item) * item.quantity), 0);
  let discount = promoDiscountAmount > 0 ? promoDiscountAmount : (subtotal * promoDiscountPercent) / 100;
  let hasPhysical = cartData.some(i => i.type === 'physical');
  let shipping = hasPhysical ? (subtotal > 999 ? 0 : 99) : 0;
  let grandTotal = Math.max(0, subtotal - discount + shipping);

  let itemsHtml = "";
  cartData.forEach((item, index) => {
    const unitPrice = getItemNumericPrice(item);
    const lineTotal = unitPrice * item.quantity;

    itemsHtml += `
      <div class="cart-item-card">
        <div class="cart-item-img-wrap">
          <a href="store-detail.html?id=${item.id}">
            <img src="${item.img}" alt="${item.name}">
          </a>
        </div>

        <div class="cart-item-details-col">
          <div class="cart-item-name-txt"><a href="store-detail.html?id=${item.id}" style="color: inherit; text-decoration: none;">${item.name}</a></div>
          <div class="cart-item-variant-badge"><i class="fa-solid fa-tag"></i> ${item.variant || item.size || 'Standard Edition'}</div>
          <div class="cart-item-unit-price">Unit Price: ${formatINR(unitPrice)}</div>
        </div>

        <div class="cart-qty-control-box">
          <button type="button" class="cart-qty-btn" onclick="updateCartQuantity(${index}, ${item.quantity - 1})">-</button>
          <span class="cart-qty-num">${item.quantity}</span>
          <button type="button" class="cart-qty-btn" onclick="updateCartQuantity(${index}, ${item.quantity + 1})">+</button>
        </div>

        <div class="cart-item-total-col">
          <div class="cart-item-subtotal-txt">${formatINR(lineTotal)}</div>
          <button type="button" class="cart-item-delete-btn" onclick="removeCartItem(${index})">
            <i class="fa-solid fa-trash-can"></i> Remove
          </button>
          <button type="button" class="cart-item-checkout-single-btn" onclick="checkoutSingleItem(${index})" style="background: #000000ff; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 0.8rem; cursor: pointer; margin-top: 8px; width: 100%; transition: opacity 0.2s;">
            Buy Now
          </button>
        </div>
      </div>
    `;
  });

  window.checkoutSingleItem = function(index) {
    const item = cartData[index];
    if (item) {
      sessionStorage.setItem("checkoutSingleItem", JSON.stringify(item));
      window.location.href = "checkout.html";
    }
  };

  container.innerHTML = `
    <div class="cart-layout-grid">
      
      <!-- LEFT COLUMN: ITEMS LIST -->
      <div class="cart-items-section">
        <div class="cart-items-header-bar">
          <span>Items in Your Order</span>
          <span>${cartData.length} Unique Product${cartData.length === 1 ? '' : 's'}</span>
        </div>
        ${itemsHtml}
      </div>

      <!-- RIGHT COLUMN: SUMMARY SIDEBAR -->
      <div class="cart-summary-sidebar">
        <div class="cart-summary-sidebar-card">
          <h3 class="cart-summary-title">Order Summary</h3>

          <!-- Promo Code Box -->
          <div class="cart-promo-input-row">
            <input type="text" id="cart-promo-input" class="cart-promo-input" placeholder="Promo code (e.g. SENPAI100)">
            <button type="button" class="btn-cart-apply-promo" onclick="applyCartPromoCode()">Apply</button>
          </div>
          <div id="cart-promo-message" class="cart-promo-feedback"></div>

          <div class="cart-totals-breakdown">
            <div class="cart-total-row">
              <span>Subtotal</span>
              <span>${formatINR(subtotal)}</span>
            </div>
            <div class="cart-total-row">
              <span>Estimated Shipping</span>
              <span>${shipping === 0 ? '<strong style="color: #059669;">FREE</strong>' : formatINR(shipping)}</span>
            </div>
            ${discount > 0 ? `
              <div class="cart-total-row" style="color: #059669; font-weight: 700;">
                <span>Discount Applied</span>
                <span>-${formatINR(discount)}</span>
              </div>
            ` : ''}
            <div class="cart-total-row grand-total">
              <span>Total Amount</span>
              <span>${formatINR(grandTotal)}</span>
            </div>
          </div>

          <a href="checkout.html" class="btn-proceed-checkout">
            <i class="fa-solid fa-lock"></i> Proceed to Checkout
          </a>

          <div class="cart-guarantee-badges">
            <div><i class="fa-solid fa-shield-halved" style="color: #059669;"></i> 256-Bit Encrypted Secure Checkout</div>
            <div><i class="fa-solid fa-rotate-left" style="color: #38bdf8;"></i> 7-Day Easy Replacements</div>
          </div>
        </div>
      </div>

    </div>

    <!-- WISHLIST (IF NOT EMPTY) OR SUGGESTED PRODUCTS (EXACT STORE UI) -->
    ${renderWishlistOrSuggestionsSection()}
  `;
}

window.updateCartQuantity = function(index, newQty) {
  if (newQty <= 0) {
    removeCartItem(index);
    return;
  }
  cartData[index].quantity = newQty;
  localStorage.setItem("shoppingCart", JSON.stringify(cartData));
  if (window.Auth && window.Auth.syncUserCart) {
    window.Auth.syncUserCart(cartData);
  }
  renderCartPage();
};

window.removeCartItem = function(index) {
  cartData.splice(index, 1);
  localStorage.setItem("shoppingCart", JSON.stringify(cartData));
  if (window.Auth && window.Auth.syncUserCart) {
    window.Auth.syncUserCart(cartData);
  }
  renderCartPage();
};

window.addWishlistItemToCart = function(idx) {
  let wishlist = getWishlistData();
  const item = wishlist[idx];
  if (!item) return;

  let currentCart = getCartData();
  let existingIndex = currentCart.findIndex(c => c.name === item.name);

  if (existingIndex > -1) {
    currentCart[existingIndex].quantity += 1;
  } else {
    currentCart.push({
      name: item.name,
      price: item.price,
      type: item.type || "physical",
      variant: item.variant || "Standard",
      img: item.img,
      quantity: 1
    });
  }

  // Remove item from wishlist after moving to cart
  wishlist.splice(idx, 1);
  localStorage.setItem("userWishlist", JSON.stringify(wishlist));
  localStorage.setItem("shoppingCart", JSON.stringify(currentCart));
  
  renderCartPage();

  if (window.updateHeaderCartBadge) {
    window.updateHeaderCartBadge();
  }
};

window.addSuggestedItemToCart = function(idx) {
  const item = SUGGESTED_STORE_PRODUCTS[idx];
  if (!item) return;

  let currentCart = getCartData();
  let existingIndex = currentCart.findIndex(c => c.name === item.name);

  if (existingIndex > -1) {
    currentCart[existingIndex].quantity += 1;
  } else {
    currentCart.push({
      name: item.name,
      price: item.price,
      type: item.type || "physical",
      variant: item.variant || "Standard",
      img: item.img,
      quantity: 1
    });
  }

  localStorage.setItem("shoppingCart", JSON.stringify(currentCart));
  renderCartPage();

  if (window.updateHeaderCartBadge) {
    window.updateHeaderCartBadge();
  }
};

window.removeWishlistItem = function(idx) {
  let wishlist = getWishlistData();
  wishlist.splice(idx, 1);
  localStorage.setItem("userWishlist", JSON.stringify(wishlist));
  renderCartPage();
};

window.applyCartPromoCode = function() {
  const input = document.getElementById("cart-promo-input");
  const msg = document.getElementById("cart-promo-message");
  if (!input) return;

  const code = input.value.trim().toUpperCase();

  if (code === "SENPAI100") {
    let used = localStorage.getItem("usedDiscounts");
    used = used ? JSON.parse(used) : [];
    const currentUser = localStorage.getItem("currentUser");
    const userObj = currentUser ? JSON.parse(currentUser) : null;
    const userKey = userObj ? (userObj.email || userObj.username) : "guest";

    if (used.includes(userKey)) {
      promoDiscountAmount = 0;
      promoDiscountPercent = 0;
      if (msg) msg.innerHTML = `<span style="color:#ef4444; font-weight:700;">✕ SENPAI100 code has already been used on your account.</span>`;
    } else {
      promoDiscountAmount = 100;
      promoDiscountPercent = 0;
      if (msg) msg.innerHTML = `<span style="color:#059669; font-weight:700;">✓ ₹100.00 Registration Discount Applied!</span>`;
    }
  } else if (code === "SENPAI25") {
    promoDiscountAmount = 0;
    promoDiscountPercent = 25;
    if (msg) msg.innerHTML = `<span style="color:#059669; font-weight:700;">✓ 25% Discount Applied!</span>`;
  } else {
    promoDiscountAmount = 0;
    promoDiscountPercent = 0;
    if (msg) msg.innerHTML = `<span style="color:#ef4444; font-weight:700;">✕ Invalid discount code.</span>`;
  }

  renderCartPage();
};
