interface CartItem {
  id: string;
  name: string;
  price: number;
  img: string;
  quantity: number;
  type?: 'digital' | 'physical';
}

interface User {
  username: string;
  email: string;
  avatar?: string;
}

document.addEventListener("DOMContentLoaded", () => {
  const placeholder = document.getElementById("header-placeholder");
  if (!placeholder) return;

  // Clear stale cached header if it contains search-expandable elements from earlier session
  const cachedStr = sessionStorage.getItem("cached_header");
  if (cachedStr && (cachedStr.includes("header-white-search-expandable") || cachedStr.includes("header-search-expandable"))) {
    sessionStorage.removeItem("cached_header");
  }

  function setupHeader() {
    // 1. Navbar active state logic
    const links = placeholder!.querySelectorAll(".nav-link, .mobile-nav-item");
    const pathPop = window.location.pathname.split("/").pop();
    let currentPage = pathPop ? pathPop.toLowerCase().replace(/\.html$/, "") : "";
    if (!currentPage) currentPage = "home";

    links.forEach(link => {
      const hrefAttr = link.getAttribute("href");
      if (!hrefAttr) return;

      const linkHref = hrefAttr
        .toLowerCase()
        .replace(/\.html$/, "");

      if (linkHref === currentPage) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    // 1.5 Sync/preserve news ticker offset across page loads
    const tickerTrack = placeholder!.querySelector(".header-ticker-track") as HTMLElement | null;
    if (tickerTrack) {
      if (!sessionStorage.getItem("ticker_base_time")) {
        sessionStorage.setItem("ticker_base_time", Date.now().toString());
      }
      const baseTime = parseInt(sessionStorage.getItem("ticker_base_time") || "0", 10);
      const elapsedMs = Date.now() - baseTime;
      const durationMs = 45000; // matching 45s animation duration in header.css
      const offsetSeconds = (elapsedMs % durationMs) / 1000;
      tickerTrack.style.animationDelay = `-${offsetSeconds}s`;
    }

    // 2. Initialize header interactions (Auth, Cart, Checkout)
    initHeaderInteractions();
  }

  // If placeholder is already populated by inline sessionStorage script, setup immediately
  if (placeholder.innerHTML.trim() !== "") {
    setupHeader();
  } else {
    // Fallback if inline script didn't run
    const cachedHTML = sessionStorage.getItem("cached_header");
    if (cachedHTML) {
      placeholder.innerHTML = cachedHTML;
      setupHeader();
    }
  }

  // Always fetch the latest in background
  fetch("header.html?v=" + new Date().getTime())
    .then(res => res.text())
    .then(data => {
      const prevHTML = sessionStorage.getItem("cached_header");
      sessionStorage.setItem("cached_header", data);

      if (data !== prevHTML || placeholder.innerHTML.trim() === "") {
        placeholder.innerHTML = data;
        setupHeader();
      }
    })
    .catch(err => console.error("Error loading header:", err));
});

function initHeaderInteractions() {
  // Seed default user if none is logged in
  if (!localStorage.getItem("currentUser")) {
    localStorage.setItem("currentUser", JSON.stringify({
      username: "senpai",
      email: "suhassenpai@gmail.com"
    }));
  }

  // Elements
  const authModal = document.getElementById("auth-modal");
  const authBtns = document.querySelectorAll("#nav-auth-btn, #mobile-nav-auth");
  const authCloseBtn = document.getElementById("auth-close-btn");
  const authTexts = document.querySelectorAll(".auth-text");
  const authIcons = document.querySelectorAll("#nav-auth-icon, .auth-icon-elem");

  const signinWrapper = document.getElementById("signin-form-wrapper");
  const signupWrapper = document.getElementById("signup-form-wrapper");
  const userDetailsWrapper = document.getElementById("user-details-wrapper");

  const showSignupBtn = document.getElementById("show-signup-link");
  const showSignupBtnTop = document.getElementById("show-signup-link-top");
  const showSigninBtn = document.getElementById("show-signin-link");

  const signinForm = document.getElementById("signin-form") as HTMLFormElement | null;
  const signupForm = document.getElementById("signup-form") as HTMLFormElement | null;
  const logoutBtn = document.getElementById("logout-btn");

  const signinError = document.getElementById("signin-error");
  const signupError = document.getElementById("signup-error");

  const userProfileName = document.getElementById("user-profile-name");
  const userProfileEmail = document.getElementById("user-profile-email");
  const userProfileAvatar = document.getElementById("user-profile-avatar");

  // Dropdown elements
  const dropdownCard = document.getElementById("profile-dropdown-card");
  const dropdownUsername = document.getElementById("dropdown-username");
  const dropdownEmail = document.getElementById("dropdown-email");
  const dropdownSignoutBtn = document.getElementById("dropdown-signout-btn");
  const dropdownOrdersBtn = document.getElementById("dropdown-orders-btn");
  const dropdownFeedbackBtn = document.getElementById("dropdown-feedback-btn");
  const dropdownNotificationsBtn = document.getElementById("dropdown-notifications-btn");

  // Cart elements
  const cartDrawer = document.getElementById("cart-drawer");
  const cartBtns = document.querySelectorAll("#nav-cart-btn, #mobile-nav-cart");
  const cartCloseBtn = document.getElementById("cart-close-btn");
  const cartBadges = document.querySelectorAll(".cart-badge");
  const cartItemsList = document.getElementById("cart-items-list");
  const cartSubtotal = document.getElementById("cart-subtotal");
  const cartCheckoutBtn = document.getElementById("cart-checkout-btn") as HTMLButtonElement | null;

  // Checkout elements
  const checkoutModal = document.getElementById("checkout-modal");
  const checkoutCloseBtn = document.getElementById("checkout-close-btn");
  const checkoutItemsList = document.getElementById("checkout-items-list");
  const checkoutSubtotal = document.getElementById("checkout-subtotal");
  const checkoutShipping = document.getElementById("checkout-shipping");
  const checkoutTotal = document.getElementById("checkout-total");
  const checkoutForm = document.getElementById("checkout-payment-form") as HTMLFormElement | null;
  const paymentError = document.getElementById("payment-error");

  // Steps
  const step1 = document.getElementById("checkout-step-1");
  const step2 = document.getElementById("checkout-step-2");
  const step3 = document.getElementById("checkout-step-3");
  const stepInd1 = document.getElementById("step-ind-1");
  const stepInd2 = document.getElementById("step-ind-2");
  const stepInd3 = document.getElementById("step-ind-3");

  const toStep2Btn = document.getElementById("checkout-to-step-2");
  const backTo1Btn = document.getElementById("checkout-back-to-1");
  const finishBtn = document.getElementById("checkout-finish-btn");

  // --- Auth logic ---
  function getRegisteredUsers(): any[] {
    const users = localStorage.getItem("registeredUsers");
    return users ? JSON.parse(users) : [];
  }

  function getCurrentUser(): User | null {
    const user = localStorage.getItem("currentUser");
    return user ? JSON.parse(user) : null;
  }

  function updateAuthUI() {
    const currentUser = getCurrentUser();
    if (currentUser) {
      authTexts.forEach(txt => txt.textContent = currentUser.username);
      authBtns.forEach(btn => btn.classList.add("logged-in"));
      authIcons.forEach(icon => {
        icon.className = "header-user-avatar";
        if (currentUser.avatar) {
          icon.textContent = "";
          icon.innerHTML = `<img src="${currentUser.avatar}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />`;
        } else {
          icon.innerHTML = "";
          icon.textContent = currentUser.username.charAt(0).toUpperCase();
        }
      });
      if (dropdownUsername) dropdownUsername.textContent = currentUser.username;
      if (dropdownEmail) dropdownEmail.textContent = currentUser.email;

      const dropdownUserAvatar = document.getElementById("dropdown-user-avatar") as HTMLImageElement | null;
      if (dropdownUserAvatar) {
        if (currentUser.avatar) {
          dropdownUserAvatar.src = currentUser.avatar;
        } else {
          dropdownUserAvatar.src = "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp";
        }
      }
    } else {
      authTexts.forEach(txt => txt.textContent = "Sign In");
      authBtns.forEach(btn => btn.classList.remove("logged-in"));
      authIcons.forEach(icon => {
        icon.className = "fa-regular fa-user auth-icon-elem";
        icon.textContent = "";
        icon.innerHTML = "";
      });
      if (dropdownCard) dropdownCard.classList.remove("active");

      const dropdownUserAvatar = document.getElementById("dropdown-user-avatar") as HTMLImageElement | null;
      if (dropdownUserAvatar) {
        dropdownUserAvatar.src = "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp";
      }
    }
  }

  // Initial UI check
  updateAuthUI();

  authBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      const currentUser = getCurrentUser();
      if (currentUser) {
        if (btn.id === "nav-auth-btn") {
          e.preventDefault();
          e.stopPropagation();
          if (dropdownCard) dropdownCard.classList.toggle("active");
          return;
        }

        // Show profile panel
        if (authModal) authModal.classList.add("active");
        if (signinWrapper) signinWrapper.style.display = "none";
        if (signupWrapper) signupWrapper.style.display = "none";
        if (userDetailsWrapper) userDetailsWrapper.style.display = "block";

        if (userProfileName) userProfileName.textContent = currentUser.username;
        if (userProfileEmail) userProfileEmail.textContent = currentUser.email;
        if (userProfileAvatar) {
          if (currentUser.avatar) {
            userProfileAvatar.innerHTML = `<img src="${currentUser.avatar}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />`;
          } else {
            userProfileAvatar.innerHTML = "";
            userProfileAvatar.textContent = currentUser.username.charAt(0).toUpperCase();
          }
        }
      } else {
        // Show Sign In screen by default
        if (authModal) authModal.classList.add("active");
        if (signinWrapper) signinWrapper.style.display = "block";
        if (signupWrapper) signupWrapper.style.display = "none";
        if (userDetailsWrapper) userDetailsWrapper.style.display = "none";
        if (signinError) signinError.style.display = "none";
      }
    });
  });

  // Dropdown interactions & outside click close
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const navAuthBtn = document.getElementById("nav-auth-btn");
    if (dropdownCard && dropdownCard.classList.contains("active")) {
      if (!dropdownCard.contains(target) && navAuthBtn && !navAuthBtn.contains(target)) {
        dropdownCard.classList.remove("active");
      }
    }
  });

  function showDropdownToast(msg: string) {
    const existing = document.querySelector(".dropdown-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = "dropdown-toast";
    toast.innerHTML = `<i class="fa-solid fa-circle-info"></i> <span>${msg}</span>`;
    
    Object.assign(toast.style, {
      position: "fixed",
      bottom: "24px",
      right: "24px",
      background: "#ffffff",
      color: "#18181b",
      padding: "12px 20px",
      borderRadius: "10px",
      boxShadow: "0 10px 25px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.02)",
      border: "1px solid #f0f0f0",
      zIndex: "9999",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      fontSize: "0.9rem",
      fontWeight: "600",
      animation: "toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
    });

    if (!document.getElementById("dropdown-toast-style")) {
      const s = document.createElement("style");
      s.id = "dropdown-toast-style";
      s.textContent = `
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `;
      document.head.appendChild(s);
    }

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px) scale(0.95)";
      toast.style.transition = "all 0.2s ease";
      setTimeout(() => toast.remove(), 200);
    }, 3000);
  }

  if (dropdownSignoutBtn) {
    dropdownSignoutBtn.addEventListener("click", () => {
      localStorage.removeItem("currentUser");
      updateAuthUI();
      if (dropdownCard) dropdownCard.classList.remove("active");
      showDropdownToast("Signed out successfully!");
    });
  }

  if (dropdownOrdersBtn) {
    dropdownOrdersBtn.addEventListener("click", () => {
      if (dropdownCard) dropdownCard.classList.remove("active");
    });
  }

  if (dropdownFeedbackBtn) {
    dropdownFeedbackBtn.addEventListener("click", () => {
      if (dropdownCard) dropdownCard.classList.remove("active");
    });
  }

  if (dropdownNotificationsBtn) {
    dropdownNotificationsBtn.addEventListener("click", () => {
      if (dropdownCard) dropdownCard.classList.remove("active");
      showDropdownToast("No new notifications.");
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
      const loginVal = (document.getElementById("signin-email") as HTMLInputElement).value.trim();
      const passwordVal = (document.getElementById("signin-password") as HTMLInputElement).value;

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
      const usernameVal = (document.getElementById("signup-username") as HTMLInputElement).value.trim();
      const emailVal = (document.getElementById("signup-email") as HTMLInputElement).value.trim();
      const passwordVal = (document.getElementById("signup-password") as HTMLInputElement).value;

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

      // Save user
      const newUser = { username: usernameVal, email: emailVal, password: passwordVal };
      users.push(newUser);
      localStorage.setItem("registeredUsers", JSON.stringify(users));
      localStorage.setItem("currentUser", JSON.stringify({ username: usernameVal, email: emailVal }));

      updateAuthUI();
      signupForm.reset();
      if (authModal) authModal.classList.remove("active");
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("currentUser");
      updateAuthUI();
      if (authModal) authModal.classList.remove("active");
    });
  }

  // --- Cart Drawer logic ---
  function getCart(): CartItem[] {
    const cart = localStorage.getItem("shoppingCart");
    return cart ? JSON.parse(cart) : [];
  }

  function saveCart(cart: CartItem[]) {
    localStorage.setItem("shoppingCart", JSON.stringify(cart));
    updateCartUI();
  }

  function updateCartUI() {
    const cart = getCart();
    
    // Update badge counter
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadges.forEach(badge => {
      if (totalQty > 0) {
        badge.textContent = totalQty.toString();
        (badge as HTMLElement).style.display = "flex";
      } else {
        (badge as HTMLElement).style.display = "none";
      }
    });

    // Enable/disable checkout btn
    if (cartCheckoutBtn) {
      cartCheckoutBtn.disabled = cart.length === 0;
    }

    // Populate drawer list
    if (cartItemsList) {
      if (cart.length === 0) {
        cartItemsList.innerHTML = `<div class="empty-cart-msg">Your cart is empty.</div>`;
        if (cartSubtotal) cartSubtotal.textContent = "$0.00";
        return;
      }

      let subtotal = 0;
      let html = "";

      cart.forEach((item) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        html += `
          <div class="cart-item-row" data-id="${item.id}">
            <img class="cart-item-img" src="${item.img}" alt="${item.name}">
            <div class="cart-item-info">
              <div>
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">$${item.price.toFixed(2)}</div>
              </div>
              <div class="cart-item-controls">
                <div class="qty-selector">
                  <button class="qty-btn qty-minus" data-id="${item.id}">&minus;</button>
                  <span class="qty-val">${item.quantity}</span>
                  <button class="qty-btn qty-plus" data-id="${item.id}">&plus;</button>
                </div>
                <button class="cart-item-remove-btn" data-id="${item.id}">
                  <i class="fa-regular fa-trash-can"></i> Remove
                </button>
              </div>
            </div>
          </div>
        `;
      });

      cartItemsList.innerHTML = html;
      if (cartSubtotal) cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;

      // Attach control listeners to items inside the drawer
      cartItemsList.querySelectorAll(".qty-minus").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          if (!id) return;
          const cart = getCart();
          const match = cart.find(i => i.id === id);
          if (match) {
            match.quantity -= 1;
            if (match.quantity <= 0) {
              const idx = cart.indexOf(match);
              cart.splice(idx, 1);
            }
            saveCart(cart);
          }
        });
      });

      cartItemsList.querySelectorAll(".qty-plus").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          if (!id) return;
          const cart = getCart();
          const match = cart.find(i => i.id === id);
          if (match) {
            match.quantity += 1;
            saveCart(cart);
          }
        });
      });

      cartItemsList.querySelectorAll(".cart-item-remove-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          if (!id) return;
          const cart = getCart();
          const filtered = cart.filter(i => i.id !== id);
          saveCart(filtered);
        });
      });
    }
  }

  // Bind cart drawer buttons
  cartBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      if (cartDrawer) cartDrawer.classList.add("active");
      updateCartUI();
    });
  });

  if (cartCloseBtn && cartDrawer) {
    cartCloseBtn.addEventListener("click", () => {
      cartDrawer.classList.remove("active");
    });
  }

  // Global addToCart hook
  (window as any).addToCart = function(item: Omit<CartItem, "quantity"> & { type?: 'digital' | 'physical' }) {
    const cart = getCart();
    const match = cart.find(i => i.id === item.id);
    if (match) {
      match.quantity += 1;
    } else {
      cart.push({ ...item, quantity: 1 });
    }
    saveCart(cart);
    
    // Automatically slide cart open
    if (cartDrawer) cartDrawer.classList.add("active");
  };

  // Initial update
  updateCartUI();


  // --- Checkout logic ---
  function getShippingCost(cart: CartItem[]): number {
    const hasPhysical = cart.some(i => i.type === 'physical');
    return hasPhysical ? 10.00 : 0.00;
  }

  if (cartCheckoutBtn) {
    cartCheckoutBtn.addEventListener("click", () => {
      const currentUser = getCurrentUser();
      
      // Force Login/Register before checking out
      if (!currentUser) {
        if (cartDrawer) cartDrawer.classList.remove("active");
        if (authModal) authModal.classList.add("active");
        // Show Sign In screen by default
        if (signinWrapper) signinWrapper.style.display = "block";
        if (signupWrapper) signupWrapper.style.display = "none";
        if (userDetailsWrapper) userDetailsWrapper.style.display = "none";
        if (signinError) {
          signinError.textContent = "Please sign in or create an account to proceed with checkout.";
          signinError.style.display = "block";
        }
        return;
      }

      // Close drawer, open checkout modal
      if (cartDrawer) cartDrawer.classList.remove("active");
      if (checkoutModal) checkoutModal.classList.add("active");
      
      renderCheckoutStep1();
    });
  }

  function renderCheckoutStep1() {
    // Set wizard back to step 1
    if (step1) step1.style.display = "block";
    if (step2) step2.style.display = "none";
    if (step3) step3.style.display = "none";

    if (stepInd1) stepInd1.className = "step-indicator active";
    if (stepInd2) stepInd2.className = "step-indicator";
    if (stepInd3) stepInd3.className = "step-indicator";

    const cart = getCart();
    if (checkoutItemsList) {
      if (cart.length === 0) {
        checkoutItemsList.innerHTML = `<p>Your cart is empty.</p>`;
        return;
      }

      checkoutItemsList.innerHTML = cart.map(item => `
        <div class="checkout-summary-item">
          <span>${item.name} (x${item.quantity})</span>
          <span>$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
      `).join("");
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = getShippingCost(cart);
    const total = subtotal + shipping;

    if (checkoutSubtotal) checkoutSubtotal.textContent = `$${subtotal.toFixed(2)}`;
    if (checkoutShipping) checkoutShipping.textContent = `$${shipping.toFixed(2)}`;
    if (checkoutTotal) checkoutTotal.textContent = `$${total.toFixed(2)}`;
  }

  if (checkoutCloseBtn && checkoutModal) {
    checkoutCloseBtn.addEventListener("click", () => {
      checkoutModal.classList.remove("active");
    });
  }

  if (toStep2Btn) {
    toStep2Btn.addEventListener("click", () => {
      if (step1) step1.style.display = "none";
      if (step2) step2.style.display = "block";
      
      if (stepInd1) stepInd1.className = "step-indicator";
      if (stepInd2) stepInd2.className = "step-indicator active";

      // Hide shipping address input if only digital assets in cart
      const cart = getCart();
      const shippingAddressGroup = document.getElementById("shipping-address-group");
      const billAddress = document.getElementById("bill-address") as HTMLInputElement | null;
      
      if (shippingAddressGroup) {
        const hasPhysical = cart.some(i => i.type === 'physical');
        if (hasPhysical) {
          shippingAddressGroup.style.display = "block";
          if (billAddress) billAddress.required = true;
        } else {
          shippingAddressGroup.style.display = "none";
          if (billAddress) {
            billAddress.required = false;
            billAddress.value = "";
          }
        }
      }

      // Populate billing email/name from currentUser info
      const currentUser = getCurrentUser();
      const billName = document.getElementById("bill-name") as HTMLInputElement | null;
      const billEmail = document.getElementById("bill-email") as HTMLInputElement | null;
      if (currentUser) {
        if (billName && !billName.value) billName.value = currentUser.username;
        if (billEmail && !billEmail.value) billEmail.value = currentUser.email;
      }
      if (paymentError) paymentError.style.display = "none";
    });
  }

  if (backTo1Btn) {
    backTo1Btn.addEventListener("click", () => {
      if (step2) step2.style.display = "none";
      if (step1) step1.style.display = "block";

      if (stepInd2) stepInd2.className = "step-indicator";
      if (stepInd1) stepInd1.className = "step-indicator active";
    });
  }

  if (checkoutForm) {
    checkoutForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (paymentError) paymentError.style.display = "none";

      const cart = getCart();
      if (cart.length === 0) return;

      const cardVal = (document.getElementById("card-number") as HTMLInputElement).value.replace(/\s+/g, "");
      const expiryVal = (document.getElementById("card-expiry") as HTMLInputElement).value.trim();
      const cvvVal = (document.getElementById("card-cvv") as HTMLInputElement).value.trim();

      // Simple mock validations
      if (cardVal.length < 15 || isNaN(Number(cardVal))) {
        showPaymentError("Please enter a valid credit card number.");
        return;
      }

      if (!expiryVal.includes("/")) {
        showPaymentError("Expiry must be in MM/YY format.");
        return;
      }

      if (cvvVal.length < 3 || isNaN(Number(cvvVal))) {
        showPaymentError("Please enter a valid CVV.");
        return;
      }

      // Success! Proceed to Step 3
      if (step2) step2.style.display = "none";
      if (step3) step3.style.display = "block";

      if (stepInd2) stepInd2.className = "step-indicator";
      if (stepInd3) stepInd3.className = "step-indicator active";

      // Populate success summary
      const randomOrderId = "SW-" + Math.floor(10000000 + Math.random() * 90000000);
      const successOrderId = document.getElementById("success-order-id");
      if (successOrderId) successOrderId.textContent = randomOrderId;

      const successDeliveryType = document.getElementById("success-delivery-type");
      if (successDeliveryType) {
        const hasPhysical = cart.some(i => i.type === 'physical');
        const hasDigital = cart.some(i => i.type === 'digital');
        if (hasPhysical && hasDigital) {
          successDeliveryType.textContent = "Brushes sent to email. Art prints will ship to address within 3-5 business days.";
        } else if (hasPhysical) {
          successDeliveryType.textContent = "Prints will ship to address within 3-5 business days.";
        } else {
          successDeliveryType.textContent = "Digital links sent to your registered email address.";
        }
      }

      // Save to userOrders
      const orderDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const totalVal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + getShippingCost(cart);
      const currentUser = getCurrentUser();
      
      const newOrder = {
        orderId: randomOrderId,
        orderDate: orderDate,
        items: cart,
        total: totalVal,
        status: "Processing",
        shippedTo: currentUser ? currentUser.username : "Guest User"
      };
      
      let userOrders = localStorage.getItem("userOrders");
      let parsedOrders = userOrders ? JSON.parse(userOrders) : [];
      parsedOrders.unshift(newOrder);
      localStorage.setItem("userOrders", JSON.stringify(parsedOrders));

      // Reset checkout forms & clear shopping cart
      checkoutForm.reset();
      saveCart([]);
    });
  }

  function showPaymentError(msg: string) {
    if (paymentError) {
      paymentError.textContent = msg;
      paymentError.style.display = "block";
    }
  }

  if (finishBtn) {
    finishBtn.addEventListener("click", () => {
      if (checkoutModal) checkoutModal.classList.remove("active");
    });
  }
}

