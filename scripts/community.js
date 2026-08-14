"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const reviewsGrid = document.getElementById("community-reviews-grid");
  const loadMoreContainer = document.getElementById("load-more-container");
  const btnLoadMore = document.getElementById("btn-load-more");
  const sortSelect = document.getElementById("reviews-sort-select");

  let showAllReviews = false;
  let publicReviews = [];
  let currentSort = "newest";

  async function initCommunityReviews() {
    if (!reviewsGrid) return;

    let apiReviews = [];
    try {
      const res = await fetch("/api/community/reviews");
      if (res.ok) {
        apiReviews = await res.json();
      }
    } catch (e) { }

    let userReviews = localStorage.getItem("userReviews");
    let reviewsList = [];
    if (userReviews) {
      try {
        reviewsList = JSON.parse(userReviews) || [];
      } catch (e) {
        reviewsList = [];
      }
    }

    const seedReviews = [
      { id: "rev-seed-1", author: "ZoroFan42", rating: 5, category: "Order Issue", title: "Incredible print quality!", text: "The green contrast on the Zoro poster is even more vibrant in person. Paper feels very premium.", date: "July 10, 2026", isPublic: true, likes: 24 },
      { id: "rev-seed-2", author: "RigArtist", rating: 5, category: "3D Character Rig", title: "Perfect blender rig!", text: "Excellent topology and weight painting on the Suzens model.", date: "July 08, 2026", isPublic: true, likes: 15 },
      { id: "rev-seed-3", author: "BrushesPro", rating: 4, category: "Brushes & Textures", title: "Super clean brushes", text: "Nice digital painting brushes and template guidelines.", date: "July 05, 2026", isPublic: true, likes: 8 },
      { id: "rev-seed-4", author: "DevSora", rating: 5, category: "General Website", title: "Smooth website UI", text: "The donation page micro-animations are beautiful.", date: "June 29, 2026", isPublic: true, likes: 42 }
    ];

    const customReviews = reviewsList.filter(r => r && r.id && !r.id.startsWith("rev-seed-"));

    const reviewMap = new Map();
    [...apiReviews, ...customReviews, ...seedReviews].forEach(r => {
      if (r && r.id && !reviewMap.has(r.id)) {
        reviewMap.set(r.id, r);
      }
    });

    const combinedReviews = Array.from(reviewMap.values());
    localStorage.setItem("userReviews", JSON.stringify(combinedReviews));
    localStorage.setItem("user_reviews", JSON.stringify(combinedReviews));

    publicReviews = combinedReviews.filter(r => r.isPublic !== false);
    renderReviews();
  }

  function renderReviews() {
    const commReviewsCountPill = document.getElementById("comm-reviews-count-pill");
    if (commReviewsCountPill) {
      commReviewsCountPill.textContent = publicReviews.length;
    }

    if (publicReviews.length === 0) {
      reviewsGrid.innerHTML = `<div class="no-orders-msg" style="grid-column: 1 / -1;">No public reviews yet. Be the first to submit feedback!</div>`;
      if (loadMoreContainer) loadMoreContainer.style.display = "none";
      return;
    }

    // Sort publicReviews copy dynamically
    let sortedReviews = [...publicReviews];
    if (currentSort === "newest") {
      sortedReviews.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
    } else if (currentSort === "oldest") {
      sortedReviews.sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    } else if (currentSort === "best") {
      sortedReviews.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }

    const gridStyles = window.getComputedStyle(reviewsGrid);
    const gridTemplateColumns = gridStyles.getPropertyValue("grid-template-columns");
    const columnCount = gridTemplateColumns ? gridTemplateColumns.trim().split(/\s+/).length : 1;
    const initialLimit = columnCount * 2;

    const needsButton = publicReviews.length > initialLimit;
    const limit = showAllReviews ? publicReviews.length : initialLimit;

    const reviewsToRender = sortedReviews.slice(0, limit);

    // Read liked reviews mapping
    let likedReviews = [];
    try {
      likedReviews = JSON.parse(localStorage.getItem("likedReviews") || "[]");
    } catch (e) {
      likedReviews = [];
    }

    let html = "";
    reviewsToRender.forEach(review => {
      // Generate stars HTML
      let starsHTML = "";
      for (let i = 1; i <= 5; i++) {
        if (i <= review.rating) {
          starsHTML += `<i class="fa-solid fa-star"></i>`;
        } else {
          starsHTML += `<i class="fa-regular fa-star"></i>`;
        }
      }

      const isLiked = likedReviews.includes(review.id);
      const likesCount = review.likes || 0;

      html += `
        <div class="review-card">
          <div class="review-card-header">
            <span class="review-author"><i class="fa-solid fa-user-circle"></i> ${review.author}</span>
            <div class="review-stars">
              ${starsHTML}
            </div>
          </div>
          <div class="review-meta">
            <span class="review-category">${review.category}</span>
          </div>
          <h3>${review.title}</h3>
          <p title="${review.text}">${review.text}</p>
          <div class="review-card-footer">
            <span class="review-date">${review.date}</span>
            <button class="like-btn ${isLiked ? 'liked' : ''}" data-id="${review.id}">
              <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
              <span class="like-count">${likesCount}</span>
            </button>
          </div>
        </div>
      `;
    });

    reviewsGrid.innerHTML = html;

    if (loadMoreContainer) {
      if (needsButton) {
        loadMoreContainer.style.display = "flex";
        if (showAllReviews) {
          btnLoadMore.innerHTML = `Show Less <i class="fa-solid fa-chevron-up"></i>`;
        } else {
          btnLoadMore.innerHTML = `Load More Reviews <i class="fa-solid fa-chevron-down"></i>`;
        }
      } else {
        loadMoreContainer.style.display = "none";
      }
    }
  }

  // Toggle Like logic
  function toggleLike(reviewId) {
    let likedReviews = [];
    try {
      likedReviews = JSON.parse(localStorage.getItem("likedReviews") || "[]");
    } catch (e) {
      likedReviews = [];
    }

    let userReviews = [];
    try {
      userReviews = JSON.parse(localStorage.getItem("userReviews") || "[]");
    } catch (e) {
      userReviews = [];
    }

    const reviewIdx = userReviews.findIndex(r => r.id === reviewId);
    if (reviewIdx === -1) return;

    const isLiked = likedReviews.includes(reviewId);
    if (isLiked) {
      // Unlike
      userReviews[reviewIdx].likes = Math.max(0, (userReviews[reviewIdx].likes || 0) - 1);
      likedReviews = likedReviews.filter(id => id !== reviewId);
    } else {
      // Like
      userReviews[reviewIdx].likes = (userReviews[reviewIdx].likes || 0) + 1;
      likedReviews.push(reviewId);
    }

    localStorage.setItem("userReviews", JSON.stringify(userReviews));
    localStorage.setItem("likedReviews", JSON.stringify(likedReviews));

    // Sync in-memory public reviews
    publicReviews = userReviews.filter(r => r.isPublic === true);
    renderReviews();
  }

  // Handle Load More / Show Less click
  if (btnLoadMore) {
    btnLoadMore.addEventListener("click", () => {
      if (showAllReviews) {
        showAllReviews = false;
        renderReviews();
        reviewsGrid.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } else {
        showAllReviews = true;
        renderReviews();
      }
    });
  }

  // Handle Sort Select change
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      currentSort = e.target.value;
      renderReviews();
    });
  }

  // Handle Liking click delegation
  if (reviewsGrid) {
    reviewsGrid.addEventListener("click", (e) => {
      const likeBtn = e.target.closest(".like-btn");
      if (!likeBtn) return;
      const reviewId = likeBtn.getAttribute("data-id");
      toggleLike(reviewId);
    });
  }

  // Handle responsive resize to adjust 2-row limit dynamically
  let resizeTimer;
  window.addEventListener("resize", () => {
    if (showAllReviews || !reviewsGrid) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      renderReviews();
    }, 100);
  });

  initCommunityReviews();

  // ── Write Community Feedback Modal Handlers ───────────────────────
  const writeReviewModal = document.getElementById("write-review-modal");
  const btnOpenReviewModal = document.getElementById("btn-open-review-modal");
  const btnCloseReviewModal = document.getElementById("btn-close-review-modal");
  const formWriteReview = document.getElementById("form-write-review");
  const categorySelectEl = document.getElementById("rev-category");
  const wrapCustomCat = document.getElementById("wrap-custom-cat");
  const customCatInput = document.getElementById("rev-custom-category");
  const starPicker = document.getElementById("star-rating-picker");
  const ratingInput = document.getElementById("rev-rating");
  const ratingLabel = document.getElementById("rating-value-label");

  function isUserLoggedIn() {
    if (window.Auth && typeof window.Auth.isLoggedIn === "function") {
      return window.Auth.isLoggedIn();
    }
    const isLoggedOut = localStorage.getItem("userLoggedOut") === "true" || localStorage.getItem("isLoggedIn") === "false";
    if (isLoggedOut) return false;
    const user = localStorage.getItem("currentUser");
    return !!user;
  }

  function getLoggedInUser() {
    if (window.Auth && typeof window.Auth.getCurrentUser === "function") {
      return window.Auth.getCurrentUser();
    }
    try {
      return JSON.parse(localStorage.getItem("currentUser") || "null");
    } catch (e) {
      return null;
    }
  }

  function updateFeedbackFormFieldsState() {
    const isLoggedIn = isUserLoggedIn();
    const authNotice = document.getElementById("feedback-auth-notice");
    const titleInput = document.getElementById("rev-title");
    const categorySelect = document.getElementById("rev-category");
    const customCatInput = document.getElementById("rev-custom-category");
    const textInput = document.getElementById("rev-text");
    const submitBtn = document.querySelector("#form-write-review button[type='submit']") || document.querySelector(".submit-review-btn");
    const starItems = document.querySelectorAll("#star-rating-picker .star-item");

    if (!isLoggedIn) {
      if (authNotice) authNotice.style.display = "flex";
      if (titleInput) { titleInput.disabled = true; titleInput.placeholder = "Please sign in to submit your response"; }
      if (categorySelect) categorySelect.disabled = true;
      if (customCatInput) customCatInput.disabled = true;
      if (textInput) { textInput.disabled = true; textInput.placeholder = "Please sign in to submit your response"; }
      if (submitBtn) { submitBtn.disabled = true; submitBtn.style.opacity = "0.5"; submitBtn.style.cursor = "not-allowed"; }
      starItems.forEach(s => s.style.pointerEvents = "none");
    } else {
      if (authNotice) authNotice.style.display = "none";
      if (titleInput) { titleInput.disabled = false; titleInput.placeholder = "e.g. Insane quality on Ken Kaneki Tee!"; }
      if (categorySelect) categorySelect.disabled = false;
      if (customCatInput) customCatInput.disabled = false;
      if (textInput) { textInput.disabled = false; textInput.placeholder = "Tell us about the product quality, fit, shipping experience, or feature feedback..."; }
      if (submitBtn) { submitBtn.disabled = false; submitBtn.style.opacity = "1"; submitBtn.style.cursor = "pointer"; }
      starItems.forEach(s => s.style.pointerEvents = "auto");
    }
  }

  if (btnOpenReviewModal && writeReviewModal) {
    btnOpenReviewModal.addEventListener("click", () => {
      updateFeedbackFormFieldsState();
      writeReviewModal.classList.add("active");
    });
  }

  if (btnCloseReviewModal && writeReviewModal) {
    btnCloseReviewModal.addEventListener("click", () => {
      writeReviewModal.classList.remove("active");
    });

    writeReviewModal.addEventListener("click", (e) => {
      if (e.target === writeReviewModal) {
        writeReviewModal.classList.remove("active");
      }
    });
  }

  // Star Rating Picker Interactive Logic
  if (starPicker) {
    const stars = starPicker.querySelectorAll(".star-item");
    const labels = {
      1: "1 Star (Poor)",
      2: "2 Stars (Fair)",
      3: "3 Stars (Good)",
      4: "4 Stars (Very Good)",
      5: "5 Stars (Excellent)"
    };

    stars.forEach(star => {
      star.addEventListener("click", () => {
        const rating = parseInt(star.getAttribute("data-rating") || "5", 10);
        if (ratingInput) ratingInput.value = rating;
        if (ratingLabel) ratingLabel.textContent = labels[rating] || `${rating} Stars`;

        stars.forEach((s, idx) => {
          if (idx < rating) {
            s.classList.add("active");
          } else {
            s.classList.remove("active");
          }
        });
      });
    });
  }

  // Category Select -> Custom Category Input Reveal
  if (categorySelectEl && wrapCustomCat) {
    categorySelectEl.addEventListener("change", (e) => {
      if (e.target.value === "Custom") {
        wrapCustomCat.style.display = "block";
        if (customCatInput) customCatInput.required = true;
      } else {
        wrapCustomCat.style.display = "none";
        if (customCatInput) customCatInput.required = false;
      }
    });
  }

  function showCustomDialogue(title, message) {
    const dialogue = document.getElementById("feedback-success-dialogue");
    const titleEl = document.getElementById("dialogue-title");
    const msgEl = document.getElementById("dialogue-message");
    const closeBtn = document.getElementById("dialogue-close-btn");

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;

    if (dialogue) {
      dialogue.classList.add("active");

      const closeHandler = () => {
        dialogue.classList.remove("active");
        if (closeBtn) closeBtn.removeEventListener("click", closeHandler);
      };

      if (closeBtn) {
        closeBtn.removeEventListener("click", closeHandler);
        closeBtn.addEventListener("click", closeHandler);
      }
    }
  }

  // Feedback Form Submit Handler
  if (formWriteReview) {
    formWriteReview.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!isUserLoggedIn()) {
        showCustomDialogue("Sign In Required", "Please sign in to submit community feedback.");
        return;
      }

      const user = getLoggedInUser();
      const author = user ? (user.name || user.username || "Community Member") : "Community Member";
      const userEmail = user ? (user.email || "") : "";

      const rating = parseInt(document.getElementById("rev-rating")?.value || "5", 10);
      const title = document.getElementById("rev-title")?.value.trim() || "";
      const rawCategory = document.getElementById("rev-category")?.value || "None";
      let category = rawCategory;
      if (rawCategory === "Custom") {
        category = document.getElementById("rev-custom-category")?.value.trim() || "Custom";
      } else if (rawCategory === "None") {
        category = "General";
      }

      const text = document.getElementById("rev-text")?.value.trim() || "";

      if (!title || !text) {
        showCustomDialogue("Required Fields Missing", "Please fill out all required fields.");
        return;
      }

      const formattedDate = new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });

      const newReview = {
        id: "rev-" + Date.now(),
        author: author,
        email: userEmail,
        rating: rating,
        category: category,
        title: title,
        text: text,
        date: formattedDate,
        isPublic: true,
        likes: 0
      };

      // Post to Backend Database
      try {
        const res = await fetch("/api/community/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newReview)
        });
        if (res.ok) {
          const savedDbReview = await res.json();
          newReview.id = savedDbReview.id || newReview.id;
        }
      } catch (e) {
        console.warn("Backend API sync offline, using local storage fallback:", e);
      }

      let userReviews = [];
      try {
        userReviews = JSON.parse(localStorage.getItem("userReviews") || localStorage.getItem("user_reviews") || "[]");
      } catch (e) {
        userReviews = [];
      }

      userReviews.unshift(newReview);
      localStorage.setItem("userReviews", JSON.stringify(userReviews));
      localStorage.setItem("user_reviews", JSON.stringify(userReviews));

      publicReviews = userReviews.filter(r => r.isPublic !== false);
      renderReviews();

      formWriteReview.reset();
      if (wrapCustomCat) wrapCustomCat.style.display = "none";
      if (writeReviewModal) writeReviewModal.classList.remove("active");

      showCustomDialogue("Feedback Submitted!", `Thank you, ${author}! Your community feedback has been posted successfully and is now live.`);
    });
  }

  // --- Support & Donation Box Logic ---
  const donationForm = document.getElementById("donation-form");
  const customAmountWrapper = document.getElementById("custom-amount-wrapper");
  const customAmountInput = document.getElementById("custom-amount");
  const inputCurrencySymbol = document.getElementById("input-currency-symbol");

  // Currency Selector
  const currencySelect = document.getElementById("currency-select");

  let currentCurrency = "USD";
  const usdToInrRate = 85;
  let selectedAmount = 1; // Default starting amount is 1
  let isCustomActive = false;

  // Dynamic Presets Render
  function renderPresets() {
    const grid = document.getElementById("donation-tiers-grid");
    if (!grid) return;

    const usdPresets = [1, 5, 10, 25];
    const inrPresets = [50, 100, 250, 500];
    const presets = currentCurrency === "USD" ? usdPresets : inrPresets;
    const symbol = currentCurrency === "USD" ? "$" : "₹";

    let html = "";
    presets.forEach(amount => {
      const activeClass = (!isCustomActive && selectedAmount === amount) ? "active-tier" : "";
      html += `<button type="button" class="tier-btn ${activeClass}" data-amount="${amount}">${symbol}${amount}</button>`;
    });

    const customActiveClass = isCustomActive ? "active-tier" : "";
    html += `<button type="button" class="tier-btn ${customActiveClass}" id="custom-tier-btn" data-amount="custom">Custom</button>`;

    grid.innerHTML = html;

    // Attach listeners
    const tierBtns = grid.querySelectorAll(".tier-btn");
    tierBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        tierBtns.forEach(b => b.classList.remove("active-tier"));
        btn.classList.add("active-tier");

        const amountVal = btn.getAttribute("data-amount");
        if (amountVal === "custom") {
          isCustomActive = true;
          if (customAmountWrapper) customAmountWrapper.style.display = "flex";
          if (customAmountInput) customAmountInput.focus();
          selectedAmount = parseFloat(customAmountInput.value) || 0;
        } else {
          isCustomActive = false;
          if (customAmountWrapper) customAmountWrapper.style.display = "none";
          selectedAmount = parseFloat(amountVal);
        }
      });
    });
  }

  // Handle Currency Dropdown Changes
  if (currencySelect) {
    currencySelect.addEventListener("change", (e) => {
      const oldCurrency = currentCurrency;
      currentCurrency = e.target.value;

      // Update Custom Amount Prefix Symbol
      if (inputCurrencySymbol) {
        inputCurrencySymbol.textContent = currentCurrency === "USD" ? "$" : "₹";
      }

      // Convert selected amount if custom or switch to default preset
      if (isCustomActive) {
        let val = parseFloat(customAmountInput.value) || 0;
        if (oldCurrency === "USD" && currentCurrency === "INR") {
          val = Math.round(val * usdToInrRate);
        } else if (oldCurrency === "INR" && currentCurrency === "USD") {
          val = Math.round(val / usdToInrRate);
        }
        if (customAmountInput) customAmountInput.value = val;
        selectedAmount = val;
      } else {
        selectedAmount = currentCurrency === "USD" ? 1 : 50;
      }

      renderPresets();
    });
  }

  // Handle Custom Amount Input typing
  if (customAmountInput) {
    customAmountInput.addEventListener("input", (e) => {
      let val = parseFloat(e.target.value);
      if (isNaN(val) || val < 1) {
        selectedAmount = 0;
      } else {
        selectedAmount = val;
      }
    });
  }

  // Handle Form Submission -> Navigate directly to checkout payment page
  if (donationForm) {
    donationForm.addEventListener("submit", (e) => {
      e.preventDefault();

      if (selectedAmount <= 0) {
        alert("Please enter or select a valid donation amount.");
        return;
      }

      const nameInput = document.getElementById("donor-name");
      const emailInput = document.getElementById("donor-email");
      const messageInput = document.getElementById("donor-message");

      if (nameInput && !nameInput.checkValidity()) {
        nameInput.reportValidity();
        return;
      }
      if (emailInput && !emailInput.checkValidity()) {
        emailInput.reportValidity();
        return;
      }

      const donorNameVal = nameInput ? nameInput.value.trim() : "";
      const donorEmailVal = emailInput ? emailInput.value.trim() : "";
      const donorMessageVal = messageInput ? messageInput.value.trim() : "";

      const donationItem = {
        id: "donation-" + Date.now(),
        name: `Community Support Donation${donorNameVal ? ' - ' + donorNameVal : ''}`,
        price: selectedAmount,
        originalPrice: selectedAmount,
        displayPriceFormatted: currentCurrency === 'USD' ? `$${selectedAmount}` : `₹${selectedAmount}`,
        quantity: 1,
        img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp",
        type: "digital",
        isDonation: true,
        currency: currentCurrency,
        originalAmount: selectedAmount,
        donorName: donorNameVal,
        donorEmail: donorEmailVal,
        donorMessage: donorMessageVal
      };

      // Set shoppingCart to contain this donation item for store checkout page
      localStorage.setItem("shoppingCart", JSON.stringify([donationItem]));

      // Redirect directly to store payment page (checkout.html)
      window.location.href = "checkout.html";
    });
  }

  // Run initialization
  renderPresets();
});


