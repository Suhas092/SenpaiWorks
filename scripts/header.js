window.handleProfileButtonClick = function (e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  let currentUser = null;
  if (window.Auth && window.Auth.getCurrentUser) {
    currentUser = window.Auth.getCurrentUser();
  }
  if (!currentUser) {
    const isLoggedOut = localStorage.getItem("userLoggedOut") === "true" || localStorage.getItem("isLoggedIn") === "false";
    if (!isLoggedOut) {
      const user = localStorage.getItem("currentUser");
      if (user) {
        try { currentUser = JSON.parse(user); } catch (err) { currentUser = null; }
      }
    }
  }

  const dropCardElem = document.getElementById("profile-dropdown-card");
  const isMobileNav = e && e.target && (e.target.id === "mobile-nav-auth" || e.target.closest("#mobile-bottom-nav"));

  if (currentUser) {
    if (isMobileNav) {
      window.location.href = "profile.html";
    } else if (dropCardElem) {
      dropCardElem.classList.toggle("active");
    } else {
      window.location.href = "profile.html";
    }
  } else {
    if (dropCardElem) dropCardElem.classList.remove("active");
    window.location.href = "login.html";
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const placeholder = document.getElementById("header-placeholder");
  if (!placeholder) return;

  // Clear stale cached header
  sessionStorage.removeItem("cached_header");

  function setupHeader() {
    // 1. Active state for desktop nav and mobile navbar
    const links = placeholder.querySelectorAll(".nav-link, .mobile-nav-item");
    const pathPop = window.location.pathname.split("/").pop();
    let currentPage = pathPop ? pathPop.toLowerCase().replace(/\.html$/, "") : "";
    if (!currentPage) currentPage = "index";

    // Section mapping for child/detail pages to their main navigation item
    // e.g. when inside course-detail.html, the LEARN nav button stays active
    const sectionMap = {
      "course-detail": "learn",
      "course-details": "learn",
      "course": "learn",
      "courses": "learn",
      "learn": "learn",
      "product-detail": "store",
      "product-details": "store",
      "cart": "store",
      "checkout": "store",
      "order-confirmation": "store",
      "news-detail": "news",
      "article": "news",
      "motion-player": "motion",
      "index": "home"
    };

    const targetSection = sectionMap[currentPage] || currentPage;

    links.forEach(link => {
      const hrefAttr = link.getAttribute("href");
      if (!hrefAttr) return;

      const linkHref = hrefAttr.toLowerCase().replace(/\.html$/, "").replace(/^\//, "");

      if (linkHref === targetSection || linkHref === currentPage) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });


    // 1.5 Ticker animation delay sync
    const tickerTrack = placeholder.querySelector(".header-ticker-track");
    if (tickerTrack) {
      if (!sessionStorage.getItem("ticker_base_time")) {
        sessionStorage.setItem("ticker_base_time", Date.now().toString());
      }
      const baseTime = parseInt(sessionStorage.getItem("ticker_base_time") || "0", 10);
      const elapsedMs = Date.now() - baseTime;
      const durationMs = 45000;
      const offsetSeconds = (elapsedMs % durationMs) / 1000;
      tickerTrack.style.animationDelay = `-${offsetSeconds}s`;
    }

    // 2. Initialize header interactions & drawer
    initHeaderInteractions();
    if (typeof initDrawer === "function") {
      initDrawer();
    }

    // 3. Fetch notification count immediately now that header elements exist in DOM
    if (typeof window.fetchUnreadCount === "function") {
      window.fetchUnreadCount();
    }
  }

  // If placeholder already has pre-rendered or cached markup, activate immediately
  if (placeholder.children.length > 0) {
    setupHeader();
  }

  // Populate placeholder
  fetch("header.html?v=" + new Date().getTime())
    .then(res => res.text())
    .then(data => {
      placeholder.innerHTML = data;
      setupHeader();
    })
    .catch(err => console.error("Error loading header:", err));
});

function initHeaderInteractions() {
  // Elements
  const authModal = document.getElementById("auth-modal");
  const authBtns = document.querySelectorAll("#nav-auth-btn, #mobile-nav-auth");
  const authCloseBtn = document.getElementById("auth-close-btn");
  const authTexts = document.querySelectorAll(".auth-text");
  const authIcons = document.querySelectorAll("#nav-auth-icon, #mobile-auth-icon, .auth-icon-elem");

  const signinWrapper = document.getElementById("signin-form-wrapper");
  const signupWrapper = document.getElementById("signup-form-wrapper");

  const showSignupBtn = document.getElementById("show-signup-link");
  const showSigninBtn = document.getElementById("show-signin-link");

  const signinForm = document.getElementById("signin-form");
  const signupForm = document.getElementById("signup-form");

  const signinError = document.getElementById("signin-error");
  const signupError = document.getElementById("signup-error");

  // Dropdown elements
  const dropdownCard = document.getElementById("profile-dropdown-card");
  const dropdownUsername = document.getElementById("dropdown-username");
  const dropdownEmail = document.getElementById("dropdown-email");
  const dropdownSignoutBtn = document.getElementById("dropdown-signout-btn");
  const dropdownUserAvatar = document.getElementById("dropdown-user-avatar");

  // Cart badges
  const cartBadges = document.querySelectorAll(".cart-badge");


  function getCurrentUser() {
    if (window.Auth) return window.Auth.getCurrentUser();
    const isLoggedOut = localStorage.getItem("userLoggedOut") === "true" || localStorage.getItem("isLoggedIn") === "false";
    if (isLoggedOut) return null;
    const user = localStorage.getItem("currentUser");
    if (user) {
      try {
        return JSON.parse(user);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  function renderWelcomeBackBanner() {
    const signinWrapper = document.getElementById("signin-form-wrapper");
    if (!signinWrapper) return;

    let wbCard = document.getElementById("welcome-back-card");
    const lastUserStr = localStorage.getItem("lastUser");

    if (lastUserStr && !getCurrentUser()) {
      let lastUser = {};
      try { lastUser = JSON.parse(lastUserStr); } catch (e) { }

      const avatarUrl = (lastUser.avatar && !lastUser.avatar.includes('rem_happy_evhesz.webp')) ? lastUser.avatar : "assets/default-avatar.svg";
      const displayName = lastUser.name || lastUser.username || "senpai";
      const email = lastUser.email || "suhassenpai@gmail.com";

      if (!wbCard) {
        wbCard = document.createElement("div");
        wbCard.id = "welcome-back-card";
        wbCard.style.cssText = "background: rgba(241, 245, 249, 0.95); border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);";
        const subTitle = signinWrapper.querySelector(".auth-subtitle-center, .auth-subtitle");
        if (subTitle && subTitle.nextSibling) {
          signinWrapper.insertBefore(wbCard, subTitle.nextSibling);
        } else {
          signinWrapper.appendChild(wbCard);
        }
      }
      wbCard.style.display = "flex";
      wbCard.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          <img src="${avatarUrl}" style="width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 2px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
          <div style="text-align: left;">
            <div style="font-weight: 800; font-size: 0.9rem; color: #0f172a;">Welcome back!</div>
            <div style="font-size: 0.8rem; color: #64748b;">Continue as <strong>${displayName}</strong></div>
          </div>
        </div>
        <button type="button" id="btn-continue-last-user" style="background: #18181b; color: #ffffff; border: none; padding: 8px 16px; border-radius: 20px; font-weight: 700; font-size: 0.82rem; cursor: pointer; white-space: nowrap; transition: all 0.2s;">
          Continue &rarr;
        </button>
      `;

      const continueBtn = document.getElementById("btn-continue-last-user");
      if (continueBtn) {
        continueBtn.onclick = function () {
          const lastToken = localStorage.getItem("lastUserToken");
          if (lastToken) localStorage.setItem("userToken", lastToken);
          localStorage.setItem("currentUser", JSON.stringify(lastUser));
          localStorage.removeItem("userLoggedOut");
          localStorage.setItem("isLoggedIn", "true");
          updateAuthUI();
          if (authModal) authModal.classList.remove("active");
          if (window.location.pathname.includes("profile.html")) {
            window.location.reload();
          } else {
            window.location.href = "profile.html";
          }
        };
      }
    } else if (wbCard) {
      wbCard.style.display = "none";
    }
  }

  let cachedAuthUserKey = null;

  function updateAuthUI() {
    const currentUser = getCurrentUser();
    const currentKey = currentUser ? `${currentUser.username || ''}_${currentUser.email || ''}_${currentUser.avatar || ''}` : 'logged_out';

    // Avoid clearing/re-rendering DOM elements if auth state hasn't changed
    if (currentKey === cachedAuthUserKey) return;
    cachedAuthUserKey = currentKey;

    const mobileAuthSpan = document.querySelector("#mobile-nav-auth span");

    if (currentUser) {
      const displayName = currentUser.name || currentUser.username || "Member";
      const userEmail = currentUser.email || "";
      const avatarSrc = (currentUser.avatar && !currentUser.avatar.includes('rem_happy_evhesz.webp')) ? currentUser.avatar : "assets/default-avatar.svg";

      authTexts.forEach(txt => txt.textContent = displayName);
      authBtns.forEach(btn => btn.classList.add("logged-in"));
      if (mobileAuthSpan) mobileAuthSpan.textContent = displayName;

      authIcons.forEach(icon => {
        icon.className = "header-user-avatar";
        icon.innerHTML = `<img src="${avatarSrc}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; pointer-events: none;" />`;
      });

      if (dropdownUsername) dropdownUsername.textContent = displayName;
      if (dropdownEmail) dropdownEmail.textContent = userEmail;
      if (dropdownUserAvatar) dropdownUserAvatar.src = avatarSrc;
    } else {
      authTexts.forEach(txt => txt.textContent = "Sign In");
      authBtns.forEach(btn => btn.classList.remove("logged-in"));
      if (mobileAuthSpan) mobileAuthSpan.textContent = "Account";

      authIcons.forEach(icon => {
        if (icon.id === "mobile-auth-icon") {
          icon.className = "fas fa-user auth-icon-elem";
        } else {
          icon.className = "fa-regular fa-user auth-icon-elem";
        }
        icon.textContent = "";
        icon.innerHTML = "";
      });
      if (dropdownCard) dropdownCard.classList.remove("active");
    }
  }

  function updateCartBadge() {
    const cartStr = localStorage.getItem("shoppingCart");
    const cart = cartStr ? JSON.parse(cartStr) : [];
    const totalQty = cart.reduce((sum, item) => {
      const q = typeof item.quantity === "number" ? item.quantity : parseInt(item.quantity || "1", 10);
      return sum + (isNaN(q) ? 1 : q);
    }, 0);

    const hasUnseen = localStorage.getItem("cart_has_unseen_items") === "true";
    const badges = document.querySelectorAll(".cart-badge, #cart-badge, #mobile-cart-badge");

    badges.forEach(badge => {
      if (totalQty > 0) {
        badge.textContent = totalQty.toString();
        badge.style.display = "flex";
        if (hasUnseen) {
          badge.classList.add("cart-badge-highlight");
        } else {
          badge.classList.remove("cart-badge-highlight");
        }
      } else {
        badge.style.display = "none";
        badge.classList.remove("cart-badge-highlight");
      }
    });
  }

  window.clearCartHighlight = function () {
    localStorage.setItem("cart_has_unseen_items", "false");
    updateCartBadge();
  };

  // Auto-clear highlight if user is on cart.html page
  if (window.location.pathname.toLowerCase().includes("cart.html")) {
    window.clearCartHighlight();
  }

  window.clearWishlistHighlight = function () {
    localStorage.setItem("wishlist_has_unseen_items", "false");
    updateWishlistBadge();
  };

  function updateWishlistBadge() {
    const hasUnseen = localStorage.getItem("wishlist_has_unseen_items") === "true";
    
    // Desktop and Mobile Auth Icons (Specifically targeting the avatar wrapper)
    const authIconsNode = document.querySelectorAll("#nav-auth-icon, #mobile-auth-icon");
    authIconsNode.forEach(iconNode => {
      let dot = iconNode.querySelector(".auth-wishlist-dot");
      if (!dot) {
        dot = document.createElement("span");
        dot.className = "auth-wishlist-dot";
        dot.style.cssText = "position: absolute; top: -2px; right: -4px; width: 10px; height: 10px; background: #3b82f6; border-radius: 50%; display: none; box-shadow: 0 0 0 2px var(--bg-nav, #0f172a); z-index: 999;";
        iconNode.style.position = "relative";
        iconNode.appendChild(dot);
      }
      dot.style.display = hasUnseen ? "block" : "none";
    });

    const profileSidebarDot = document.getElementById("profile-wishlist-dot");
    if (profileSidebarDot) {
      profileSidebarDot.style.background = "#3b82f6";
      profileSidebarDot.style.display = hasUnseen ? "block" : "none";
    }

    const dropdownWishlistBtn = document.getElementById("dropdown-wishlist-btn");
    if (dropdownWishlistBtn) {
      let ddDot = dropdownWishlistBtn.querySelector(".dropdown-wishlist-dot");
      if (!ddDot) {
        ddDot = document.createElement("span");
        ddDot.className = "dropdown-wishlist-dot";
        ddDot.style.cssText = "position: absolute; top: 50%; right: 16px; transform: translateY(-50%); width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; display: none;";
        dropdownWishlistBtn.style.position = "relative";
        dropdownWishlistBtn.appendChild(ddDot);
      }
      ddDot.style.display = hasUnseen ? "block" : "none";
    }
  }

  window.addEventListener("wishlistUpdated", updateWishlistBadge);
  updateWishlistBadge(); // Call initially on load

  // Waiting Cart Notification Prompt Handler
  function checkAndShowWaitingCartPrompt() {
    const pagePath = window.location.pathname.toLowerCase();
    if (pagePath.includes("cart.html") || pagePath.includes("checkout.html")) return;
    if (sessionStorage.getItem("cart_waiting_prompt_shown") === "true") return;

    const cartStr = localStorage.getItem("shoppingCart");
    const cart = cartStr ? JSON.parse(cartStr) : [];
    if (cart.length === 0) return;

    const totalQty = cart.reduce((sum, item) => {
      const q = typeof item.quantity === "number" ? item.quantity : parseInt(item.quantity || "1", 10);
      return sum + (isNaN(q) ? 1 : q);
    }, 0);

    let promptEl = document.getElementById("cart-waiting-notification-banner");
    if (!promptEl) {
      promptEl = document.createElement("div");
      promptEl.id = "cart-waiting-notification-banner";
      document.body.appendChild(promptEl);
    }

    promptEl.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(4px); z-index: 100000; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-radius: 16px;">
        <div style="background: #ffffff; color: #0f172a; padding: 24px; border-radius: 16px; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.25); max-width: 440px; width: 100%; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 14px; font-family: 'Plus Jakarta Sans', sans-serif; text-align: left;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
            <div style="font-weight: 800; font-size: 1.05rem; display: flex; align-items: center; gap: 8px; color: #0f172a;">
              <i class="fa-solid fa-cart-shopping" style="color: #0284c7;"></i> Items waiting in your cart
            </div>
            <button onclick="window.dismissCartWaitingPrompt()" style="background: none; border: none; color: #64748b; font-size: 1.2rem; cursor: pointer; padding: 0; line-height: 1;">&times;</button>
          </div>

          <div style="font-size: 0.9rem; color: #475569; line-height: 1.5;">
            You have <strong style="color: #0f172a;">${totalQty} ${totalQty === 1 ? 'item' : 'items'}</strong> waiting in your cart. Would you like to proceed to checkout?
          </div>

          <div style="display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin-top: 6px; border-top: 1px solid #f1f5f9; padding-top: 14px;">
            <button onclick="window.dismissCartWaitingPrompt()" style="background: #ffffff; color: #0f172a; border: 1.5px solid #cbd5e1; padding: 8px 20px; border-radius: 20px; font-weight: 700; font-size: 0.88rem; cursor: pointer; transition: all 0.2s ease;">
              Cancel
            </button>
            <button onclick="window.proceedToCheckoutFromPrompt()" style="background: #0f172a; color: #ffffff; border: none; padding: 8px 22px; border-radius: 20px; font-weight: 800; font-size: 0.88rem; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.25);">
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    `;
  }

  window.dismissCartWaitingPrompt = function () {
    sessionStorage.setItem("cart_waiting_prompt_shown", "true");
    const promptEl = document.getElementById("cart-waiting-notification-banner");
    if (promptEl) promptEl.remove();
  };

  window.proceedToCheckoutFromPrompt = function () {
    window.dismissCartWaitingPrompt();
    window.location.href = "checkout.html";
  };

  updateAuthUI();
  updateCartBadge();
  setTimeout(checkAndShowWaitingCartPrompt, 800);

  // Polling & listeners for instant auth UI & cart badge sync across all user actions
  setInterval(() => {
    updateAuthUI();
    updateCartBadge();
  }, 400);
  window.updateCartBadge = updateCartBadge;
  window.updateAuthUI = updateAuthUI;
  window.addEventListener("cartUpdated", () => {
    updateCartBadge();
  });
  window.addEventListener("profileUpdated", () => {
    updateAuthUI();
    checkAndShowWaitingCartPrompt();
  });
  window.addEventListener("storage", () => {
    updateAuthUI();
    updateCartBadge();
  });

  // Global addToCart helper available across all pages
  window.addToCart = function (item) {
    if (!item || (!item.name && !item.id)) return;

    let cart = localStorage.getItem("shoppingCart");
    cart = cart ? JSON.parse(cart) : [];

    const itemQty = typeof item.quantity === "number" ? item.quantity : parseInt(item.quantity || "1", 10);
    const qtyToAdd = isNaN(itemQty) ? 1 : itemQty;
    const itemVariant = item.variant || "Standard Edition";

    const existing = cart.find(c => (c.id === item.id || (c.name && c.name.toLowerCase() === item.name.toLowerCase())) && (c.variant === itemVariant));
    if (existing) {
      const curQty = typeof existing.quantity === "number" ? existing.quantity : parseInt(existing.quantity || "1", 10);
      existing.quantity = (isNaN(curQty) ? 1 : curQty) + qtyToAdd;
      if (item.variant) existing.variant = item.variant;
    } else {
      cart.push({
        id: item.id || ("ITEM-" + Date.now()),
        name: item.name || "SenpaiWorks Product",
        price: item.price || 0,
        img: item.img || "https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/avatars/rem_happy_evhesz.webp",
        type: item.type || "physical",
        quantity: qtyToAdd,
        variant: item.variant || "Standard Edition"
      });
    }

    localStorage.setItem("shoppingCart", JSON.stringify(cart));
    if (window.Auth && window.Auth.syncUserCart) {
      window.Auth.syncUserCart(cart);
    }
    localStorage.setItem("cart_has_unseen_items", "true");
    updateCartBadge();
    window.dispatchEvent(new Event("cartUpdated"));
  };

  // Listen for clicks on cart triggers & profile button
  document.addEventListener("click", (e) => {
    const cartTrigger = e.target.closest("#header-cart-btn, .cart-nav-link, #mobile-cart-btn, [href='cart.html']");
    if (cartTrigger) {
      window.clearCartHighlight();
    }

    const authBtn = e.target.closest("#nav-auth-btn, #mobile-nav-auth");
    if (authBtn) {
      e.preventDefault();
      e.stopPropagation();

      const currentUser = getCurrentUser();
      const dropCardElem = document.getElementById("profile-dropdown-card");
      const isMobileNav = authBtn.id === "mobile-nav-auth" || authBtn.closest("#mobile-bottom-nav");

      if (currentUser) {
        if (isMobileNav) {
          window.location.href = "profile.html";
        } else if (dropCardElem) {
          dropCardElem.classList.toggle("active");
        } else {
          window.location.href = "profile.html";
        }
      } else {
        if (dropCardElem) dropCardElem.classList.remove("active");
        window.location.href = "login.html";
      }
      return;
    }

    // Close dropdown on click outside
    const dropCardElem = document.getElementById("profile-dropdown-card");
    if (dropCardElem && dropCardElem.classList.contains("active")) {
      const isClickInsideCard = dropCardElem.contains(e.target);
      const isClickOnAuthBtn = e.target.closest("#nav-auth-btn, #mobile-nav-auth");
      if (!isClickInsideCard && !isClickOnAuthBtn) {
        dropCardElem.classList.remove("active");
      }
    }
  });

  // Profile Dropdown Menu item click handler (Profile, Orders, Feedback, Notifications)
  document.addEventListener("click", (e) => {
    const item = e.target.closest(".profile-dropdown-card .dropdown-item");
    if (!item) return;

    const dropCardElem = document.getElementById("profile-dropdown-card");
    if (dropCardElem) dropCardElem.classList.remove("active");

    const href = item.getAttribute("href");
    if (href) {
      const parts = href.split("#");
      const hash = parts[1];
      const currentPath = window.location.pathname.split("/").pop().toLowerCase();

      if (currentPath === "profile.html") {
        if (hash) {
          e.preventDefault();
          window.location.hash = `#${hash}`;
          if (typeof window.switchAccountTab === "function") {
            window.switchAccountTab(hash);
          }
        }
      }
    }
  });

  const signoutModal = document.getElementById("signout-modal");
  const signoutCancelBtn = document.getElementById("signout-cancel-btn");
  const signoutConfirmBtn = document.getElementById("signout-confirm-btn");

  function performLogout() {
    if (window.Auth) {
      window.Auth.logout("home.html");
    } else {
      const cur = getCurrentUser();
      if (cur) {
        localStorage.setItem("lastUser", JSON.stringify(cur));
      }
      localStorage.removeItem("currentUser");
      localStorage.setItem("userLoggedOut", "true");
      localStorage.setItem("isLoggedIn", "false");
      sessionStorage.clear();
      updateAuthUI();
      if (dropdownCard) dropdownCard.classList.remove("active");
      window.location.href = "home.html";
    }
  }

  if (dropdownSignoutBtn) {
    dropdownSignoutBtn.addEventListener("click", () => {
      if (dropdownCard) dropdownCard.classList.remove("active");
      const modal = document.getElementById("signout-modal");
      if (modal) {
        modal.classList.add("active");
      } else {
        performLogout();
      }
    });
  }

  if (signoutCancelBtn && signoutModal) {
    signoutCancelBtn.addEventListener("click", () => {
      signoutModal.classList.remove("active");
    });
  }

  if (signoutConfirmBtn) {
    signoutConfirmBtn.addEventListener("click", () => {
      performLogout();
    });
  }

  // Close auth modal handlers
  const authCloseBtnElem = document.getElementById("auth-close-btn");
  if (authCloseBtnElem && authModal) {
    authCloseBtnElem.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      authModal.classList.remove("active");
    });
  }

  if (authModal) {
    authModal.addEventListener("click", (e) => {
      if (e.target === authModal) {
        authModal.classList.remove("active");
      }
    });
  }

  // Password Visibility Toggle Handlers
  const toggleSigninPass = document.getElementById("toggle-signin-pass");
  const toggleSignupPass = document.getElementById("toggle-signup-pass");

  if (toggleSigninPass) {
    toggleSigninPass.addEventListener("click", () => {
      const passInput = document.getElementById("signin-password");
      if (passInput) {
        const isPass = passInput.type === "password";
        passInput.type = isPass ? "text" : "password";
        toggleSigninPass.innerHTML = isPass ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
      }
    });
  }

  if (toggleSignupPass) {
    toggleSignupPass.addEventListener("click", () => {
      const passInput = document.getElementById("signup-password");
      if (passInput) {
        const isPass = passInput.type === "password";
        passInput.type = isPass ? "text" : "password";
        toggleSignupPass.innerHTML = isPass ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
      }
    });
  }

  const btnGoogleSignup = document.getElementById("btn-google-signup");
  const btnFbSignup = document.getElementById("btn-fb-signup");
  const googleBtn = document.getElementById("btn-google-login");
  const fbBtn = document.getElementById("btn-fb-login");

  if (btnGoogleSignup && googleBtn) {
    btnGoogleSignup.addEventListener("click", () => googleBtn.click());
  }

  if (btnFbSignup && fbBtn) {
    btnFbSignup.addEventListener("click", () => fbBtn.click());
  }

  const otpWrapper = document.getElementById("otp-form-wrapper");
  const forgotWrapper = document.getElementById("forgot-form-wrapper");
  const forgotLink = document.getElementById("forgot-password-link");
  const otpBackSignup = document.getElementById("otp-back-signup-link");
  const forgotBackSignin = document.getElementById("forgot-back-signin-link");

  function switchAuthView(viewName) {
    if (signinWrapper) signinWrapper.style.display = viewName === "signin" ? "block" : "none";
    if (signupWrapper) signupWrapper.style.display = viewName === "signup" ? "block" : "none";
    if (otpWrapper) otpWrapper.style.display = viewName === "otp" ? "block" : "none";
    if (forgotWrapper) forgotWrapper.style.display = viewName === "forgot" ? "block" : "none";

    const msgs = document.querySelectorAll(".auth-error-msg, .auth-success-msg");
    msgs.forEach(m => { m.style.display = "none"; m.textContent = ""; });
  }

  if (showSignupBtn) {
    showSignupBtn.addEventListener("click", (e) => {
      e.preventDefault();
      switchAuthView("signup");
    });
  }

  if (showSigninBtn) {
    showSigninBtn.addEventListener("click", (e) => {
      e.preventDefault();
      switchAuthView("signin");
    });
  }

  if (forgotLink) {
    forgotLink.addEventListener("click", (e) => {
      e.preventDefault();
      switchAuthView("forgot");
      const fStep1 = document.getElementById("forgot-step-1");
      const fStep2 = document.getElementById("forgot-step-2");
      if (fStep1) fStep1.style.display = "block";
      if (fStep2) fStep2.style.display = "none";
    });
  }

  if (otpBackSignup) {
    otpBackSignup.addEventListener("click", (e) => {
      e.preventDefault();
      switchAuthView("signup");
    });
  }

  if (forgotBackSignin) {
    forgotBackSignin.addEventListener("click", (e) => {
      e.preventDefault();
      switchAuthView("signin");
    });
  }

  let otpTimerInterval = null;
  let pendingOtpEmail = "";

  function startOtpCountdown(seconds = 60) {
    if (otpTimerInterval) clearInterval(otpTimerInterval);
    const countdownText = document.getElementById("otp-countdown-text");
    const secondsSpan = document.getElementById("otp-seconds");
    const resendBtn = document.getElementById("btn-resend-otp");

    if (countdownText) countdownText.style.display = "inline";
    if (resendBtn) resendBtn.style.display = "none";
    if (secondsSpan) secondsSpan.textContent = seconds;

    let remaining = seconds;
    otpTimerInterval = setInterval(() => {
      remaining--;
      if (secondsSpan) secondsSpan.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(otpTimerInterval);
        if (countdownText) countdownText.style.display = "none";
        if (resendBtn) resendBtn.style.display = "inline-block";
      }
    }, 1000);
  }

  // 6-digit OTP Input Behavior
  const otpInputs = document.querySelectorAll(".otp-digit-input");
  otpInputs.forEach((input, index) => {
    input.addEventListener("input", (e) => {
      const val = e.target.value;
      if (val && !/^[0-9]$/.test(val)) {
        e.target.value = "";
        return;
      }
      if (val && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !e.target.value && index > 0) {
        otpInputs[index - 1].focus();
      }
    });

    input.addEventListener("paste", (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData("text").trim();
      if (/^\d{6}$/.test(pasted)) {
        pasted.split("").forEach((char, idx) => {
          if (otpInputs[idx]) otpInputs[idx].value = char;
        });
        if (otpInputs[5]) otpInputs[5].focus();
      }
    });
  });

  async function loginUserAndRedirect(userData, token = null, skipFetch = false, deviceToken = null) {
    if (token) {
      localStorage.setItem("userToken", token);
      localStorage.setItem("lastUserToken", token);
    }
    if (deviceToken) {
      localStorage.setItem("senpai_device_token", deviceToken);
    }
    
    // Save to local storage for immediate UI access
    if (window.Auth && window.Auth.saveUserProfile) {
      window.Auth.saveUserProfile(userData);
    } else {
      localStorage.setItem("currentUser", JSON.stringify(userData));
      localStorage.setItem("lastUser", JSON.stringify(userData));
      localStorage.removeItem("userLoggedOut");
      localStorage.setItem("isLoggedIn", "true");
    }

    if (userData && userData.email) {
      const userKey = `userCart_${userData.email.toLowerCase()}`;
      const savedCartRaw = localStorage.getItem(userKey);
      if (savedCartRaw !== null) {
        localStorage.setItem("shoppingCart", savedCartRaw);
      }
    }

    if (!skipFetch && !token) {
      // Sync user record to SQLite database backend
      try {
        const res = await fetch("/api/auth/oauth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify({
            email: userData.email,
            username: userData.username,
            name: userData.name || userData.username,
            avatar: userData.avatar,
            provider: userData.provider || "local",
            providerId: userData.providerId || null
          })
        });
        const data = await res.json();
        if (data.success && data.token) {
          localStorage.setItem("userToken", data.token);
          localStorage.setItem("lastUserToken", data.token);
        }
      } catch (err) {
        console.warn("Backend database sync offline, logged in locally:", err);
      }
    }

    updateAuthUI();
    updateCartBadge();
    if (authModal) authModal.classList.remove("active");
    if (window.location.pathname.includes("profile.html")) {
      window.location.reload();
    } else {
      window.location.href = "profile.html";
    }
  }

  // Google OAuth Login
  if (googleBtn) {
    googleBtn.addEventListener("click", () => {
      if (window.Auth && window.Auth.triggerGoogleLogin) {
        window.Auth.triggerGoogleLogin((userData, token) => {
          loginUserAndRedirect(userData, token, true);
        });
      }
    });
  }

  // Facebook OAuth Login
  if (fbBtn) {
    fbBtn.addEventListener("click", () => {
      if (window.Auth && window.Auth.triggerFacebookLogin) {
        window.Auth.triggerFacebookLogin((userData, token) => {
          loginUserAndRedirect(userData, token, true);
        });
      }
    });
  }

  // Customer Sign In
  if (signinForm) {
    signinForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const loginVal = document.getElementById("signin-email").value.trim();
      const passwordVal = document.getElementById("signin-password").value;
      const deviceToken = localStorage.getItem("senpai_device_token") || null;

      if (signinError) signinError.style.display = "none";
      const submitBtn = signinForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerText : "Get Started";
      if (submitBtn) submitBtn.innerText = "Signing in...";

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: loginVal, username: loginVal, password: passwordVal, deviceToken })
        });
        const data = await res.json();
        
        if (data.requireOtp) {
          // Unverified email or unrecognized device -> Switch to OTP view
          pendingOtpEmail = data.email || loginVal;
          const targetEmailEl = document.getElementById("otp-target-email");
          if (targetEmailEl) targetEmailEl.textContent = pendingOtpEmail;
          switchAuthView("otp");
          startOtpCountdown(60);
          otpInputs.forEach(i => { i.value = ""; });
          if (otpInputs[0]) otpInputs[0].focus();
        } else if (res.ok && data.success && data.token && data.user) {
          signinForm.reset();
          loginUserAndRedirect(data.user, data.token, true, data.deviceToken);
        } else {
          if (signinError) {
            signinError.textContent = data.error || "Invalid credentials.";
            signinError.style.display = "block";
          }
        }
      } catch (err) {
        if (signinError) {
          signinError.textContent = "Server error. Please try again.";
          signinError.style.display = "block";
        }
      } finally {
        if (submitBtn) submitBtn.innerText = originalText;
      }
    });
  }

  // Customer Sign Up (Generates OTP and opens OTP verification modal)
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const usernameVal = document.getElementById("signup-username").value.trim();
      const emailVal = document.getElementById("signup-email").value.trim();
      const passwordVal = document.getElementById("signup-password").value;

      if (signupError) signupError.style.display = "none";

      const isStrongPass = passwordVal.length >= 8 &&
        /[A-Z]/.test(passwordVal) &&
        /[a-z]/.test(passwordVal) &&
        /[0-9]/.test(passwordVal) &&
        /[^A-Za-z0-9]/.test(passwordVal);

      if (!isStrongPass) {
        if (signupError) {
          signupError.textContent = "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.";
          signupError.style.display = "block";
        }
        return;
      }

      const submitBtn = signupForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerText : "Get Started";
      if (submitBtn) submitBtn.innerText = "Creating account...";

      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: emailVal, username: usernameVal, password: passwordVal })
        });
        const data = await res.json();
        
        if (data.requireOtp || (res.ok && data.success && !data.token)) {
          // Gated signup -> Switch to OTP view
          pendingOtpEmail = data.email || emailVal;
          const targetEmailEl = document.getElementById("otp-target-email");
          if (targetEmailEl) targetEmailEl.textContent = pendingOtpEmail;
          
          switchAuthView("otp");
          startOtpCountdown(60);
          otpInputs.forEach(i => { i.value = ""; });
          if (otpInputs[0]) otpInputs[0].focus();
        } else if (res.ok && data.success && data.token && data.user) {
          signupForm.reset();
          loginUserAndRedirect(data.user, data.token, true, data.deviceToken);
        } else {
          if (signupError) {
            signupError.textContent = data.error || "Signup failed.";
            signupError.style.display = "block";
          }
        }
      } catch (err) {
        if (signupError) {
          signupError.textContent = "Server error. Please try again.";
          signupError.style.display = "block";
        }
      } finally {
        if (submitBtn) submitBtn.innerText = originalText;
      }
    });
  }

  // OTP Form Submission
  const otpForm = document.getElementById("otp-form");
  const otpError = document.getElementById("otp-error");
  const otpSuccess = document.getElementById("otp-success");
  const btnResendOtp = document.getElementById("btn-resend-otp");

  if (otpForm) {
    otpForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const digits = Array.from(otpInputs).map(i => i.value.trim()).join("");
      if (digits.length !== 6) {
        if (otpError) {
          otpError.textContent = "Please enter the complete 6-digit verification code.";
          otpError.style.display = "block";
        }
        return;
      }

      const verifyBtn = document.getElementById("btn-verify-otp");
      const originalText = verifyBtn ? verifyBtn.innerText : "Verify & Continue";
      if (verifyBtn) verifyBtn.innerText = "Verifying...";
      if (otpError) otpError.style.display = "none";

      try {
        const res = await fetch('/api/auth/verify-signup-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: pendingOtpEmail, otp: digits })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          if (otpSuccess) {
            otpSuccess.textContent = "✓ Email verified successfully! Redirecting...";
            otpSuccess.style.display = "block";
          }
          setTimeout(() => {
            loginUserAndRedirect(data.user, data.token, true, data.deviceToken);
          }, 800);
        } else {
          if (otpError) {
            otpError.textContent = data.error || "Invalid verification code.";
            otpError.style.display = "block";
          }
        }
      } catch (err) {
        if (otpError) {
          otpError.textContent = "Server error. Please try again.";
          otpError.style.display = "block";
        }
      } finally {
        if (verifyBtn) verifyBtn.innerText = originalText;
      }
    });
  }

  // Resend OTP Button
  if (btnResendOtp) {
    btnResendOtp.addEventListener("click", async () => {
      if (!pendingOtpEmail) return;
      btnResendOtp.innerText = "Sending...";

      try {
        const res = await fetch('/api/auth/resend-signup-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: pendingOtpEmail })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          startOtpCountdown(60);
          if (otpSuccess) {
            otpSuccess.textContent = `A new 6-digit code was sent to ${pendingOtpEmail}`;
            otpSuccess.style.display = "block";
            setTimeout(() => { if (otpSuccess) otpSuccess.style.display = "none"; }, 5000);
          }
        } else {
          if (otpError) {
            otpError.textContent = data.error || "Failed to resend code.";
            otpError.style.display = "block";
          }
        }
      } catch (err) {
        if (otpError) {
          otpError.textContent = "Server error. Please try again.";
          otpError.style.display = "block";
        }
      } finally {
        btnResendOtp.innerText = "Resend Code";
      }
    });
  }

  // Forgot Password: Step 1 (Request Code)
  const forgotReqForm = document.getElementById("forgot-request-form");
  const forgotError = document.getElementById("forgot-error");
  const forgotSuccess = document.getElementById("forgot-success");
  const forgotOtpForm = document.getElementById("forgot-otp-form");
  const forgotStep2Error = document.getElementById("forgot-step2-error");
  const forgotResetForm = document.getElementById("forgot-reset-form");
  const resetError = document.getElementById("reset-error");
  const resetSuccess = document.getElementById("reset-success");

  let pendingResetEmail = "";
  let pendingResetOtp = "";

  if (forgotReqForm) {
    forgotReqForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById("forgot-email").value.trim();
      const sendBtn = document.getElementById("btn-forgot-send");
      const origText = sendBtn ? sendBtn.innerText : "Send Reset Code";
      if (sendBtn) sendBtn.innerText = "Sending code...";
      if (forgotError) forgotError.style.display = "none";

      try {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailInput })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          pendingResetEmail = emailInput;
          const fStep1 = document.getElementById("forgot-step-1");
          const fStep2 = document.getElementById("forgot-step-2");
          const fStep3 = document.getElementById("forgot-step-3");
          if (fStep1) fStep1.style.display = "none";
          if (fStep3) fStep3.style.display = "none";
          if (fStep2) fStep2.style.display = "block";
          const targetEl = document.getElementById("forgot-target-email");
          if (targetEl) targetEl.textContent = emailInput;
          const otpInput = document.getElementById("reset-otp-code");
          if (otpInput) {
            otpInput.value = "";
            otpInput.focus();
          }
        } else {
          if (forgotError) {
            forgotError.textContent = data.error || "Failed to process request.";
            forgotError.style.display = "block";
          }
        }
      } catch (err) {
        if (forgotError) {
          forgotError.textContent = "Server error. Please try again.";
          forgotError.style.display = "block";
        }
      } finally {
        if (sendBtn) sendBtn.innerText = origText;
      }
    });
  }

  // Forgot Password: Step 2 (Verify OTP Code)
  if (forgotOtpForm) {
    forgotOtpForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const otpVal = document.getElementById("reset-otp-code").value.trim();
      const verifyBtn = document.getElementById("btn-verify-reset-otp");
      const origText = verifyBtn ? verifyBtn.innerText : "Verify Code & Continue";
      if (verifyBtn) verifyBtn.innerText = "Verifying code...";
      if (forgotStep2Error) forgotStep2Error.style.display = "none";

      if (otpVal.length !== 6) {
        if (forgotStep2Error) {
          forgotStep2Error.textContent = "Please enter the complete 6-digit code.";
          forgotStep2Error.style.display = "block";
        }
        if (verifyBtn) verifyBtn.innerText = origText;
        return;
      }

      try {
        const res = await fetch('/api/auth/verify-reset-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: pendingResetEmail, otp: otpVal })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          pendingResetOtp = otpVal;
          const fStep2 = document.getElementById("forgot-step-2");
          const fStep3 = document.getElementById("forgot-step-3");
          if (fStep2) fStep2.style.display = "none";
          if (fStep3) fStep3.style.display = "block";
          const newPassInput = document.getElementById("reset-new-password");
          if (newPassInput) {
            newPassInput.value = "";
            newPassInput.focus();
          }
          const confirmPassInput = document.getElementById("reset-confirm-password");
          if (confirmPassInput) confirmPassInput.value = "";
        } else {
          if (forgotStep2Error) {
            forgotStep2Error.textContent = data.error || "Invalid or expired code.";
            forgotStep2Error.style.display = "block";
          }
        }
      } catch (err) {
        if (forgotStep2Error) {
          forgotStep2Error.textContent = "Server error. Please try again.";
          forgotStep2Error.style.display = "block";
        }
      } finally {
        if (verifyBtn) verifyBtn.innerText = origText;
      }
    });
  }

  // Forgot Password: Step 3 (Set New Password + Confirm Password)
  if (forgotResetForm) {
    forgotResetForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newPassVal = document.getElementById("reset-new-password").value.trim();
      const confirmPassVal = document.getElementById("reset-confirm-password").value.trim();
      const resetBtn = document.getElementById("btn-submit-reset");
      const origText = resetBtn ? resetBtn.innerText : "Update Password & Sign In";
      if (resetBtn) resetBtn.innerText = "Updating password...";
      if (resetError) resetError.style.display = "none";

      const isStrongPass = newPassVal.length >= 8 &&
        /[A-Z]/.test(newPassVal) &&
        /[a-z]/.test(newPassVal) &&
        /[0-9]/.test(newPassVal) &&
        /[^A-Za-z0-9]/.test(newPassVal);

      if (!isStrongPass) {
        if (resetError) {
          resetError.textContent = "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.";
          resetError.style.display = "block";
        }
        if (resetBtn) resetBtn.innerText = origText;
        return;
      }

      if (newPassVal !== confirmPassVal) {
        if (resetError) {
          resetError.textContent = "Passwords do not match. Please re-enter identical passwords.";
          resetError.style.display = "block";
        }
        if (resetBtn) resetBtn.innerText = origText;
        return;
      }

      try {
        const deviceToken = localStorage.getItem("senpai_device_token") || null;
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: pendingResetEmail, otp: pendingResetOtp, newPassword: newPassVal, deviceToken })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          if (data.deviceToken) {
            localStorage.setItem("senpai_device_token", data.deviceToken);
          }
          if (resetSuccess) {
            resetSuccess.textContent = "✓ Password reset successfully! Switching to sign in...";
            resetSuccess.style.display = "block";
          }
          setTimeout(() => {
            switchAuthView("signin");
            if (signinError) {
              signinError.textContent = "Password reset successful. Please sign in with your new password.";
              signinError.className = "auth-success-msg";
              signinError.style.display = "block";
            }
          }, 1200);
        } else {
          if (resetError) {
            resetError.textContent = data.error || "Failed to reset password.";
            resetError.style.display = "block";
          }
        }
      } catch (err) {
        if (resetError) {
          resetError.textContent = "Server error. Please try again.";
          resetError.style.display = "block";
        }
      } finally {
        if (resetBtn) resetBtn.innerText = origText;
      }
    });
  }
}

window.togglePasswordVisibility = function (inputId, btnEl) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPassword = input.type === "password";
  input.type = isPassword ? "text" : "password";
  if (btnEl) {
    btnEl.innerHTML = isPassword ? '<i class="fa-regular fa-eye"></i>' : '<i class="fa-regular fa-eye-slash"></i>';
  }
};

// ── TOP SCROLL PROGRESS INDICATOR BAR ──────────────────────────────────────
(function initGlobalScrollProgressBar() {
  function createOrGetBar() {
    let progressBar = document.getElementById("global-scroll-progress-bar");
    if (!progressBar && document.body) {
      progressBar = document.createElement("div");
      progressBar.id = "global-scroll-progress-bar";
      progressBar.className = "global-scroll-progress-bar";
      document.body.insertBefore(progressBar, document.body.firstChild);
    }
    return progressBar;
  }

  function updateScrollProgress() {
    const progressBar = createOrGetBar();
    if (!progressBar) return;

    const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
    const clientHeight = document.documentElement.clientHeight || window.innerHeight;
    const height = scrollHeight - clientHeight;
    const scrolled = height > 0 ? (winScroll / height) * 100 : 0;

    progressBar.style.width = Math.min(100, Math.max(0, scrolled)) + "%";
  }

  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  window.addEventListener("resize", updateScrollProgress, { passive: true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", updateScrollProgress);
  } else {
    updateScrollProgress();
  }
})();

// ── NOTIFICATIONS SYSTEM (Global Header UI) ───────────────────────────────
(function initNotificationsSystem() {
  function getCurrentUserEmail() {
    let currentUserStr = localStorage.getItem("currentUser");
    if (!currentUserStr) return null;
    try {
      const user = JSON.parse(currentUserStr);
      return user.email;
    } catch (e) {
      return null;
    }
  }

  function formatTimeAgo(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "just now";
  }

  window.renderNotificationRowHTML = function(n, isDropdown = false) {
    const bg = n.isRead ? "transparent" : "rgba(59, 130, 246, 0.03)";
    const dotColor = "#3b82f6"; // SenpaiWorks blue for unread

    let iconHtml = '';
    const isCommunity = n.type && (n.type.includes('post') || n.type.includes('support'));

    if (isCommunity && n.actorAvatar) {
      // Community notification with a real user's avatar
      iconHtml = `<img src="${n.actorAvatar}" alt="User Avatar" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 1px solid #e2e8f0;">`;
    } else {
      // Generic system notification (Orders, Store, News, etc) or missing avatar
      // Using the SenpaiWorks logo as a consistent brand avatar
      iconHtml = `<div style="width: 40px; height: 40px; border-radius: 50%; background: #000000; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid #e2e8f0; overflow: hidden;">
                    <img src="assets/SenpaiWorks%20logo.png" alt="SenpaiWorks" style="width: 24px; height: 24px; object-fit: contain;">
                  </div>`;
    }

    const lineClamp = isDropdown ? 1 : 2;

    let html = `
      <div class="${isDropdown ? 'dropdown-notif-item' : 'notification-row'}" 
           ${isDropdown ? `data-id="${n.id}" data-link="${n.link || '#'}"` : ''}
           style="display: flex; align-items: flex-start; padding: ${isDropdown ? '14px 20px' : '16px'}; border-bottom: 1px solid #e2e8f0; background: ${bg}; cursor: pointer; transition: all 0.2s; position: relative;" 
           ${!isDropdown ? `onclick="window.openNotificationPreview(window.notificationDataStore[${n.id}])"` : ''}>
    `;

    if (!isDropdown) {
      html += `
        <div class="notif-checkbox-container" style="display: flex; align-items: center; justify-content: center; transition: all 0.2s; overflow: hidden; flex-shrink: 0; align-self: center;" onclick="event.stopPropagation()">
          <input type="checkbox" class="notif-checkbox" value="${n.id}" style="width: 16px; height: 16px; cursor: pointer;">
        </div>
      `;
    }
    
    // Add margin-right back for all items, since we no longer wrap the avatar in the swap container
    html += `<div class="notif-avatar" style="margin-right: 12px; transition: all 0.2s; flex-shrink: 0;">${iconHtml}</div>`;

    const timeDisplay = isDropdown ? formatTimeAgo(n.createdAt) : new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const titleWeight = n.isRead ? '600' : '700';
    const titleColor = n.isRead ? '#475569' : '#0f172a';
    
    const titleFontSize = isDropdown ? '0.85rem' : '0.95rem';
    const msgFontSize = isDropdown ? '0.75rem' : '0.85rem';
    
    function escapeNotifHtml(str) {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    const safeTitle = escapeNotifHtml(n.title);
    const safeMsg = escapeNotifHtml(n.message);
    const safeCat = escapeNotifHtml(n.category || 'System');

    // Add category badge
    const catBadge = isDropdown ? `<span style="font-size: 0.65rem; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; color: #475569; margin-left: 8px;">${safeCat}</span>` : '';

    html += `
        <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; width: 100%;">
            <span style="font-size: ${titleFontSize}; font-weight: ${titleWeight}; color: ${titleColor}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; flex: 1; min-width: 0;">
              <span style="overflow: hidden; text-overflow: ellipsis;">${safeTitle}</span>
              ${catBadge}
            </span>
            <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0; position: relative;">
               <span class="notif-row-timestamp" style="font-size: 0.8rem; color: #94a3b8; font-weight: 500; white-space: nowrap;">${timeDisplay}</span>
               ${!isDropdown ? `
                 <div class="btn-hover-delete" style="display: none; align-items: center; gap: 4px; position: absolute; right: 0; top: 50%; transform: translateY(-50%);">
                   <button onclick="event.stopPropagation(); window.markSingleNotificationRead(${n.id})" style="background:none; border:none; color:#64748b; font-size: 1rem; cursor: pointer; padding: 4px;" title="Mark as Read">
                     <i class="fa-regular fa-circle-check"></i>
                   </button>
                   <button onclick="event.stopPropagation(); window.deleteSingleNotification(${n.id})" style="background:none; border:none; color:#ef4444; font-size: 1rem; cursor: pointer; padding: 4px;" title="Delete">
                     <i class="fa-regular fa-trash-can"></i>
                   </button>
                 </div>
               ` : ''}
            </div>
          </div>
          <span style="font-size: ${msgFontSize}; color: #64748b; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: ${lineClamp}; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">${safeMsg}</span>
        </div>
    `;
    html += `</div>`;
    return html;
  };

  async function fetchUnreadCount() {
    // Respect muted setting
    if (localStorage.getItem('notif-muted') === 'true') {
      const badges = [
        document.getElementById("notifications-badge"),
        document.getElementById("nav-notif-count")
      ];
      badges.forEach(b => { if (b) b.style.display = "none"; });
      return;
    }

    const email = getCurrentUserEmail();
    if (!email) {
      // Retry once after a short delay — auth might not be ready yet
      setTimeout(fetchUnreadCount, 2000);
      return;
    }

    try {
      const res = await fetch(`/api/notifications/unread-count?t=${new Date().getTime()}`, {
        headers: { "Authorization": "Bearer " + localStorage.getItem("userToken"), "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })() }
      });
      if (res.status === 401) {
        // Token invalid or missing, clear the badge
        const badges = [
          document.getElementById("notifications-badge"),
          document.getElementById("nav-notif-count")
        ];
        badges.forEach(b => { if (b) b.style.display = "none"; });
        return;
      }
      const data = await res.json();
      const count = data.unreadCount || 0;

      if (data.countsByCategory) {
        document.querySelectorAll('.header-notif-tab-btn').forEach(btn => {
          const cat = btn.getAttribute('data-category');
          const badge = btn.querySelector('.header-notif-badge');
          if (badge) {
            const catCount = data.countsByCategory[cat] || 0;
            if (catCount > 0) {
              badge.textContent = ` (${catCount})`;
              badge.style.display = 'inline';
            } else {
              badge.style.display = 'none';
            }
          }
        });

        // Also update profile page tabs if they exist
        document.querySelectorAll('.notif-tab-btn').forEach(btn => {
          const cat = btn.getAttribute('data-category');
          const badge = btn.querySelector('.notif-badge');
          if (badge) {
            const catCount = data.countsByCategory[cat] || 0;
            if (catCount > 0) {
              badge.textContent = ` (${catCount})`;
              badge.style.display = 'inline';
            } else {
              badge.style.display = 'none';
            }
          }
        });
      }

      const badges = [
        document.getElementById("notifications-badge"),
        document.getElementById("nav-notif-count") // Profile page
      ];

      badges.forEach(b => {
        if (!b) return;
        if (count > 0) {
          b.style.display = "inline-flex";
          b.innerText = count > 9 ? "9+" : count;
        } else {
          b.style.display = "none";
          b.innerText = "0";
        }
      });
    } catch (err) {
      console.error("Failed to fetch unread notifications count:", err);
    }
  }

  // Expose globally so setupHeader can call it immediately when header HTML loads
  window.fetchUnreadCount = fetchUnreadCount;

  let headerNotifsCategory = 'All';

  async function loadDropdownNotifications() {
    const listContainer = document.getElementById("notifications-dropdown-list");
    if (!listContainer) return;
    const email = getCurrentUserEmail();
    if (!email) return;

    listContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</div>';

    try {
      const res = await fetch(`/api/notifications?page=1&limit=4&category=${encodeURIComponent(headerNotifsCategory)}`, {
        headers: { "Authorization": "Bearer " + localStorage.getItem("userToken"), "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })() }
      });
      
      if (res.status === 401) {
        listContainer.innerHTML = `
          <div style="padding: 20px; text-align: center; color: #ef4444; font-size: 0.9rem;">
            <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; margin-bottom: 10px; display: block; color: #ef4444;"></i>
            Session expired. Please sign out and sign back in to view notifications.
          </div>
        `;
        return;
      }

      const data = await res.json();
      
      let unreadNotifs = data.notifications.filter(n => !n.isRead);

      // Populate category counts below header
      try {
        const cRes = await fetch(`/api/notifications/unread-count?t=${new Date().getTime()}`, {
          headers: { "Authorization": "Bearer " + localStorage.getItem("userToken"), "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })() }
        });
        if (cRes.ok) {
          const cData = await cRes.json();
          const catCounts = cData.countsByCategory || {};
          const countsEl = document.getElementById('notif-dropdown-category-counts');
          if (countsEl) {
            const categories = ['Orders', 'Community', 'Store', 'News'];
            const pills = categories.map(cat => {
              const count = catCounts[cat] || 0;
              if (count === 0) return '';
              return `<span style="font-size:0.7rem;background:#f1f5f9;border-radius:20px;padding:2px 8px;color:#475569;font-weight:600;cursor:pointer;" onclick="window.location.href='profile.html#notifications'">${cat} <span style="color:#3b82f6;font-weight:700;">(${count})</span></span>`;
            }).filter(Boolean).join('');
            countsEl.innerHTML = pills || '';
            countsEl.style.display = pills ? 'flex' : 'none';
          }
        }
      } catch(e) {}

      if (unreadNotifs.length === 0) {
        listContainer.innerHTML = `
          <div style="padding: 20px; text-align: center; color: #64748b; font-size: 0.9rem;">
            <i class="fa-regular fa-bell-slash" style="font-size: 2rem; margin-bottom: 10px; display: block; color: #cbd5e1;"></i>
            You're all caught up. No new notifications.
          </div>
        `;
        return;
      }

      let html = "";
      unreadNotifs.forEach(n => {
        html += window.renderNotificationRowHTML(n, true);
      });

      listContainer.innerHTML = html;

      // Attach click events to open specific notification directly in preview
      listContainer.querySelectorAll('.dropdown-notif-item').forEach(el => {
        el.addEventListener('click', async (e) => {
          e.preventDefault();
          const id = el.getAttribute('data-id');
          try {
            await fetch(`/api/notifications/${id}/read`, {
              method: 'PATCH',
              headers: { "Authorization": "Bearer " + localStorage.getItem("userToken"), "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })() }
            });
            fetchUnreadCount();
          } catch(e) {}
          
          // Close dropdown
          const dropdown = document.getElementById('notifications-dropdown');
          if (dropdown) dropdown.style.display = 'none';

          const isProfilePage = window.location.pathname.endsWith('profile.html') || window.location.pathname.endsWith('profile');
          if (isProfilePage && typeof window.openDirectNotificationById === 'function') {
            if (typeof window.switchAccountTab === 'function') {
              window.switchAccountTab('notifications');
            }
            window.openDirectNotificationById(id);
          } else {
            sessionStorage.setItem('pending_open_notif_id', id);
            window.location.href = 'profile.html#notifications';
          }
        });
      });

    } catch (err) {
      console.error("Failed to load dropdown notifications:", err);
      listContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #ef4444;">Failed to load.</div>';
    }
  }

  // Setup UI toggles
  document.addEventListener("DOMContentLoaded", () => {
    // We attach this via a delegated listener on body since header might load async
    document.body.addEventListener("click", (e) => {
      const btn = e.target.closest("#nav-notifications-btn");
      const dropdown = document.getElementById("notifications-dropdown");
      
      if (btn) {
        if (dropdown) {
          const isVisible = dropdown.style.display === "block";
          if (!isVisible) {
            dropdown.style.display = "block";
            loadDropdownNotifications();
          } else {
            dropdown.style.display = "none";
          }
        }
      } else if (dropdown && !dropdown.contains(e.target)) {
        dropdown.style.display = "none";
      }

      // Handle category tab clicks in header
      const headerTab = e.target.closest('.header-notif-tab-btn');
      if (headerTab) {
        document.querySelectorAll('.header-notif-tab-btn').forEach(t => t.classList.remove('active'));
        headerTab.classList.add('active');
        headerNotifsCategory = headerTab.getAttribute('data-category') || 'All';
        loadDropdownNotifications();
      }
    });

    // Initial fetch — also called from setupHeader when header DOM is ready
    fetchUnreadCount();

    // Polling every 45 seconds
    setInterval(fetchUnreadCount, 45000);

    // Refresh on page focus
    window.addEventListener("focus", fetchUnreadCount);

    // Mark all as read button in dropdown
    document.body.addEventListener('click', async (e) => {
      const markAllBtn = e.target.closest('#notif-dropdown-mark-all-read');
      if (markAllBtn) {
        e.stopPropagation();
        try {
          const email = getCurrentUserEmail();
          if (!email) return;
          await fetch('/api/notifications/read-all', {
            method: 'PATCH',
            headers: { "Authorization": "Bearer " + localStorage.getItem("userToken"), "x-user-email": email }
          });
          fetchUnreadCount();
          loadDropdownNotifications();
        } catch(err) { console.error(err); }
      }

      // Settings gear toggle
      const settingsBtn = e.target.closest('#notif-dropdown-settings-btn');
      if (settingsBtn) {
        e.stopPropagation();
        const menu = document.getElementById('notif-dropdown-settings-menu');
        if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
      }

      // Close settings menu on outside click
      const settingsMenu = document.getElementById('notif-dropdown-settings-menu');
      if (settingsMenu && !e.target.closest('#notif-dropdown-settings-btn') && !e.target.closest('#notif-dropdown-settings-menu')) {
        settingsMenu.style.display = 'none';
      }

      // Delete all notifications shown in dropdown (no confirm, move to Trash)
      const deleteAllBtn = e.target.closest('#notif-dropdown-delete-all');
      if (deleteAllBtn) {
        e.stopPropagation();
        const settMenu = document.getElementById('notif-dropdown-settings-menu');
        if (settMenu) settMenu.style.display = 'none';
        try {
          const email = getCurrentUserEmail();
          if (!email) return;
          // Only move currently shown (unread) notifications in dropdown to trash
          const visibleIds = Array.from(
            document.querySelectorAll('#notifications-dropdown-list .dropdown-notif-item[data-id]')
          ).map(el => parseInt(el.getAttribute('data-id'))).filter(Boolean);
          if (visibleIds.length > 0) {
            await fetch('/api/notifications/bulk', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json', "Authorization": "Bearer " + localStorage.getItem("userToken"), "x-user-email": email },
              body: JSON.stringify({ ids: visibleIds })
            });
          }
          fetchUnreadCount();
          loadDropdownNotifications();
        } catch(err) { console.error(err); }
      }

      // Turn off / turn on notifications
      const turnOffBtn = e.target.closest('#notif-dropdown-turn-off');
      if (turnOffBtn) {
        e.stopPropagation();
        const settMenu = document.getElementById('notif-dropdown-settings-menu');
        if (settMenu) settMenu.style.display = 'none';
        localStorage.setItem('notif-muted', 'true');
        // Hide badge immediately
        const badge = document.getElementById('notifications-badge');
        if (badge) badge.style.display = 'none';
        // Swap button visibility
        const turnOnBtn = document.getElementById('notif-dropdown-turn-on');
        if (turnOffBtn) turnOffBtn.style.display = 'none';
        if (turnOnBtn) turnOnBtn.style.display = 'block';
      }

      const turnOnBtn = e.target.closest('#notif-dropdown-turn-on');
      if (turnOnBtn) {
        e.stopPropagation();
        const settMenu = document.getElementById('notif-dropdown-settings-menu');
        if (settMenu) settMenu.style.display = 'none';
        localStorage.removeItem('notif-muted');
        fetchUnreadCount();
        // Swap button visibility
        const turnOffBtnEl = document.getElementById('notif-dropdown-turn-off');
        if (turnOffBtnEl) turnOffBtnEl.style.display = 'block';
        if (turnOnBtn) turnOnBtn.style.display = 'none';
      }
    });

    // Apply muted state on load
    if (localStorage.getItem('notif-muted') === 'true') {
      const turnOffBtnEl = document.getElementById('notif-dropdown-turn-off');
      const turnOnBtnEl = document.getElementById('notif-dropdown-turn-on');
      if (turnOffBtnEl) turnOffBtnEl.style.display = 'none';
      if (turnOnBtnEl) turnOnBtnEl.style.display = 'block';
    }
  });
})();
