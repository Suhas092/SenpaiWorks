"use strict";

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const form = document.getElementById("feedback-edit-form");
  const nameInput = document.getElementById("feedback-name");
  const emailInput = document.getElementById("feedback-email");
  const categorySelect = document.getElementById("feedback-category");
  const orderIdInput = document.getElementById("feedback-order-id");
  const titleInput = document.getElementById("feedback-title");
  const commentInput = document.getElementById("feedback-comment");
  const publicCheckbox = document.getElementById("feedback-public-checkbox");
  const errorEl = document.getElementById("feedback-error");
  const successState = document.getElementById("feedback-success-state");

  const starsRow = document.getElementById("stars-row");
  const stars = document.querySelectorAll(".rating-star");
  const ratingLabel = document.getElementById("rating-label");

  let selectedRating = 0;

  const descriptors = {
    1: "Hated it (1/5)",
    2: "Disliked it (2/5)",
    3: "It's okay (3/5)",
    4: "Liked it (4/5)",
    5: "Loved it (5/5)"
  };

  // 1. Populate User Credentials
  function loadUserCredentials() {
    let currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      currentUser = JSON.parse(currentUser);
      if (nameInput) nameInput.value = currentUser.name || currentUser.username || "";
      if (emailInput) emailInput.value = currentUser.email || "";
    }
  }

  loadUserCredentials();

  // 2. Read URL Query Parameters
  function parseQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("orderId");
    const itemId = params.get("itemId");
    const itemName = params.get("itemName");

    if (orderId && orderIdInput) {
      orderIdInput.value = orderId;
    }
    if (orderId && categorySelect) {
      categorySelect.value = "Order Issue";
    }
    if (itemName && titleInput) {
      titleInput.value = `Feedback on: ${itemName}`;
    }
  }

  parseQueryParams();

  // 3. Stars Interaction Logic
  if (starsRow) {
    stars.forEach(star => {
      // Hover In
      star.addEventListener("mouseover", () => {
        const rating = parseInt(star.getAttribute("data-rating"));
        highlightStars(rating);
        if (ratingLabel) ratingLabel.textContent = descriptors[rating] || "Select a rating";
      });

      // Click select
      star.addEventListener("click", () => {
        selectedRating = parseInt(star.getAttribute("data-rating"));
        applySelectedRating();
      });
    });

    // Hover Out - restore selected state
    starsRow.addEventListener("mouseleave", () => {
      applySelectedRating();
    });
  }

  function highlightStars(count) {
    stars.forEach(star => {
      const rating = parseInt(star.getAttribute("data-rating"));
      if (rating <= count) {
        star.classList.add("active");
        star.className = "fa-solid fa-star rating-star active";
      } else {
        star.classList.remove("active");
        star.className = "fa-regular fa-star rating-star";
      }
    });
  }

  function applySelectedRating() {
    stars.forEach(star => {
      const rating = parseInt(star.getAttribute("data-rating"));
      if (rating <= selectedRating) {
        star.classList.add("selected");
        star.className = "fa-solid fa-star rating-star selected";
      } else {
        star.classList.remove("selected");
        star.className = "fa-regular fa-star rating-star";
      }
    });

    if (ratingLabel) {
      ratingLabel.textContent = descriptors[selectedRating] || "Select a rating";
    }
  }

  // 4. Form Submit
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const doSubmitReview = () => {
        if (errorEl) {
          errorEl.style.display = "none";
        }

        if (selectedRating === 0) {
          if (errorEl) {
            errorEl.textContent = "Please select a star rating before submitting.";
            errorEl.style.display = "block";
          }
          return;
        }

        const nameVal = nameInput.value.trim();
        const emailVal = emailInput.value.trim();
        const categoryVal = categorySelect.value;
        const orderIdVal = orderIdInput.value.trim();
        const titleVal = titleInput.value.trim();
        const commentVal = commentInput.value.trim();
        const isPublicVal = publicCheckbox ? publicCheckbox.checked : true;

        const reviewObject = {
          id: "rev-" + Date.now(),
          author: nameVal,
          rating: selectedRating,
          category: categoryVal,
          orderId: orderIdVal || null,
          title: titleVal,
          text: commentVal,
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          isPublic: isPublicVal,
          helpfulCount: 0,
          status: "Pending",
          admin_reply: null,
          internal_notes: null,
          priority: null
        };

        // Save to userReviews list in localStorage
        let userReviews = localStorage.getItem("userReviews");
        userReviews = userReviews ? JSON.parse(userReviews) : [];
        userReviews.unshift(reviewObject);
        localStorage.setItem("userReviews", JSON.stringify(userReviews));

        // Reset Form & Show Success Modal
        form.reset();
        selectedRating = 0;
        applySelectedRating();

        if (successState) {
          successState.style.display = "flex";
        }
      };

      if (window.checkAuthOrPrompt) {
        window.checkAuthOrPrompt("write a review", doSubmitReview);
      } else {
        doSubmitReview();
      }
    });
  }
});
