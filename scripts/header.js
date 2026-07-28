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
    if (!currentPage || currentPage === "index") currentPage = "home";

    links.forEach(link => {
      const hrefAttr = link.getAttribute("href");
      if (!hrefAttr) return;

      const linkHref = hrefAttr.toLowerCase().replace(/\.html$/, "");

      if (linkHref === currentPage) {
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
  const showSignupBtnTop = document.getElementById("show-signup-link-top");
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

  function getRegisteredUsers() {
    const users = localStorage.getItem("registeredUsers");
    return users ? JSON.parse(users) : [];
  }

  function getCurrentUser() {
    const user = localStorage.getItem("currentUser");
    return user ? JSON.parse(user) : null;
  }

  function updateAuthUI() {
    const currentUser = getCurrentUser();
    const mobileAuthSpan = document.querySelector("#mobile-nav-auth span");
    const mobileAuthIcon = document.querySelector("#mobile-nav-auth i");

    if (currentUser) {
      authTexts.forEach(txt => txt.textContent = currentUser.username);
      authBtns.forEach(btn => btn.classList.add("logged-in"));
      if (mobileAuthSpan) mobileAuthSpan.textContent = currentUser.username;
      
      authIcons.forEach(icon => {
        icon.className = "header-user-avatar";
        if (currentUser.avatar) {
          icon.innerHTML = `<img src="${currentUser.avatar}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />`;
        } else {
          icon.textContent = currentUser.username.charAt(0).toUpperCase();
        }
      });
      if (dropdownUsername) dropdownUsername.textContent = currentUser.username;
      if (dropdownEmail) dropdownEmail.textContent = currentUser.email;
      if (dropdownUserAvatar && currentUser.avatar) {
        dropdownUserAvatar.src = currentUser.avatar;
      }
    } else {
      authTexts.forEach(txt => txt.textContent = "Sign In");
      authBtns.forEach(btn => btn.classList.remove("logged-in"));
      if (mobileAuthSpan) mobileAuthSpan.textContent = "Account";

      authIcons.forEach(icon => {
        icon.className = "fa-regular fa-user auth-icon-elem";
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

    const badges = document.querySelectorAll(".cart-badge, #cart-badge, #mobile-cart-badge");

    badges.forEach(badge => {
      if (totalQty > 0) {
        badge.textContent = totalQty.toString();
        badge.style.display = "flex";
      } else {
        badge.style.display = "none";
      }
    });
  }

  updateAuthUI();
  updateCartBadge();

  // Polling & listeners for instant cart badge sync across all user actions
  setInterval(updateCartBadge, 300);
  window.updateCartBadge = updateCartBadge;
  window.addEventListener("cartUpdated", updateCartBadge);
  window.addEventListener("storage", updateCartBadge);

  // Global addToCart helper available across all pages
  window.addToCart = function (item) {
    if (!item || (!item.name && !item.id)) return;

    let cart = localStorage.getItem("shoppingCart");
    cart = cart ? JSON.parse(cart) : [];

    const itemQty = typeof item.quantity === "number" ? item.quantity : parseInt(item.quantity || "1", 10);
    const qtyToAdd = isNaN(itemQty) ? 1 : itemQty;

    const existing = cart.find(c => c.id === item.id || (c.name && c.name.toLowerCase() === item.name.toLowerCase()));
    if (existing) {
      const curQty = typeof existing.quantity === "number" ? existing.quantity : parseInt(existing.quantity || "1", 10);
      existing.quantity = (isNaN(curQty) ? 1 : curQty) + qtyToAdd;
      if (item.variant) existing.variant = item.variant;
    } else {
      cart.push({
        id: item.id || ("ITEM-" + Date.now()),
        name: item.name || "SenpaiWorks Product",
        price: item.price || 0,
        img: item.img || "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp",
        type: item.type || "physical",
        quantity: qtyToAdd,
        variant: item.variant || "Standard Edition"
      });
    }

    localStorage.setItem("shoppingCart", JSON.stringify(cart));
    updateCartBadge();
    window.dispatchEvent(new Event("cartUpdated"));
  };

  // Auth button click behavior (Toggles profile dropdown card or opens sign-in modal)
  document.addEventListener("click", (e) => {
    const authBtn = e.target.closest("#nav-auth-btn, #mobile-nav-auth");
    if (!authBtn) return;

    if (authBtn.id === "mobile-nav-auth") {
      window.location.href = "profile.html";
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const dropCardElem = document.getElementById("profile-dropdown-card");
    if (dropCardElem) {
      dropCardElem.classList.toggle("active");
    } else {
      window.location.href = "profile.html";
    }
  });

  // Close dropdown on click outside
  document.addEventListener("click", (e) => {
    const navAuthBtn = document.getElementById("nav-auth-btn");
    const dropCardElem = document.getElementById("profile-dropdown-card");
    if (dropCardElem && dropCardElem.classList.contains("active")) {
      if (!dropCardElem.contains(e.target) && navAuthBtn && !navAuthBtn.contains(e.target)) {
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

  if (dropdownSignoutBtn) {
    dropdownSignoutBtn.addEventListener("click", () => {
      localStorage.removeItem("currentUser");
      updateAuthUI();
      if (dropdownCard) dropdownCard.classList.remove("active");
    });
  }

  if (authCloseBtn && authModal) {
    authCloseBtn.addEventListener("click", () => {
      authModal.classList.remove("active");
    });
  }

  if (showSignupBtn) {
    showSignupBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (signinWrapper) signinWrapper.style.display = "none";
      if (signupWrapper) signupWrapper.style.display = "block";
      if (signupError) signupError.style.display = "none";
    });
  }

  if (showSignupBtnTop) {
    showSignupBtnTop.addEventListener("click", (e) => {
      e.preventDefault();
      if (signinWrapper) signinWrapper.style.display = "none";
      if (signupWrapper) signupWrapper.style.display = "block";
      if (signupError) signupError.style.display = "none";
    });
  }

  if (showSigninBtn) {
    showSigninBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (signupWrapper) signupWrapper.style.display = "none";
      if (signinWrapper) signinWrapper.style.display = "block";
      if (signinError) signinError.style.display = "none";
    });
  }

  if (signinForm) {
    signinForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const loginVal = document.getElementById("signin-email").value.trim();
      const passwordVal = document.getElementById("signin-password").value;

      if (signinError) signinError.style.display = "none";

      const users = getRegisteredUsers();
      const match = users.find(u => (u.username.toLowerCase() === loginVal.toLowerCase() || u.email.toLowerCase() === loginVal.toLowerCase()) && u.password === passwordVal);

      if (match) {
        localStorage.setItem("currentUser", JSON.stringify({ username: match.username, email: match.email }));
        updateAuthUI();
        signinForm.reset();
        if (authModal) authModal.classList.remove("active");
      } else {
        if (signinError) {
          signinError.textContent = "Invalid username/email or password.";
          signinError.style.display = "block";
        }
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const usernameVal = document.getElementById("signup-username").value.trim();
      const emailVal = document.getElementById("signup-email").value.trim();
      const passwordVal = document.getElementById("signup-password").value;

      if (signupError) signupError.style.display = "none";

      if (passwordVal.length < 6) {
        if (signupError) {
          signupError.textContent = "Password must be at least 6 characters.";
          signupError.style.display = "block";
        }
        return;
      }

      const users = getRegisteredUsers();
      const nameExists = users.some(u => u.username.toLowerCase() === usernameVal.toLowerCase());
      const emailExists = users.some(u => u.email.toLowerCase() === emailVal.toLowerCase());

      if (nameExists) {
        if (signupError) {
          signupError.textContent = "Username is already taken.";
          signupError.style.display = "block";
        }
        return;
      }

      if (emailExists) {
        if (signupError) {
          signupError.textContent = "Email is already registered.";
          signupError.style.display = "block";
        }
        return;
      }

      const newUser = { username: usernameVal, email: emailVal, password: passwordVal };
      users.push(newUser);
      localStorage.setItem("registeredUsers", JSON.stringify(users));
      localStorage.setItem("currentUser", JSON.stringify({ username: usernameVal, email: emailVal }));

      updateAuthUI();
      signupForm.reset();
      if (authModal) authModal.classList.remove("active");
    });
  }
}
