"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const reviewsGrid = document.getElementById("community-reviews-grid");
  const loadMoreContainer = document.getElementById("load-more-container");
  const btnLoadMore = document.getElementById("btn-load-more");
  const sortSelect = document.getElementById("reviews-sort-select");

  let showAllReviews = false;
  let publicReviews = [];
  let currentSort = "newest";

  function initCommunityReviews() {
    if (!reviewsGrid) return;

    let userReviews = localStorage.getItem("userReviews");
    let reviewsList = [];
    if (userReviews) {
      try {
        reviewsList = JSON.parse(userReviews) || [];
      } catch (e) {
        reviewsList = [];
      }
    }

    // Preserve custom reviews (id not starting with "rev-seed-")
    const customReviews = reviewsList.filter(r => r && r.id && !r.id.startsWith("rev-seed-"));

    const seedReviews = [
      {
        id: "rev-seed-1",
        author: "ZoroFan42",
        rating: 5,
        category: "Order Issue",
        title: "Incredible print quality!",
        text: "The green contrast on the Zoro poster is even more vibrant in person. Paper feels very premium and looks great in a frame. Arrived safely in a solid packaging tube.",
        date: "July 10, 2026",
        isPublic: true,
        likes: 24
      },
      {
        id: "rev-seed-2",
        author: "RigArtist",
        rating: 5,
        category: "3D Character Rig",
        title: "Perfect blender rig!",
        text: "Excellent topology and weight painting on the Suzens model. Rigify skeleton mapping works like a charm. Saved me days of rigging work. Recommended!",
        date: "July 08, 2026",
        isPublic: true,
        likes: 15
      },
      {
        id: "rev-seed-3",
        author: "BrushesPro",
        rating: 4,
        category: "Brushes & Textures",
        title: "Super clean brushes",
        text: "Nice digital painting brushes and template guidelines. The oil presets feel very natural in Photoshop. Great asset pack for digital painters.",
        date: "July 05, 2026",
        isPublic: true,
        likes: 8
      },
      {
        id: "rev-seed-4",
        author: "BlenderNewbie",
        rating: 4,
        category: "3D Character Rig",
        title: "Fun to animate",
        text: "Stretching and bending features are highly expressive. A few minor weight painting artifacts near the shoulder, but overall a great tool for practice.",
        date: "July 03, 2026",
        isPublic: true,
        likes: 19
      },
      {
        id: "rev-seed-5",
        author: "DevSora",
        rating: 5,
        category: "General Website",
        title: "Smooth website UI",
        text: "The donation page micro-animations and confetti effects are beautiful. Navigation is fast, and responsive designs make it a joy to use on mobile.",
        date: "June 29, 2026",
        isPublic: true,
        likes: 42
      },
      {
        id: "rev-seed-6",
        author: "SketchLover",
        rating: 5,
        category: "Brushes & Textures",
        title: "Saved me so much time",
        text: "Excellent texture resolution and crosshatch brushes. Fits my retro manga art style perfectly. Worth every single cent!",
        date: "June 25, 2026",
        isPublic: true,
        likes: 31
      },
      {
        id: "rev-seed-7",
        author: "NamiSticker",
        rating: 4,
        category: "Order Issue",
        title: "Slow delivery but great product",
        text: "Shipping took an extra week, but the support team was very responsive. The sticker pack quality is phenomenal and waterproof.",
        date: "June 22, 2026",
        isPublic: true,
        likes: 5
      },
      {
        id: "rev-seed-8",
        author: "WebDevPro",
        rating: 5,
        category: "Other",
        title: "Great developer assets",
        text: "The procedural shader collection is fantastic. Extremely optimized code and clean nodes inside Blender.",
        date: "June 18, 2026",
        isPublic: true,
        likes: 12
      },
      {
        id: "rev-seed-9",
        author: "AnimeCollector",
        rating: 5,
        category: "Order Issue",
        title: "Collector's dream!",
        text: "Stunning colors and ultra-heavy paper weight. Matches the photos exactly. Packaged with extreme care. Will buy again!",
        date: "June 15, 2026",
        isPublic: true,
        likes: 3
      }
    ];

    const combinedReviews = [...customReviews, ...seedReviews];
    localStorage.setItem("userReviews", JSON.stringify(combinedReviews));

    publicReviews = combinedReviews.filter(r => r.isPublic === true);
    renderReviews();
  }

  function renderReviews() {
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

  // --- Support & Donation Box Logic ---
  const donationForm = document.getElementById("donation-form");
  const donationFormWrapper = document.getElementById("donation-form-wrapper");
  const donationSuccessState = document.getElementById("donation-success-state");
  const customAmountWrapper = document.getElementById("custom-amount-wrapper");
  const customAmountInput = document.getElementById("custom-amount");
  const inputCurrencySymbol = document.getElementById("input-currency-symbol");
  const goalProgressText = document.getElementById("goal-progress-text");
  const goalProgressFill = document.getElementById("goal-progress-fill");

  const successDonorName = document.getElementById("success-donor-name");
  const successDonationAmount = document.getElementById("success-donation-amount");
  const successDonorMessage = document.getElementById("success-donor-message");
  const successDonorEmail = document.getElementById("success-donor-email");
  const resetDonationBtn = document.getElementById("reset-donation-btn");

  // Step Elements
  const stepDetails = document.getElementById("donation-step-details");
  const stepPayment = document.getElementById("donation-step-payment");
  const btnProceedToPayment = document.getElementById("btn-proceed-to-payment");
  const btnBackToDetails = document.getElementById("btn-back-to-details");
  const donationSubmitBtn = document.getElementById("donation-submit-btn");

  // Payment Toggle Elements
  const paymentMethodBtns = document.querySelectorAll(".payment-method-btn");
  const paymentFieldsCard = document.getElementById("payment-fields-card");
  const paymentFieldsPaypal = document.getElementById("payment-fields-paypal");
  const cardNumInput = document.getElementById("card-num");
  const cardExpiryInput = document.getElementById("card-expiry");
  const cardCvvInput = document.getElementById("card-cvv");

  // Currency Selector
  const currencySelect = document.getElementById("currency-select");

  let currentCurrency = "USD";
  const usdToInrRate = 85;
  let selectedAmount = 1; // Default starting amount is 1
  let isCustomActive = false;
  let selectedMethod = "card";
  const goalTarget = 1500; // stored in USD

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
          customAmountWrapper.style.display = "flex";
          customAmountInput.focus();
          selectedAmount = parseFloat(customAmountInput.value) || 0;
        } else {
          isCustomActive = false;
          customAmountWrapper.style.display = "none";
          selectedAmount = parseFloat(amountVal);
        }
        updateButtonTexts();
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
        customAmountInput.value = val;
        selectedAmount = val;
      } else {
        // Default presets switch
        selectedAmount = currentCurrency === "USD" ? 1 : 50;
      }

      // Re-render presets
      renderPresets();

      // Update goal progression displays
      let usdTotal = parseFloat(localStorage.getItem("donationTotal")) || 1150;
      updateGoalUI(usdTotal);

      updateButtonTexts();
    });
  }

  // Goal Progression Tracker
  function initDonationGoal() {
    let currentTotal = localStorage.getItem("donationTotal");
    if (currentTotal === null) {
      currentTotal = 1150; // default seed USD
      localStorage.setItem("donationTotal", currentTotal);
    } else {
      currentTotal = parseFloat(currentTotal);
    }
    updateGoalUI(currentTotal);
  }

  function updateGoalUI(usdTotal) {
    if (!goalProgressText || !goalProgressFill) return;

    let displayTotal, displayTarget;
    if (currentCurrency === "USD") {
      displayTotal = usdTotal;
      displayTarget = goalTarget;
    } else {
      displayTotal = usdTotal * usdToInrRate;
      displayTarget = goalTarget * usdToInrRate;
    }

    const symbol = currentCurrency === "USD" ? "$" : "₹";
    const formattedTotal = symbol + displayTotal.toLocaleString('en-US', { maximumFractionDigits: 0 });
    const formattedTarget = symbol + displayTarget.toLocaleString('en-US', { maximumFractionDigits: 0 });

    goalProgressText.textContent = `${formattedTotal} / ${formattedTarget}`;

    const percentage = Math.min(100, (usdTotal / goalTarget) * 100);
    setTimeout(() => {
      goalProgressFill.style.width = `${percentage}%`;
    }, 100);
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
      updateButtonTexts();
    });
  }

  // Format currency value helper
  function formatAmount(amount) {
    const symbol = currentCurrency === "USD" ? "$" : "₹";
    return symbol + amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  function updateButtonTexts() {
    if (btnProceedToPayment) {
      const textSpan = btnProceedToPayment.querySelector(".btn-text");
      if (textSpan) {
        if (selectedAmount > 0) {
          textSpan.textContent = "Donate";
          btnProceedToPayment.disabled = false;
        } else {
          textSpan.textContent = "Enter Valid Amount";
          btnProceedToPayment.disabled = true;
        }
      }
    }
    if (donationSubmitBtn) {
      const textSpan = donationSubmitBtn.querySelector(".btn-text");
      if (textSpan) {
        if (selectedAmount > 0) {
          textSpan.textContent = "Complete Support";
          donationSubmitBtn.disabled = false;
        } else {
          textSpan.textContent = "Complete Support";
          donationSubmitBtn.disabled = true;
        }
      }
    }
  }

  // Step 1 navigation: Proceed to payment
  if (btnProceedToPayment) {
    btnProceedToPayment.addEventListener("click", () => {
      // Validate step 1 fields
      const nameField = document.getElementById("donor-name");
      const emailField = document.getElementById("donor-email");

      if (selectedAmount <= 0) {
        alert("Please enter or select a valid amount.");
        return;
      }

      if (!nameField.checkValidity()) {
        nameField.reportValidity();
        return;
      }

      if (!emailField.checkValidity()) {
        emailField.reportValidity();
        return;
      }

      // If valid, transit step
      stepDetails.style.opacity = "0";
      setTimeout(() => {
        stepDetails.style.display = "none";
        stepPayment.style.display = "block";
        stepPayment.style.opacity = "0";
        stepPayment.offsetHeight; // reflow
        stepPayment.style.opacity = "1";
      }, 300);
    });
  }

  // Step 2 navigation: Back to details
  if (btnBackToDetails) {
    btnBackToDetails.addEventListener("click", () => {
      stepPayment.style.opacity = "0";
      setTimeout(() => {
        stepPayment.style.display = "none";
        stepDetails.style.display = "block";
        stepDetails.style.opacity = "0";
        stepDetails.offsetHeight; // reflow
        stepDetails.style.opacity = "1";
      }, 300);
    });
  }

  // Payment Method Selection
  paymentMethodBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      paymentMethodBtns.forEach(b => b.classList.remove("active-payment"));
      btn.classList.add("active-payment");
      selectedMethod = btn.getAttribute("data-method");

      // Show/Hide Fields
      if (selectedMethod === "card") {
        paymentFieldsCard.style.display = "block";
        paymentFieldsPaypal.style.display = "none";
        cardNumInput.required = true;
        cardExpiryInput.required = true;
        cardCvvInput.required = true;
      } else {
        paymentFieldsCard.style.display = "none";
        paymentFieldsPaypal.style.display = "block";
        cardNumInput.required = false;
        cardExpiryInput.required = false;
        cardCvvInput.required = false;
      }
    });
  });

  // Helper formatting for Card Inputs (Auto-spaces card, auto-slash expiry)
  if (cardNumInput) {
    cardNumInput.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "");
      let formatted = value.match(/.{1,4}/g);
      e.target.value = formatted ? formatted.join(" ") : "";
    });
  }

  if (cardExpiryInput) {
    cardExpiryInput.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "");
      if (value.length > 2) {
        e.target.value = value.substring(0, 2) + "/" + value.substring(2, 4);
      } else {
        e.target.value = value;
      }
    });
  }

  if (cardCvvInput) {
    cardCvvInput.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "");
    });
  }

  // Handle Form Submission (Complete Support)
  if (donationForm) {
    donationForm.addEventListener("submit", (e) => {
      e.preventDefault();

      // Double check amount and payment inputs validity
      if (selectedAmount <= 0) {
        alert("Please enter a valid donation amount.");
        return;
      }

      if (selectedMethod === "card") {
        if (!cardNumInput.checkValidity()) { cardNumInput.reportValidity(); return; }
        if (!cardExpiryInput.checkValidity()) { cardExpiryInput.reportValidity(); return; }
        if (!cardCvvInput.checkValidity()) { cardCvvInput.reportValidity(); return; }
      }

      // Convert donated amount to USD if it was INR before writing to localStorage
      const donatedUsd = currentCurrency === "USD" ? selectedAmount : (selectedAmount / usdToInrRate);

      // Add to Total in LocalStorage
      let currentUsdTotal = parseFloat(localStorage.getItem("donationTotal")) || 1150;
      currentUsdTotal += donatedUsd;
      localStorage.setItem("donationTotal", currentUsdTotal);

      // Update UI displays
      updateGoalUI(currentUsdTotal);

      // Populate Success Details
      const donorName = document.getElementById("donor-name").value.trim() || "Anonymous Supporter";
      const donorEmail = document.getElementById("donor-email").value.trim();
      const donorMessageVal = document.getElementById("donor-message").value.trim();

      if (successDonorName) successDonorName.textContent = donorName;
      if (successDonationAmount) {
        const symbol = currentCurrency === "USD" ? "$" : "₹";
        successDonationAmount.textContent = symbol + selectedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
      if (successDonorEmail) successDonorEmail.textContent = donorEmail;

      if (successDonorMessage) {
        if (donorMessageVal) {
          successDonorMessage.parentNode.style.display = "block";
          successDonorMessage.textContent = `"${donorMessageVal}"`;
        } else {
          successDonorMessage.parentNode.style.display = "none";
        }
      }

      // Animate transition to success
      donationFormWrapper.style.opacity = "0";
      setTimeout(() => {
        donationFormWrapper.style.display = "none";
        donationSuccessState.style.display = "block";
        donationSuccessState.style.opacity = "0";
        donationSuccessState.offsetHeight; // reflow
        donationSuccessState.style.opacity = "1";

        // Confetti burst
        createConfetti();
      }, 300);
    });
  }

  // Reset / Donate again click handler
  if (resetDonationBtn) {
    resetDonationBtn.addEventListener("click", () => {
      donationForm.reset();

      // Reset values
      currentCurrency = "USD";
      if (currencySelect) currencySelect.value = "USD";
      if (inputCurrencySymbol) inputCurrencySymbol.textContent = "$";
      selectedAmount = 1;
      isCustomActive = false;
      selectedMethod = "card";

      // Reset card selection states
      paymentMethodBtns.forEach(b => b.classList.remove("active-payment"));
      const defaultPayment = document.querySelector('.payment-method-btn[data-method="card"]');
      if (defaultPayment) defaultPayment.classList.add("active-payment");

      paymentFieldsCard.style.display = "block";
      paymentFieldsPaypal.style.display = "none";

      customAmountWrapper.style.display = "none";

      renderPresets();
      updateButtonTexts();

      // Reset Step Layouts back to details
      stepPayment.style.display = "none";
      stepDetails.style.display = "block";
      stepDetails.style.opacity = "1";

      // Animate back transition
      donationSuccessState.style.opacity = "0";
      setTimeout(() => {
        donationSuccessState.style.display = "none";
        donationFormWrapper.style.display = "block";
        donationFormWrapper.style.opacity = "0";
        donationFormWrapper.offsetHeight; // reflow
        donationFormWrapper.style.opacity = "1";

        // Sync Goal values
        let usdTotal = parseFloat(localStorage.getItem("donationTotal")) || 1150;
        updateGoalUI(usdTotal);
      }, 300);
    });
  }

  // Confetti bursts
  function createConfetti() {
    const colors = ["#0066cc", "#00d2ff", "#ff424d", "#ffd700", "#10b981"];
    const container = document.getElementById("donation-container");
    if (!container) return;

    for (let i = 0; i < 40; i++) {
      const confetti = document.createElement("div");
      confetti.style.position = "absolute";
      confetti.style.width = `${Math.random() * 8 + 6}px`;
      confetti.style.height = `${Math.random() * 8 + 6}px`;
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.borderRadius = Math.random() > 0.5 ? "50%" : "0";
      confetti.style.top = "100%";
      confetti.style.left = `${Math.random() * 90 + 5}%`;
      confetti.style.opacity = "1";
      confetti.style.pointerEvents = "none";
      confetti.style.zIndex = "10";

      container.appendChild(confetti);

      const animation = confetti.animate([
        { transform: "translate3d(0, 0, 0) rotate(0deg)", opacity: 1 },
        { transform: `translate3d(${(Math.random() - 0.5) * 150}px, -${Math.random() * 250 + 150}px, 0) rotate(${Math.random() * 360}deg)`, opacity: 0 }
      ], {
        duration: Math.random() * 1500 + 1000,
        easing: "cubic-bezier(0.1, 0.8, 0.3, 1)"
      });

      animation.onfinish = () => confetti.remove();
    }
  }

  // Run initialization
  renderPresets();
  updateButtonTexts();
  initDonationGoal();
});
