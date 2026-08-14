"use strict";

let selectedStarRating = 5;
let rawCropperImage = null;
let currentZoom = 1;

document.addEventListener("DOMContentLoaded", () => {
  initAccountCenter();

  // Watch for storage changes to sync wishlist tab
  window.addEventListener("storage", (e) => {
    if (e.key === "userWishlist" && window.location.hash === "#wishlist") {
      loadWishlistGrid();
    }
  });
});

function getCurrentUser() {
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

function initAccountCenter() {
  if (window.Auth) {
    if (!window.Auth.requireAuth("profile.html")) return;
  } else {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      window.location.href = "login.html?redirect=profile.html";
      return;
    }
  }

  loadUserProfileData();
  setupAvatarUpload();
  setupFormHandlers();
  setupStarPicker();
  loadFeedbackHistory();
  loadNotificationsInbox();
  loadWishlistGrid();
  loadSavedAddresses();
  setupCropZoom();
  setupSignoutModalListeners();

  // Check URL hash tab parameter (e.g. #orders, #feedback, #notifications)
  const hash = window.location.hash.replace("#", "");
  if (hash && ["profile", "orders", "feedback", "notifications", "addresses", "wishlist", "payments", "security"].includes(hash)) {
    switchAccountTab(hash);
  } else {
    switchAccountTab("profile");
  }
}

function setupSignoutModalListeners() {
  const signoutModal = document.getElementById("signout-modal");
  const cancelBtn = document.getElementById("signout-cancel-btn");
  const confirmBtn = document.getElementById("signout-confirm-btn");

  if (cancelBtn && signoutModal) {
    cancelBtn.onclick = () => {
      signoutModal.classList.remove("active");
    };
  }

  if (confirmBtn) {
    confirmBtn.onclick = () => {
      if (window.Auth) {
        window.Auth.logout("home.html");
      } else {
        localStorage.removeItem("currentUser");
        localStorage.setItem("userLoggedOut", "true");
        localStorage.setItem("isLoggedIn", "false");
        sessionStorage.clear();
        window.location.href = "home.html";
      }
    };
  }
}

// 1. SIGN OUT HANDLER
window.handleSignOut = function () {
  const signoutModal = document.getElementById("signout-modal");
  if (signoutModal) {
    signoutModal.classList.add("active");
  } else {
    if (window.Auth) {
      window.Auth.logout("home.html");
    } else {
      localStorage.removeItem("currentUser");
      localStorage.setItem("userLoggedOut", "true");
      localStorage.setItem("isLoggedIn", "false");
      sessionStorage.clear();
      window.location.href = "home.html";
    }
  }
};

// 2. SWITCH ACCOUNT TAB
window.switchAccountTab = function (tabName) {
  const navBtns = document.querySelectorAll(".account-nav-btn");
  navBtns.forEach(btn => {
    if (btn.getAttribute("data-tab") === tabName) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  const panels = document.querySelectorAll(".account-tab-panel");
  panels.forEach(panel => {
    if (panel.id === `tab-panel-${tabName}`) {
      panel.classList.add("active");
    } else {
      panel.classList.remove("active");
    }
  });

  if (tabName === "orders" && window.filterOrders) {
    window.filterOrders("all");
  }

  if (tabName === "wishlist") {
    if (window.clearWishlistHighlight) {
      window.clearWishlistHighlight();
    } else {
      localStorage.setItem("wishlist_has_unseen_items", "false");
      window.dispatchEvent(new Event("wishlistUpdated"));
    }
  }

  if (history.pushState) {
    history.pushState(null, null, `#${tabName}`);
  } else {
    window.location.hash = `#${tabName}`;
  }
};

// 3. LOAD USER PROFILE DATA
function loadUserProfileData() {
  const currentUser = getCurrentUser();

  const bannerName = document.getElementById("acc-banner-name");
  const bannerEmail = document.getElementById("acc-banner-email");
  const bannerAvatar = document.getElementById("acc-banner-avatar");

  if (!currentUser) {
    if (bannerName) bannerName.textContent = "Guest User";
    if (bannerEmail) bannerEmail.textContent = "";
    if (bannerAvatar) bannerAvatar.src = "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp";
    return;
  }

  if (bannerName) bannerName.textContent = currentUser.name || currentUser.firstName || "Member";
  if (bannerEmail) bannerEmail.textContent = currentUser.email || "";
  if (bannerAvatar && currentUser.avatar) bannerAvatar.src = currentUser.avatar;

  const firstnameInput = document.getElementById("profile-firstname");
  const lastnameInput = document.getElementById("profile-lastname");
  const emailInput = document.getElementById("profile-email");
  const phoneInput = document.getElementById("profile-phone");
  const avatarPreview = document.getElementById("profile-avatar-preview");

  let fName = currentUser.firstName || "";
  let lName = currentUser.lastName || "";
  if (!fName && currentUser.name) {
    const nameParts = currentUser.name.trim().split(" ");
    fName = nameParts[0] || "";
    lName = nameParts.slice(1).join(" ") || "";
  }

  const countryCodeSelect = document.getElementById("profile-country-code");
  if (firstnameInput) firstnameInput.value = fName;
  if (lastnameInput) lastnameInput.value = lName;
  if (emailInput) emailInput.value = currentUser.email || "";
  if (countryCodeSelect && currentUser.countryCode) countryCodeSelect.value = currentUser.countryCode;
  if (phoneInput) phoneInput.value = currentUser.phone ? currentUser.phone.replace(/\D/g, "").slice(0, 10) : "";
  if (avatarPreview && currentUser.avatar) avatarPreview.src = currentUser.avatar;

  // Social Auth Check: Hide password section for Google / Facebook users
  const passWrapper = document.getElementById("profile-password-wrapper");
  const socialBanner = document.getElementById("profile-social-auth-banner");
  const socialBannerText = document.getElementById("social-auth-banner-text");

  if (currentUser.provider === "google" || currentUser.provider === "facebook") {
    if (passWrapper) passWrapper.style.display = "none";
    if (socialBanner) socialBanner.style.display = "block";
    if (socialBannerText) {
      const providerName = currentUser.provider === "google" ? "Google" : "Facebook";
      socialBannerText.textContent = `Account authenticated via ${providerName} (Password managed by provider)`;
    }
  } else {
    if (passWrapper) passWrapper.style.display = "block";
    if (socialBanner) socialBanner.style.display = "none";
  }

  if (currentUser.avatar) {
    const existingImg = new Image();
    existingImg.onload = () => {
      rawCropperImage = existingImg;
    };
    existingImg.src = currentUser.avatar;
  }
}

// 4. AVATAR UPLOAD & RE-EDIT CROP MODAL
function setupAvatarUpload() {
  const uploadBtn = document.getElementById("avatar-upload-trigger");
  const avatarImageTrigger = document.getElementById("avatar-preview-trigger");
  const fileInput = document.getElementById("profile-avatar-file");

  // 1. "Upload Photo" button ALWAYS opens device gallery / file browser
  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      fileInput.click();
    });
  }

  // 2. Clicking avatar image / "Edit" overlay re-opens crop modal for existing image
  if (avatarImageTrigger) {
    avatarImageTrigger.style.cursor = "pointer";
    avatarImageTrigger.addEventListener("click", () => {
      if (rawCropperImage) {
        openCropModal();
        drawCropCanvas();
      } else if (fileInput) {
        fileInput.click();
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // 3MB FILE SIZE LIMIT CHECK
      const maxSizeBytes = 3 * 1024 * 1024; // 3 MB
      if (file.size > maxSizeBytes) {
        alert("File size exceeds 3MB limit!\nPlease select an image file smaller than 3MB.");
        fileInput.value = "";
        return;
      }

      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file (JPG, PNG, or WebP).");
        fileInput.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          rawCropperImage = img;
          resetCropOffsets();
          const range = document.getElementById("crop-zoom-range");
          if (range) range.value = 1;
          openCropModal();
          drawCropCanvas();
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }
}

function openCropModal() {
  const modal = document.getElementById("crop-avatar-modal");
  if (modal) modal.classList.add("active");
}

window.closeCropModal = function () {
  const modal = document.getElementById("crop-avatar-modal");
  if (modal) modal.classList.remove("active");
  const fileInput = document.getElementById("profile-avatar-file");
  if (fileInput) fileInput.value = "";
};

let cropOffsetX = 0;
let cropOffsetY = 0;
let isDraggingCrop = false;
let dragStartX = 0;
let dragStartY = 0;

window.stepCropZoom = function (delta) {
  const range = document.getElementById("crop-zoom-range");
  currentZoom = Math.min(4, Math.max(1, currentZoom + delta));
  if (range) range.value = currentZoom;
  drawCropCanvas();
};

function setupCropZoom() {
  const range = document.getElementById("crop-zoom-range");
  if (range) {
    range.addEventListener("input", (e) => {
      currentZoom = parseFloat(e.target.value);
      drawCropCanvas();
    });
  }
  setupCropCanvasListeners();
}

function setupCropCanvasListeners() {
  const canvas = document.getElementById("crop-canvas");
  if (!canvas) return;

  canvas.addEventListener("mousedown", (e) => {
    isDraggingCrop = true;
    dragStartX = e.clientX - cropOffsetX;
    dragStartY = e.clientY - cropOffsetY;
    canvas.style.cursor = "grabbing";
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDraggingCrop) return;
    cropOffsetX = e.clientX - dragStartX;
    cropOffsetY = e.clientY - dragStartY;
    drawCropCanvas();
  });

  window.addEventListener("mouseup", () => {
    if (isDraggingCrop) {
      isDraggingCrop = false;
      const cvs = document.getElementById("crop-canvas");
      if (cvs) cvs.style.cursor = "grab";
    }
  });

  canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      isDraggingCrop = true;
      dragStartX = e.touches[0].clientX - cropOffsetX;
      dragStartY = e.touches[0].clientY - cropOffsetY;
    }
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    if (isDraggingCrop && e.touches.length === 1) {
      cropOffsetX = e.touches[0].clientX - dragStartX;
      cropOffsetY = e.touches[0].clientY - dragStartY;
      drawCropCanvas();
    }
  }, { passive: true });

  canvas.addEventListener("touchend", () => {
    isDraggingCrop = false;
  });

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const range = document.getElementById("crop-zoom-range");
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    currentZoom = Math.min(4, Math.max(1, currentZoom + delta));
    if (range) range.value = currentZoom;
    drawCropCanvas();
  }, { passive: false });
}

function resetCropOffsets() {
  cropOffsetX = 0;
  cropOffsetY = 0;
  currentZoom = 1;
}

function drawCropCanvas() {
  const canvas = document.getElementById("crop-canvas");
  const container = canvas ? canvas.parentElement : null;
  if (!canvas || !container || !rawCropperImage) return;

  const width = container.clientWidth || 380;
  const height = container.clientHeight || 300;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  // 1. Draw Canvas background
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, width, height);

  // 2. Calculate crop circle radius
  const cropRadius = Math.min(width, height) / 2 - 12;
  const centerX = width / 2;
  const centerY = height / 2;

  // 3. Calculate base scale so uploaded image fills the crop circle area
  const minDim = Math.min(rawCropperImage.width, rawCropperImage.height);
  const scale = ((cropRadius * 2) / minDim) * currentZoom;

  const drawWidth = rawCropperImage.width * scale;
  const drawHeight = rawCropperImage.height * scale;

  const dx = (width - drawWidth) / 2 + cropOffsetX;
  const dy = (height - drawHeight) / 2 + cropOffsetY;

  // Draw uploaded image
  ctx.drawImage(rawCropperImage, dx, dy, drawWidth, drawHeight);

  // 4. Draw dark semi-transparent overlay OUTSIDE the crop circle
  ctx.save();
  ctx.fillStyle = "rgba(20, 20, 20, 0.45)";
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.arc(centerX, centerY, cropRadius, 0, Math.PI * 2, true);
  ctx.fill();
  ctx.restore();

  // 5. Draw 3x3 Dashed Grid Lines INSIDE the crop circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, cropRadius, 0, Math.PI * 2);
  ctx.clip();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  const offsetThird = cropRadius * (2 / 3);
  // Vertical grid lines
  ctx.beginPath();
  ctx.moveTo(centerX - offsetThird, centerY - cropRadius);
  ctx.lineTo(centerX - offsetThird, centerY + cropRadius);
  ctx.moveTo(centerX + offsetThird, centerY - cropRadius);
  ctx.lineTo(centerX + offsetThird, centerY + cropRadius);
  // Horizontal grid lines
  ctx.moveTo(centerX - cropRadius, centerY - offsetThird);
  ctx.lineTo(centerX + cropRadius, centerY - offsetThird);
  ctx.moveTo(centerX - cropRadius, centerY + offsetThird);
  ctx.lineTo(centerX + cropRadius, centerY + offsetThird);
  ctx.stroke();
  ctx.restore();

  // 6. Draw Solid Black Circle Ring around Crop Area
  ctx.save();
  ctx.setLineDash([]);
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(centerX, centerY, cropRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

let pendingAvatarData = null;

window.saveCroppedAvatar = function () {
  const canvas = document.getElementById("crop-canvas");
  const container = canvas ? canvas.parentElement : null;
  if (!canvas || !container || !rawCropperImage) return;

  const width = canvas.width || 380;
  const height = canvas.height || 300;
  const cropRadius = Math.min(width, height) / 2 - 12;

  const outputSize = 400; // High resolution 400x400 output canvas
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = outputSize;
  outputCanvas.height = outputSize;
  const ctx = outputCanvas.getContext("2d");

  // Clip output canvas to circular boundary
  ctx.beginPath();
  ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
  ctx.clip();

  const minDim = Math.min(rawCropperImage.width, rawCropperImage.height);
  const outputScale = outputSize / (cropRadius * 2);

  const imgScale = (outputSize / minDim) * currentZoom;
  const outDrawWidth = rawCropperImage.width * imgScale;
  const outDrawHeight = rawCropperImage.height * imgScale;

  // Exact math matching drawCropCanvas()
  const outDx = (outputSize / 2) - (outDrawWidth / 2) + (cropOffsetX * outputScale);
  const outDy = (outputSize / 2) - (outDrawHeight / 2) + (cropOffsetY * outputScale);

  ctx.drawImage(rawCropperImage, outDx, outDy, outDrawWidth, outDrawHeight);

  const croppedBase64 = outputCanvas.toDataURL("image/webp", 0.95);

  const avatarPreview = document.getElementById("profile-avatar-preview");
  const bannerAvatar = document.getElementById("acc-banner-avatar");
  if (avatarPreview) avatarPreview.src = croppedBase64;
  if (bannerAvatar) bannerAvatar.src = croppedBase64;

  pendingAvatarData = croppedBase64;

  if (typeof window.checkFormChanges === "function") {
    window.checkFormChanges();
  }

  showStatus("Profile picture selected! Click 'Save Changes' to update.", true);
  window.closeCropModal();
};

function showStatus(text, isSuccess) {
  const msgEl = document.getElementById("profile-form-message");
  if (!msgEl) return;
  msgEl.textContent = text;
  msgEl.className = "profile-message " + (isSuccess ? "success" : "error");
}

// 5. PROFILE FORM SUBMIT & CHANGE DETECTION
function setupFormHandlers() {
  const countryCodeSelect = document.getElementById("profile-country-code");
  const phoneInput = document.getElementById("profile-phone");

  function getExpectedPhoneLength(code) {
    if (code === "+65") return 8;
    if (["+33", "+31", "+34", "+94", "+971", "+966", "+27", "+61"].includes(code)) return 9;
    if (["+55", "+86", "+62", "+880"].includes(code)) return 11;
    return 10;
  }

  function updatePhoneLimits() {
    if (!phoneInput) return;
    const code = countryCodeSelect ? countryCodeSelect.value : "+91";
    const reqLen = getExpectedPhoneLength(code);
    phoneInput.maxLength = reqLen;
    phoneInput.placeholder = `${reqLen}-digit mobile number`;
    phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, reqLen);
  }

  if (countryCodeSelect) {
    countryCodeSelect.addEventListener("change", () => {
      updatePhoneLimits();
      if (typeof window.checkFormChanges === "function") window.checkFormChanges();
    });
  }

  if (phoneInput) {
    phoneInput.addEventListener("input", function () {
      const code = countryCodeSelect ? countryCodeSelect.value : "+91";
      const reqLen = getExpectedPhoneLength(code);
      this.value = this.value.replace(/\D/g, "").slice(0, reqLen);
    });
  }

  updatePhoneLimits();

  const form = document.getElementById("profile-edit-form");
  if (!form) return;

  const saveBtn = form.querySelector(".btn-save-profile");
  let savedStateFlag = false;

  function getFormValues() {
    return {
      firstName: (document.getElementById("profile-firstname")?.value || "").trim(),
      lastName: (document.getElementById("profile-lastname")?.value || "").trim(),
      email: (document.getElementById("profile-email")?.value || "").trim(),
      countryCode: (document.getElementById("profile-country-code")?.value || "+91"),
      phone: (document.getElementById("profile-phone")?.value || "").trim(),
      password: (document.getElementById("profile-new-password")?.value || "")
    };
  }

  let initialValues = getFormValues();

  function checkFormChanges() {
    if (!saveBtn) return;
    const currentValues = getFormValues();
    const isFormChanged = JSON.stringify(currentValues) !== JSON.stringify(initialValues);
    const isAvatarChanged = pendingAvatarData !== null;
    const isChanged = isFormChanged || isAvatarChanged;

    if (isChanged) {
      savedStateFlag = false;
      saveBtn.disabled = false;
      saveBtn.style.opacity = "1";
      saveBtn.style.cursor = "pointer";
      saveBtn.style.background = "#0f172a"; // Solid Black for active changes
      saveBtn.style.color = "#ffffff";
      saveBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Save Changes';
    } else {
      saveBtn.disabled = true;
      saveBtn.style.opacity = "0.65";
      saveBtn.style.cursor = "not-allowed";
      saveBtn.style.background = "#0f172a"; // Solid Black for saved state
      saveBtn.style.color = "#ffffff";
      if (savedStateFlag) {
        saveBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Changed Successfully';
      } else {
        saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Profile Details';
      }
    }
  }

  window.checkFormChanges = checkFormChanges;

  // Initial state check on load
  checkFormChanges();

  // Track live typing/editing in profile form fields & country code select
  const formInputs = form.querySelectorAll("input, select");
  formInputs.forEach(input => {
    input.addEventListener("input", checkFormChanges);
    input.addEventListener("change", checkFormChanges);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const currentValues = getFormValues();
    const isFormChanged = JSON.stringify(currentValues) !== JSON.stringify(initialValues);
    const isAvatarChanged = pendingAvatarData !== null;
    const isChanged = isFormChanged || isAvatarChanged;

    if (!isChanged && !savedStateFlag) {
      showStatus("No changes detected to save.", false);
      return;
    }

    const { firstName, lastName, email, countryCode, phone, password } = currentValues;

    if (!firstName || !email) {
      showStatus("First Name and Email are required.", false);
      return;
    }

    const expectedLen = getExpectedPhoneLength(countryCode);
    if (phone && phone.length !== expectedLen) {
      showStatus(`Mobile phone number for ${countryCode} must be exactly ${expectedLen} digits.`, false);
      return;
    }

    const fullName = `${firstName} ${lastName}`.trim();
    let user = getCurrentUser() || {};
    const updatedUser = {
      ...user,
      firstName,
      lastName,
      name: fullName,
      username: firstName.toLowerCase().replace(/\s+/g, "_"),
      email,
      countryCode,
      phone
    };

    if (pendingAvatarData) {
      updatedUser.avatar = pendingAvatarData;
    }

    if (window.Auth && window.Auth.saveUserProfile) {
      window.Auth.saveUserProfile(updatedUser);
    } else {
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      localStorage.setItem("lastUser", JSON.stringify(updatedUser));
      localStorage.removeItem("userLoggedOut");
      localStorage.setItem("isLoggedIn", "true");
    }
    showStatus("Profile details updated successfully!", true);

    const bannerName = document.getElementById("acc-banner-name");
    const bannerEmail = document.getElementById("acc-banner-email");
    const bannerAvatar = document.getElementById("acc-banner-avatar");
    if (bannerName) bannerName.textContent = fullName || firstName;
    if (bannerEmail) bannerEmail.textContent = email;
    if (bannerAvatar && updatedUser.avatar) bannerAvatar.src = updatedUser.avatar;

    if (password) {
      document.getElementById("profile-new-password").value = "";
    }

    // Update initial values snapshot & set persistent 'Changed Successfully' state
    initialValues = getFormValues();
    pendingAvatarData = null;
    savedStateFlag = true;

    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.style.opacity = "0.65";
      saveBtn.style.cursor = "not-allowed";
      saveBtn.style.background = "#0f172a"; // Solid Black for saved state
      saveBtn.style.color = "#ffffff";
      saveBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Changed Successfully';
    }
  });
}

// 6. STAR RATING PICKER
function setupStarPicker() {
  const stars = document.querySelectorAll("#star-picker .star-btn");
  const valTxt = document.getElementById("star-rating-val");

  stars.forEach(star => {
    star.addEventListener("click", () => {
      selectedStarRating = parseInt(star.getAttribute("data-val"));
      stars.forEach(s => {
        const sVal = parseInt(s.getAttribute("data-val"));
        if (sVal <= selectedStarRating) {
          s.classList.add("active");
        } else {
          s.classList.remove("active");
        }
      });
      if (valTxt) valTxt.textContent = `${selectedStarRating} / 5`;
    });
  });
}

// 7. FEEDBACK SUBMISSION
window.handleAccountFeedbackSubmit = function (e) {
  if (e) e.preventDefault();
  const category = document.getElementById("feedback-category-select").value;
  const msg = document.getElementById("feedback-msg-input").value.trim();
  if (!msg) return;

  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const authorName = currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName}` : "Profile User";

  const newFeedback = {
    id: "FB-" + Math.floor(1000 + Math.random() * 9000),
    user: authorName,
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    category: category,
    rating: selectedStarRating,
    title: "Profile Feedback",
    text: msg,
    isPublic: true,
    helpfulCount: 0,
    status: "Pending",
    admin_reply: null,
    internal_notes: null,
    priority: null
  };

  let reviewsList = [];
  try {
    const raw = localStorage.getItem("userReviews") || localStorage.getItem("user_reviews");
    if (raw) reviewsList = JSON.parse(raw) || [];
  } catch (err) {}

  reviewsList.unshift(newFeedback);
  localStorage.setItem("userReviews", JSON.stringify(reviewsList));
  localStorage.setItem("user_reviews", JSON.stringify(reviewsList));

  document.getElementById("feedback-msg-input").value = "";
  if (typeof showToast === 'function') showToast("Thank you for your feedback! Your review has been recorded.");
  else alert("Thank you for your feedback! Your review has been recorded.");
  loadFeedbackHistory();
};

window.profileFeedbackLimit = 5;

window.loadFeedbackHistory = function() {
  const container = document.getElementById("feedback-history-list");
  if (!container) return;

  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const authorName = currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName}` : "Profile User";

  let reviewsList = [];
  try {
    const raw = localStorage.getItem("userReviews") || localStorage.getItem("user_reviews");
    if (raw) reviewsList = JSON.parse(raw) || [];
  } catch (err) {}

  // Filter to only show feedback submitted by the current user
  let history = reviewsList.filter(r => r.user === authorName || r.author === authorName);
  
  // Sort newest first
  history.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  if (history.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 24px;">No past feedback found.</div>`;
    return;
  }

  const visibleHistory = history.slice(0, window.profileFeedbackLimit);
  let html = "";
  
  visibleHistory.forEach(item => {
    let starsHtml = "";
    for (let i = 1; i <= 5; i++) {
      starsHtml += `<i class="fa-solid fa-star" style="color: ${i <= item.rating ? '#f59e0b' : '#cbd5e1'}; font-size: 0.75rem;"></i>`;
    }

    const statusColor = item.status === 'Resolved' ? '#10b981' : (item.status === 'Reviewed' ? '#3b82f6' : (item.status === 'Flagged' ? '#ef4444' : '#94a3b8'));

    html += `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; background: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 8px; flex-wrap: nowrap; overflow: hidden;">
        <div style="flex-shrink: 0; width: 140px;">
          <span style="font-size: 0.75rem; font-weight: 700; color: #0f172a; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; display: inline-block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;" title="${item.category || 'General'}">${item.category || 'General'}</span>
        </div>
        <div style="flex-shrink: 0; width: 70px;">
          ${starsHtml}
        </div>
        <div style="flex-grow: 1; flex-shrink: 1; min-width: 0;">
          <p style="font-size: 0.85rem; color: #334155; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${item.text || item.message || ''}">${item.text || item.message || ''}</p>
        </div>
        <div style="flex-shrink: 0; width: 80px; text-align: center;">
          <span style="font-size: 0.7rem; font-weight: 700; color: ${statusColor}; border: 1px solid ${statusColor}; padding: 2px 6px; border-radius: 4px;">${item.status || 'Pending'}</span>
        </div>
        <div style="flex-shrink: 0; width: 90px; text-align: right;">
          <span style="font-size: 0.75rem; color: #64748b; white-space: nowrap;">${item.date}</span>
        </div>
      </div>
    `;
  });

  if (history.length > window.profileFeedbackLimit) {
    html += `
      <div style="text-align: center; margin-top: 12px;">
        <button onclick="window.profileFeedbackLimit += 5; loadFeedbackHistory()" style="background: transparent; border: 1px solid #cbd5e1; color: #475569; padding: 6px 16px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer;">Show More</button>
      </div>
    `;
  }

  container.innerHTML = html;
}

// 8. NOTIFICATIONS INBOX
let notifsCurrentPage = 1;
let notifsCategory = 'All';
let notifsHasMore = false;
window.notificationDataStore = {};

window.loadNotificationsInbox = async function(page = 1) {
  const container = document.getElementById("notifications-inbox-list");
  const paginationDiv = document.getElementById("notifications-pagination");
  if (!container) return;

  function getCurrentUserEmail() {
    let currentUserStr = localStorage.getItem("currentUser");
    if (!currentUserStr) return null;
    try {
      return JSON.parse(currentUserStr).email;
    } catch (e) {
      return null;
    }
  }

  const email = getCurrentUserEmail();
  if (!email) {
    container.innerHTML = '<div style="padding: 20px; text-align: center;">Please log in to view notifications.</div>';
    return;
  }

  if (page === 1) {
    container.innerHTML = '<div style="padding: 40px 20px; text-align: center; color: #64748b;"><i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem;"></i><div style="margin-top: 12px;">Loading...</div></div>';
  }

  try {
    const res = await fetch(`/api/notifications?page=${page}&limit=10&category=${encodeURIComponent(notifsCategory)}`, {
      headers: { "Authorization": "Bearer " + localStorage.getItem("userToken"), "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })() }
    });

    if (res.status === 401) {
      container.innerHTML = `
        <div style="padding: 60px 20px; text-align: center; color: #ef4444; background: #fef2f2; border-radius: 12px; border: 1px solid #fecaca;">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; margin-bottom: 16px; color: #ef4444;"></i>
          <div style="font-size: 1.1rem; font-weight: 600; color: #991b1b;">Authentication Required</div>
          <div style="font-size: 0.9rem; margin-top: 4px;">Your session has expired. Please sign out and sign back in to view your notifications.</div>
        </div>
      `;
      if(paginationDiv) paginationDiv.style.display = 'none';
      return;
    }

    const data = await res.json();
    
    if (page === 1 && (!data.notifications || data.notifications.length === 0)) {
      const isTrash = typeof notifsCategory !== 'undefined' && notifsCategory === 'Trash';
      container.innerHTML = `
        <div style="padding: 60px 20px; text-align: center; color: #64748b; background: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1;">
          <i class="${isTrash ? 'fa-solid fa-trash-can' : 'fa-regular fa-bell-slash'}" style="font-size: 3rem; margin-bottom: 16px; color: #94a3b8;"></i>
          <div style="font-size: 1.1rem; font-weight: 600; color: #334155;">${isTrash ? 'Trash is empty.' : 'You\'re all caught up.'}</div>
          <div style="font-size: 0.9rem; margin-top: 4px;">${isTrash ? 'No deleted notifications here.' : 'No new notifications right now.'}</div>
        </div>
      `;
      if(paginationDiv) paginationDiv.style.display = 'none';
      return;
    }

    notifsHasMore = page < data.totalPages;
    if(paginationDiv) {
      paginationDiv.style.display = (page > 1 || notifsHasMore) ? 'flex' : 'none';
      const btnPrev = document.getElementById('btn-prev-notifs');
      const btnNext = document.getElementById('btn-next-notifs');
      if(btnPrev) {
        btnPrev.disabled = page === 1;
        btnPrev.style.opacity = page === 1 ? '0.5' : '1';
        btnPrev.style.cursor = page === 1 ? 'default' : 'pointer';
      }
      if(btnNext) {
        btnNext.disabled = !notifsHasMore;
        btnNext.style.opacity = !notifsHasMore ? '0.5' : '1';
        btnNext.style.cursor = !notifsHasMore ? 'default' : 'pointer';
      }
      const pageNumEl = document.getElementById('notifs-page-number');
      if (pageNumEl) pageNumEl.textContent = page;
      const pageInfoEl = document.getElementById('notifs-page-info');
      if (pageInfoEl) pageInfoEl.textContent = `Page ${page} of ${data.totalPages}`;
    }

    let html = "";
    data.notifications.forEach(n => {
      const timeStr = new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      let iconClass = 'fa-regular fa-bell';
      let categoryName = 'General';
      if (n.type.includes('order')) { iconClass = 'fa-solid fa-box'; categoryName = 'Order Updates'; }
      else if (n.type.includes('post') || n.type.includes('support')) { iconClass = 'fa-regular fa-comment-dots'; categoryName = 'Community'; }
      else if (n.type.includes('product') || n.type.includes('wishlist') || n.type.includes('offer') || n.type.includes('sale')) { iconClass = 'fa-solid fa-cart-shopping'; categoryName = 'Store Updates'; }
      else if (n.type.includes('article') || n.type.includes('course') || n.type.includes('broadcast')) { iconClass = 'fa-regular fa-newspaper'; categoryName = 'Studio News'; }

      window.notificationDataStore[n.id] = {
        id: n.id,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        link: n.link,
        type: n.type,
        date: timeStr,
        iconClass: iconClass,
        categoryName: categoryName
      };

      html += window.renderNotificationRowHTML(n, false);
    });

    // With pagination, always replace the content
    container.innerHTML = html;
    attachNotificationCheckboxListeners();

    try {
      const bRes = await fetch('/api/notifications/unread-count', {
        headers: { "Authorization": "Bearer " + localStorage.getItem("userToken"), "x-user-email": email }
      });
      if (bRes.ok) {
        const bData = await bRes.json();
        const counts = bData.countsByCategory;
        if (counts) {
          document.querySelectorAll('.notif-tab-btn').forEach(btn => {
            const cat = btn.getAttribute('data-category');
            const badge = btn.querySelector('.notif-badge');
            if (badge) {
              const count = counts[cat] || 0;
              if (count > 0) {
                badge.textContent = ` (${count})`;
                badge.style.display = 'inline';
              } else {
                badge.style.display = 'none';
              }
            }
          });
        }
      }
    } catch (e) {
      console.error(e);
    }

  } catch (err) {
    console.error("Failed to load notifications:", err);
    if(page === 1) container.innerHTML = '<div style="padding: 20px; text-align: center; color: #ef4444;">Failed to load.</div>';
  }
}

function attachNotificationCheckboxListeners() {
  const checkboxes = document.querySelectorAll('.notif-checkbox');
  const selectAllBtn = document.getElementById('notif-select-all-btn');
  const mainCheckbox = document.getElementById('notif-select-all');
  const selectCountDisplay = document.getElementById('notif-select-count');
  
  const selectedActions = document.getElementById('notif-selected-actions');
  const markUnreadSelectedBtn = document.getElementById('notif-mark-unread-selected-btn');
  const markReadSelectedBtn = document.getElementById('notif-mark-read-selected-btn');
  const markAllReadBtn = document.getElementById('notif-mark-all-read-btn');
  
  const updateToolbar = () => {
    const checkedBoxes = document.querySelectorAll('.notif-checkbox:checked');
    const checked = checkedBoxes.length;
    const total = checkboxes.length;
    
    const inboxList = document.getElementById('notifications-inbox-list');
    if (inboxList) {
      if (checked > 0) {
        inboxList.classList.add('selection-mode');
      } else {
        inboxList.classList.remove('selection-mode');
      }
    }
    
    if (selectCountDisplay) {
      selectCountDisplay.textContent = checked > 0 ? `${checked} selected` : '';
    }
    
    if (mainCheckbox) {
      mainCheckbox.checked = checked > 0 && checked === total;
      mainCheckbox.indeterminate = checked > 0 && checked < total;
    }
    
    if (selectAllBtn) {
      if (total > 0 && checked === total) {
        selectAllBtn.textContent = 'Deselect All';
      } else {
        selectAllBtn.textContent = 'Select All';
      }
    }
    
    if (selectedActions) {
      if (checked > 0) {
        selectedActions.style.display = 'flex';
        if (markUnreadSelectedBtn) markUnreadSelectedBtn.style.display = 'block';
      } else {
        selectedActions.style.display = 'none';
      }
    }

    const delBtn = document.getElementById('notif-delete-selected-btn');
    const restoreBtn = document.getElementById('notif-restore-selected-btn');
    const permDelBtn = document.getElementById('notif-permanent-delete-selected-btn');
    const emptyTrashBtn = document.getElementById('notif-empty-trash-btn');
    
    if (typeof notifsCategory !== 'undefined' && notifsCategory === 'Trash') {
      if (delBtn) delBtn.style.display = 'none';
      if (markReadSelectedBtn) markReadSelectedBtn.style.display = 'none';
      if (markUnreadSelectedBtn) markUnreadSelectedBtn.style.display = 'none';
      if (restoreBtn) restoreBtn.style.display = 'flex';
      if (permDelBtn) permDelBtn.style.display = 'flex';
      if (emptyTrashBtn) emptyTrashBtn.style.display = checked > 0 ? 'none' : 'flex';
      // Select dropdown: hide Move to Trash, show Restore
      const moveToTrashItem = document.getElementById('notif-move-to-trash-btn');
      const restoreDropdownItem = document.getElementById('notif-restore-dropdown-btn');
      if (moveToTrashItem) moveToTrashItem.style.display = 'none';
      if (restoreDropdownItem) restoreDropdownItem.style.display = 'block';
    } else {
      if (delBtn) delBtn.style.display = 'flex';
      if (restoreBtn) restoreBtn.style.display = 'none';
      if (permDelBtn) permDelBtn.style.display = 'none';
      if (emptyTrashBtn) emptyTrashBtn.style.display = 'none';
      // Select dropdown: show Move to Trash, hide Restore
      const moveToTrashItem = document.getElementById('notif-move-to-trash-btn');
      const restoreDropdownItem = document.getElementById('notif-restore-dropdown-btn');
      if (moveToTrashItem) moveToTrashItem.style.display = 'block';
      if (restoreDropdownItem) restoreDropdownItem.style.display = 'none';

      if (checked > 0) {
        if (markUnreadSelectedBtn) markUnreadSelectedBtn.style.display = 'block';
        if (markReadSelectedBtn) markReadSelectedBtn.style.display = 'block';
        if (markAllReadBtn) markAllReadBtn.style.display = 'none';
      } else {
        if (markUnreadSelectedBtn) markUnreadSelectedBtn.style.display = 'none';
        if (markReadSelectedBtn) markReadSelectedBtn.style.display = 'none';
        if (markAllReadBtn) markAllReadBtn.style.display = 'block';
      }
    }
  };

  checkboxes.forEach(cb => {
    cb.addEventListener('change', updateToolbar);
  });
  
  if (mainCheckbox) {
    mainCheckbox.onclick = () => {
      const isChecked = mainCheckbox.checked;
      if (isChecked) {
        const inboxList = document.getElementById('notifications-inbox-list');
        if (inboxList) inboxList.classList.add('selection-mode');
      } else {
        checkboxes.forEach(cb => cb.checked = false);
        updateToolbar();
      }
    };
  }
  
  if (selectAllBtn) {
    selectAllBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const checkedBoxes = document.querySelectorAll('.notif-checkbox:checked');
      const isAllChecked = checkboxes.length > 0 && checkedBoxes.length === checkboxes.length;
      checkboxes.forEach(cb => cb.checked = !isAllChecked);
      updateToolbar();
      // Update button text
      selectAllBtn.textContent = isAllChecked ? 'Select All' : 'Deselect All';
    });
  }
}

let currentPreviewNotifId = null;

window.openNotificationPreview = async function(notif) {
  const listView = document.getElementById('notifications-list-view');
  const previewView = document.getElementById('notification-preview-view');
  
  if(!listView || !previewView) return;
  
  document.getElementById('notif-preview-title').textContent = notif.title;
  document.getElementById('notif-preview-body').textContent = notif.message;
  document.getElementById('notif-preview-date').textContent = notif.date;
  
  const iconEl = document.getElementById('notif-preview-icon');
  if (iconEl) {
    iconEl.className = notif.iconClass || 'fa-regular fa-bell';
  }
  
  const catEl = document.getElementById('notif-preview-category-name');
  if (catEl) {
    catEl.textContent = notif.categoryName ? `• ${notif.categoryName}` : '';
  }
  
  currentPreviewNotifId = notif.id;
  
  // Switch view
  listView.style.display = 'none';
  previewView.style.display = 'block';
  
  // Trigger mark as read automatically
  if (!notif.isRead) {
    try {
      await fetch(`/api/notifications/${notif.id}/read`, {
        method: 'PATCH',
        headers: { "Authorization": "Bearer " + localStorage.getItem("userToken"), "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })() }
      });
    } catch(e) {}
  }
}

window.closeNotificationPreview = function() {
  const listView = document.getElementById('notifications-list-view');
  const previewView = document.getElementById('notification-preview-view');
  
  if(!listView || !previewView) return;
  
  previewView.style.display = 'none';
  listView.style.display = 'block';
  
  notifsCurrentPage = 1;
  loadNotificationsInbox(1);
}

function showCustomConfirmModal(message, onConfirm) {
  const modal = document.getElementById('delete-confirm-modal');
  const msgEl = document.getElementById('delete-confirm-msg');
  const cancelBtn = document.getElementById('btn-cancel-delete');
  const confirmBtn = document.getElementById('btn-confirm-delete');
  
  if (!modal) {
    // fallback if modal not found
    if(confirm(message)) onConfirm();
    return;
  }
  
  msgEl.textContent = message;
  modal.style.display = 'flex';
  setTimeout(() => modal.style.opacity = '1', 10);
  
  const close = () => {
    modal.style.display = 'none';
    cancelBtn.replaceWith(cancelBtn.cloneNode(true));
    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
  };
  
  cancelBtn.addEventListener('click', close, { once: true });
  confirmBtn.addEventListener('click', () => {
    close();
    onConfirm();
  }, { once: true });
}

window.deleteSelectedNotifications = async function() {
  const checked = document.querySelectorAll('.notif-checkbox:checked');
  if(checked.length === 0) return;
  
  const ids = Array.from(checked).map(cb => parseInt(cb.value));
  
  // In Trash mode, this becomes a permanent delete with a warning
  if (typeof notifsCategory !== 'undefined' && notifsCategory === 'Trash') {
    showCustomConfirmModal(`Permanently delete ${ids.length} notification${ids.length > 1 ? 's' : ''}? This cannot be undone.`, async () => {
      try {
        // Permanent bulk delete via dedicated endpoint
        const res = await fetch('/api/notifications/bulk/permanent', {
          method: 'DELETE',
          headers: { 
            'Content-Type': 'application/json',
            "Authorization": "Bearer " + localStorage.getItem("userToken"),
            "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })()
          },
          body: JSON.stringify({ ids })
        });
        if(res.ok) {
          loadNotificationsInbox(notifsCurrentPage);
        }
      } catch(err) {
        console.error(err);
        alert("Failed to permanently delete notifications.");
      }
    });
    return;
  }

  try {
    const res = await fetch('/api/notifications/bulk', {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        "Authorization": "Bearer " + localStorage.getItem("userToken"),
        "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })()
      },
      body: JSON.stringify({ ids })
    });
    if(res.ok) {
      loadNotificationsInbox(notifsCurrentPage);
    }
  } catch(err) {
    console.error(err);
    alert("Failed to delete notifications.");
  }
}

window.moveSelectedToTrash = async function() {
  const checked = document.querySelectorAll('.notif-checkbox:checked');
  if(checked.length === 0) return;
  const ids = Array.from(checked).map(cb => parseInt(cb.value));
  try {
    const res = await fetch('/api/notifications/bulk', {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        "Authorization": "Bearer " + localStorage.getItem("userToken"),
        "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })()
      },
      body: JSON.stringify({ ids })
    });
    if(res.ok) {
      loadNotificationsInbox(notifsCurrentPage);
    }
  } catch(err) {
    console.error(err);
    alert("Failed to move to trash.");
  }
}

window.restoreSelectedNotifications = async function() {
  const checked = document.querySelectorAll('.notif-checkbox:checked');
  if(checked.length === 0) return;
  
  const ids = Array.from(checked).map(cb => parseInt(cb.value));
  try {
    const res = await fetch('/api/notifications/bulk/restore', {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        "Authorization": "Bearer " + localStorage.getItem("userToken"),
        "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })() 
      },
      body: JSON.stringify({ ids })
    });
    if(res.ok) {
      loadNotificationsInbox(notifsCurrentPage);
    }
  } catch(err) {
    console.error(err);
    alert("Failed to restore notifications.");
  }
}

window.permanentDeleteSelectedNotifications = async function() {
  const checked = document.querySelectorAll('.notif-checkbox:checked');
  if(checked.length === 0) return;
  
  const ids = Array.from(checked).map(cb => parseInt(cb.value));
  
  showCustomConfirmModal(`Permanently delete ${ids.length} notification${ids.length > 1 ? 's' : ''}? This cannot be undone.`, async () => {
    try {
      const res = await fetch('/api/notifications/bulk/permanent', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          "Authorization": "Bearer " + localStorage.getItem("userToken"),
          "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })()
        },
        body: JSON.stringify({ ids })
      });
      if(res.ok) {
        loadNotificationsInbox(notifsCurrentPage);
      }
    } catch(err) {
      console.error(err);
      alert("Failed to permanently delete notifications.");
    }
  });
}

window.emptyTrash = async function() {
  showCustomConfirmModal("Are you sure you want to permanently delete all items in Trash?", async () => {
    try {
      const res = await fetch('/api/notifications/trash/empty', {
        method: 'DELETE',
        headers: { 
          "Authorization": "Bearer " + localStorage.getItem("userToken"),
          "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })() 
        }
      });
      if(res.ok) {
        loadNotificationsInbox(notifsCurrentPage);
      }
    } catch(err) {
      console.error(err);
      alert("Failed to empty trash.");
    }
  });
}

window.markSelectedAsRead = async function() {
  const checked = document.querySelectorAll('.notif-checkbox:checked');
  if(checked.length === 0) return;
  const ids = Array.from(checked).map(cb => parseInt(cb.value));
  
  try {
    await Promise.all(ids.map(id => fetch(`/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { 
        "Authorization": "Bearer " + localStorage.getItem("userToken"),
        "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })() 
      }
    })));
    window.location.hash = "notifications";
    window.location.reload();
  } catch(err) {
    console.error(err);
  }
}

window.markSelectedAsUnread = async function() {
  const checked = document.querySelectorAll('.notif-checkbox:checked');
  if(checked.length === 0) return;
  const ids = Array.from(checked).map(cb => parseInt(cb.value));
  
  try {
    await Promise.all(ids.map(id => fetch(`/api/notifications/${id}/unread`, {
      method: 'PATCH',
      headers: { 
        "Authorization": "Bearer " + localStorage.getItem("userToken"),
        "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })() 
      }
    })));
    window.location.hash = "notifications";
    window.location.reload();
  } catch(err) {
    console.error(err);
  }
}

window.deleteSingleNotification = async function(id) {
  try {
    const res = await fetch(`/api/notifications/${id}`, {
      method: 'DELETE',
      headers: { 
        "Authorization": "Bearer " + localStorage.getItem("userToken"),
        "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })() 
      }
    });
    if(res.ok) {
      loadNotificationsInbox(notifsCurrentPage);
    }
  } catch(err) {
    console.error(err);
    alert("Failed to delete notification.");
  }
}

window.markSingleNotificationRead = async function(id) {
  let currentUserStr = localStorage.getItem("currentUser");
  const email = currentUserStr ? JSON.parse(currentUserStr).email : null;
  if(!email) return;
  try {
    await fetch(`/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { "Authorization": "Bearer " + localStorage.getItem("userToken"), "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })() }
    });
    notifsCurrentPage = 1;
    loadNotificationsInbox(1);
  } catch(e) {
    console.error(e);
  }
}

window.markAllNotificationsRead = async function () {
  let currentUserStr = localStorage.getItem("currentUser");
  const email = currentUserStr ? JSON.parse(currentUserStr).email : null;
  if(!email) return;
  try {
    await fetch(`/api/notifications/read-all`, {
      method: 'PATCH',
      headers: { "Authorization": "Bearer " + localStorage.getItem("userToken"), "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })() }
    });
    notifsCurrentPage = 1;
    loadNotificationsInbox(1);
  } catch(e) {
    console.error(e);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  // Wait for profile info if loading
  let currentUserStr = localStorage.getItem("currentUser");
  if(currentUserStr) {
    let user = JSON.parse(currentUserStr);
    const profileName = document.getElementById("profile-name");
    const profileEmail = document.getElementById("profile-email");
    const profileInitial = document.getElementById("profile-initial");
    if(profileName) profileName.textContent = user.name || user.username || "User";
    if(profileEmail) profileEmail.textContent = user.email || "";
    if(profileInitial && user.name) profileInitial.textContent = user.name.charAt(0).toUpperCase();
  }

  const prevBtn = document.getElementById('btn-prev-notifs');
  const nextBtn = document.getElementById('btn-next-notifs');
  
  if(prevBtn) {
    prevBtn.addEventListener('click', () => {
      if(notifsCurrentPage > 1) {
        notifsCurrentPage--;
        loadNotificationsInbox(notifsCurrentPage);
      }
    });
  }
  
  if(nextBtn) {
    nextBtn.addEventListener('click', () => {
      if(notifsHasMore) {
        notifsCurrentPage++;
        loadNotificationsInbox(notifsCurrentPage);
      }
    });
  }

  // Category Tabs
  const notifTabs = document.querySelectorAll('.notif-tab-btn');
  const trashTabBtn = document.getElementById('notif-trash-tab-btn');

  notifTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      notifTabs.forEach(t => t.classList.remove('active'));
      if(trashTabBtn) trashTabBtn.classList.remove('active-tab');
      
      let target = e.target;
      while (target && !target.classList.contains('notif-tab-btn')) {
        target = target.parentElement;
      }
      if(target) target.classList.add('active');
      
      notifsCategory = target ? target.getAttribute('data-category') : 'All';
      notifsCurrentPage = 1;
      loadNotificationsInbox(1);
    });
  });

  if (trashTabBtn) {
    trashTabBtn.addEventListener('click', (e) => {
      notifTabs.forEach(t => t.classList.remove('active'));
      
      let target = e.target;
      while (target && target.id !== 'notif-trash-tab-btn') {
        target = target.parentElement;
      }
      if(target) target.classList.add('active-tab');
      
      notifsCategory = 'Trash';
      notifsCurrentPage = 1;
      loadNotificationsInbox(1);
    });
  }

  const delSelectedBtn = document.getElementById('btn-delete-selected-notifs');
  if(delSelectedBtn) {
    delSelectedBtn.addEventListener('click', window.deleteSelectedNotifications);
  }
  const pwBtn = document.getElementById("btn-submit-pw");
  if (pwBtn) pwBtn.addEventListener("click", updatePassword);

  // Toolbar buttons
  const moreOptionsBtn = document.getElementById('notif-more-options-btn');
  const moreDropdown = document.getElementById('notif-more-dropdown');
  const selectOptionsBtn = document.getElementById('notif-select-options-btn');
  const selectDropdown = document.getElementById('notif-select-dropdown');

  if (moreOptionsBtn && moreDropdown) {
    moreOptionsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if(selectDropdown) selectDropdown.style.display = 'none';
      moreDropdown.style.display = moreDropdown.style.display === 'none' ? 'block' : 'none';
    });
  }

  if (selectOptionsBtn && selectDropdown) {
    selectOptionsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if(moreDropdown) moreDropdown.style.display = 'none';
      selectDropdown.style.display = selectDropdown.style.display === 'none' ? 'block' : 'none';
    });
  }

  document.addEventListener('click', () => {
    if(moreDropdown) moreDropdown.style.display = 'none';
    if(selectDropdown) selectDropdown.style.display = 'none';
  });

  const refreshBtn = document.getElementById('notif-refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      notifsCurrentPage = 1;
      loadNotificationsInbox(1);
    });
  }
  
  const delSelectedBtn2 = document.getElementById('notif-delete-selected-btn');
  if(delSelectedBtn2) {
    delSelectedBtn2.addEventListener('click', window.deleteSelectedNotifications);
  }

  const restoreSelectedBtn = document.getElementById('notif-restore-selected-btn');
  if(restoreSelectedBtn) {
    restoreSelectedBtn.addEventListener('click', window.restoreSelectedNotifications);
  }

  const permDelSelectedBtn = document.getElementById('notif-permanent-delete-selected-btn');
  if(permDelSelectedBtn) {
    permDelSelectedBtn.addEventListener('click', window.permanentDeleteSelectedNotifications);
  }

  const emptyTrashBtn = document.getElementById('notif-empty-trash-btn');
  if(emptyTrashBtn) {
    emptyTrashBtn.addEventListener('click', window.emptyTrash);
  }

  const moveToTrashDropdownBtn = document.getElementById('notif-move-to-trash-btn');
  if(moveToTrashDropdownBtn) {
    moveToTrashDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if(selectDropdown) selectDropdown.style.display = 'none';
      window.moveSelectedToTrash();
    });
  }

  const restoreDropdownBtn = document.getElementById('notif-restore-dropdown-btn');
  if(restoreDropdownBtn) {
    restoreDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if(selectDropdown) selectDropdown.style.display = 'none';
      window.restoreSelectedNotifications();
    });
  }

  const markReadSelectedBtn = document.getElementById('notif-mark-read-selected-btn');
  if(markReadSelectedBtn) {
    markReadSelectedBtn.addEventListener('click', window.markSelectedAsRead);
  }
  
  const markUnreadSelectedBtn = document.getElementById('notif-mark-unread-selected-btn');
  if(markUnreadSelectedBtn) {
    markUnreadSelectedBtn.addEventListener('click', window.markSelectedAsUnread);
  }

  const markAllReadBtn = document.getElementById('notif-mark-all-read-btn');
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', window.markAllNotificationsRead);
  }

  // Preview buttons
  const previewBackBtn = document.getElementById('notif-preview-back-btn');
  if (previewBackBtn) previewBackBtn.addEventListener('click', window.closeNotificationPreview);
  
  const previewDeleteBtn = document.getElementById('notif-preview-delete-btn');
  if (previewDeleteBtn) {
    previewDeleteBtn.addEventListener('click', () => {
      if (currentPreviewNotifId) {
        window.deleteSingleNotification(currentPreviewNotifId);
        // Do not close instantly, let the delete API reload or just go back
      }
    });
  }
  
  const previewUnreadBtn = document.getElementById('notif-preview-unread-btn');
  if (previewUnreadBtn) {
    previewUnreadBtn.addEventListener('click', async () => {
      if (currentPreviewNotifId) {
        try {
          await fetch(`/api/notifications/${currentPreviewNotifId}/unread`, {
            method: 'PATCH',
            headers: { "Authorization": "Bearer " + localStorage.getItem("userToken"), "x-user-email": (() => { try { return JSON.parse(localStorage.getItem("currentUser")).email; } catch(e){return "";} })() }
          });
          window.closeNotificationPreview();
        } catch (e) {}
      }
    });
  }

  // Notification mute toggle on the settings section
  const notifMuteToggle = document.getElementById('notif-page-mute-toggle');
  const notifMuteSlider = document.getElementById('notif-mute-slider');
  const notifMuteKnob = document.getElementById('notif-mute-knob');

  function applyMuteState(isMuted) {
    if (!notifMuteSlider || !notifMuteKnob || !notifMuteToggle) return;
    if (isMuted) {
      notifMuteToggle.checked = false;
      notifMuteSlider.style.background = '#cbd5e1';
      notifMuteKnob.style.transform = 'translateX(0)';
    } else {
      notifMuteToggle.checked = true;
      notifMuteSlider.style.background = '#22c55e';
      notifMuteKnob.style.transform = 'translateX(20px)';
    }
  }

  // Init toggle state from localStorage
  const isMutedNow = localStorage.getItem('notif-muted') === 'true';
  applyMuteState(isMutedNow);

  if (notifMuteToggle) {
    notifMuteToggle.addEventListener('change', () => {
      const nowEnabled = notifMuteToggle.checked;
      if (nowEnabled) {
        localStorage.removeItem('notif-muted');
        applyMuteState(false);
        // Re-fetch badge
        if (typeof fetchUnreadCount !== 'undefined') fetchUnreadCount();
      } else {
        localStorage.setItem('notif-muted', 'true');
        applyMuteState(true);
        // Hide badge immediately
        const badge = document.getElementById('notifications-badge');
        if (badge) badge.style.display = 'none';
      }
    });
  }
});

// 9. WISHLIST GRID
function loadWishlistGrid() {
  const container = document.getElementById("wishlist-items-grid");
  if (!container) return;

  let items = [];
  try {
    items = JSON.parse(localStorage.getItem("userWishlist")) || [];
  } catch (e) { items = []; }

  if (items.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 40px 0;"><i class="fa-regular fa-heart" style="font-size: 2rem; margin-bottom: 10px; display: block; color: #ff4d6a;"></i>Your Wishlist is currently empty. Explore our store and save items to your wishlist!</div>`;
    return;
  }

  let html = "";
  items.forEach((item, idx) => {
    const variantInfo = (item.color || item.size) ? `<div class="wishlist-variant-info" style="font-size: 0.78rem; font-weight: 600; color: #64748b; margin-top: 4px; margin-bottom: 8px;"><i class="fa-solid fa-tags" style="color: #ff4d6a; margin-right: 4px;"></i>Colour: ${item.color || 'Standard'} | Size: ${item.size || 'M'}</div>` : '';
    const dateSaved = item.savedAt ? `<div style="font-size: 0.72rem; color: #94a3b8; margin-bottom: 6px;">Saved on ${item.savedAt}</div>` : '';
    
    html += `
      <div class="wishlist-card" style="position: relative;">
        <img src="${item.img || 'assets/SenpaiWorks logo.png'}" alt="${item.name}" class="wishlist-img" style="width: 100%; aspect-ratio: 3 / 4; object-fit: cover; border-radius: 8px 8px 0 0;">
        <div class="wishlist-info">
          <div class="wishlist-title">${item.name}</div>
          ${variantInfo}
          ${dateSaved}
          <div class="wishlist-price">₹${(item.price || 0).toLocaleString('en-IN')}.00</div>
          <div style="display: flex; gap: 8px; margin-top: 12px;">
            <button onclick="addWishlistItemToCart(${idx})" class="btn-order-action primary" style="flex: 1; justify-content: center; font-size: 0.82rem;">
              <i class="fa-solid fa-cart-plus"></i> Move to Cart
            </button>
            <button onclick="removeWishlistItem(${idx})" class="btn-order-action secondary" style="color: #ef4444; border-color: #fecdd3; padding: 6px 12px;" title="Remove from Wishlist">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

window.removeWishlistItem = function (idx) {
  let items = [];
  try {
    items = JSON.parse(localStorage.getItem("userWishlist")) || [];
  } catch (e) { items = []; }

  if (idx >= 0 && idx < items.length) {
    const removed = items.splice(idx, 1)[0];
    localStorage.setItem("userWishlist", JSON.stringify(items));
    
    try {
      const countsMap = JSON.parse(localStorage.getItem("product_wishlist_counts") || "{}");
      if (removed) {
        const key = removed.id || removed.name;
        countsMap[key] = items.filter(item => (removed.id && item.id === removed.id) || item.name === removed.name).length;
        localStorage.setItem("product_wishlist_counts", JSON.stringify(countsMap));
      }
    } catch (e) {}

function showToastNotice(msg) {
  let toast = document.getElementById("toast-notice");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-notice";
    toast.style.cssText = "position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #1e293b; color: white; padding: 12px 24px; border-radius: 8px; font-weight: 500; display: flex; align-items: center; gap: 8px; z-index: 10000; opacity: 0; transition: opacity 0.3s; pointer-events: none;";
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #4ade80;"></i> <span>${msg}</span>`;
  toast.style.opacity = "1";
  if (window.toastTimeout) clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

    window.dispatchEvent(new Event("wishlistUpdated"));
    loadWishlistGrid();
    showToastNotice("Item removed from your wishlist.");
  }
};

window.addWishlistItemToCart = function (idx) {
  let items = [];
  try {
    items = JSON.parse(localStorage.getItem("userWishlist")) || [];
  } catch (e) { items = []; }

  if (idx < 0 || idx >= items.length) return;
  const item = items[idx];

  let cart = localStorage.getItem("shoppingCart");
  cart = cart ? JSON.parse(cart) : [];

  const variantStr = (item.color || item.size) ? `${item.color || 'Black'} / ${item.size || 'M'}` : "Standard Edition";
  const existing = cart.find(c => c.name === item.name && c.variant === variantStr);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: item.id || ("WISHLIST-" + Date.now()),
      name: item.name,
      price: item.price || 0,
      img: item.img,
      quantity: 1,
      variant: variantStr
    });
  }

  localStorage.setItem("shoppingCart", JSON.stringify(cart));
  window.dispatchEvent(new Event("cartUpdated"));
  
  // Remove from wishlist after moving to cart
  items.splice(idx, 1);
  localStorage.setItem("userWishlist", JSON.stringify(items));
  window.dispatchEvent(new Event("wishlistUpdated"));
  
  loadWishlistGrid();
  alert(`${item.name} moved to your cart!`);
};

// 10. SAVED ADDRESSES MANAGEMENT
function getSavedAddressesList() {
  let addrs = [];
  try {
    addrs = JSON.parse(localStorage.getItem("savedUserAddresses")) || [];
  } catch (e) { addrs = []; }

  if (addrs.length === 0) {
    const currentUser = getCurrentUser();
    const defaultAddr = {
      id: "ADDR-DEF-1",
      country: "India",
      fullName: currentUser ? (currentUser.name || currentUser.firstName || "Suhas") : "Suhas",
      phone: currentUser ? (currentUser.phone || "+91 98765 43210") : "+91 98765 43210",
      pincode: "560038",
      flat: "SenpaiWorks Studio, High Street",
      street: "Indiranagar, MG Road",
      landmark: "Near Metro Station",
      city: "Bengaluru",
      state: "Karnataka",
      isDefault: true,
      instructions: "Leave package at reception"
    };
    addrs = [defaultAddr];
    localStorage.setItem("savedUserAddresses", JSON.stringify(addrs));
  }
  return addrs;
}

function loadSavedAddresses() {
  const container = document.getElementById("user-saved-addresses-grid");
  if (!container) return;

  const addrs = getSavedAddressesList();

  // 1. First Card: Add address card
  let html = `
    <div class="add-address-card" onclick="window.openAddAddressModal()" style="border: 2px dashed #cbd5e1; border-radius: 12px; min-height: 200px; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; background: #ffffff; transition: all 0.2s ease; text-align: center;">
      <div class="add-icon" style="font-size: 2.2rem; color: #cbd5e1; margin-bottom: 6px;"><i class="fa-solid fa-plus"></i></div>
      <div class="add-txt" style="font-weight: 800; color: #0f172a; font-size: 1.05rem;">Add address</div>
    </div>
  `;

  // 2. Address cards (Reduced font size, clean bottom links, SenpaiWorks black text logo)
  addrs.forEach(addr => {
    html += `
      <div class="address-card ${addr.isDefault ? 'default-address' : ''}" style="border: 1px solid #d5d9d9; border-radius: 12px; padding: 14px 16px; position: relative; background: #ffffff; display: flex; flex-direction: column; justify-content: space-between; min-height: 200px; text-align: left;">
        <div>
          ${addr.isDefault ? `
            <div style="font-size: 0.76rem; font-weight: 700; color: #565959; border-bottom: 1px solid #e7e7e7; padding-bottom: 6px; margin-bottom: 10px; display: flex; align-items: center; gap: 4px; text-align: left;">
              Default: 
              <img src="assets/Videos/SenpaiWorks logo.png" alt="SenpaiWorks Icon" style="height: 12px; width: auto; filter: brightness(0); vertical-align: middle; margin-left: 2px;">
              <img src="assets/Videos/senpaiworks name logo no bg.png" alt="SenpaiWorks Text" style="height: 10px; width: auto; filter: brightness(0); vertical-align: middle;">
            </div>
          ` : ''}
          <h4 style="font-weight: 800; color: #0f172a; margin: 0 0 4px 0; font-size: 0.9rem; text-align: left;">${addr.fullName}</h4>
          <div style="font-size: 0.81rem; color: #334155; line-height: 1.38; margin-bottom: 6px; text-align: left;">
            ${addr.flat}<br>
            ${addr.street}${addr.landmark ? ', ' + addr.landmark : ''}<br>
            ${addr.city ? addr.city.toUpperCase() : ''}, ${addr.state ? addr.state.toUpperCase() : ''} ${addr.pincode}<br>
            ${addr.country}<br>
            Phone number: ${addr.phone}
          </div>
        </div>

        <!-- Bottom Links Row: Edit | Remove | Set as Default -->
        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #e7e7e7; font-size: 0.82rem; color: #565959; font-weight: 500; text-align: left;">
          <a href="javascript:void(0)" onclick="window.openAddAddressModal('${addr.id}')" style="color: #0066c0; text-decoration: none; font-weight: 600;">Edit</a>
          &nbsp;|&nbsp;
          <a href="javascript:void(0)" onclick="window.deleteAddress('${addr.id}')" style="color: #0066c0; text-decoration: none; font-weight: 600;">Remove</a>
          ${!addr.isDefault ? ` &nbsp;|&nbsp; <a href="javascript:void(0)" onclick="window.setDefaultAddress('${addr.id}')" style="color: #0066c0; text-decoration: none; font-weight: 600;">Set as Default</a>` : ''}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

window.loadSavedAddresses = loadSavedAddresses;

window.openAddAddressModal = function (editId) {
  const gridView = document.getElementById("addresses-grid-view");
  const formView = document.getElementById("addresses-form-view");
  const title = document.getElementById("inline-addr-title");
  const breadcrumbs = document.getElementById("inline-addr-breadcrumbs");
  const submitBtn = document.getElementById("btn-submit-address");
  const form = document.getElementById("address-inline-form");

  if (!gridView || !formView || !form) return;

  if (editId) {
    const addrs = getSavedAddressesList();
    const target = addrs.find(a => a.id === editId);
    if (target) {
      document.getElementById("addr-edit-id").value = target.id;
      document.getElementById("addr-country").value = target.country || "India";
      document.getElementById("addr-fullname").value = target.fullName || "";
      document.getElementById("addr-phone").value = target.phone ? target.phone.replace(/\D/g, "").slice(-10) : "";
      document.getElementById("addr-pincode").value = target.pincode || "";
      document.getElementById("addr-flat").value = target.flat || "";
      document.getElementById("addr-street").value = target.street || "";
      document.getElementById("addr-landmark").value = target.landmark || "";
      document.getElementById("addr-city").value = target.city || "";
      document.getElementById("addr-state").value = target.state || "Karnataka";
      document.getElementById("addr-is-default").checked = !!target.isDefault;
      document.getElementById("addr-instructions").value = target.instructions || "";

      if (title) title.textContent = "Edit your address";
      if (breadcrumbs) breadcrumbs.textContent = "Edit Address";
      if (submitBtn) submitBtn.textContent = "Save changes";
    }
  } else {
    form.reset();
    document.getElementById("addr-edit-id").value = "";
    if (title) title.textContent = "Add a new address";
    if (breadcrumbs) breadcrumbs.textContent = "New Address";
    if (submitBtn) submitBtn.textContent = "Add address";
  }

  gridView.style.display = "none";
  formView.style.display = "block";

  // Smooth scroll to top of address panel
  const panel = document.getElementById("tab-panel-addresses");
  if (panel) panel.scrollIntoView({ behavior: "smooth", block: "start" });
};

window.closeAddressInlineForm = function () {
  const gridView = document.getElementById("addresses-grid-view");
  const formView = document.getElementById("addresses-form-view");
  if (gridView) gridView.style.display = "block";
  if (formView) formView.style.display = "none";
};

window.autofillLocation = function (e) {
  const evt = e || window.event;
  const btn = evt ? (evt.target ? evt.target.closest("button") : null) : null;
  const originalHtml = btn ? btn.innerHTML : '<i class="fa-solid fa-crosshairs"></i> Autofill';

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Detecting location...';
  }

  function applyLocationData(city, state, pincode, street, country) {
    const cityInput = document.getElementById("addr-city");
    const stateInput = document.getElementById("addr-state");
    const pincodeInput = document.getElementById("addr-pincode");
    const streetInput = document.getElementById("addr-street");
    const countryInput = document.getElementById("addr-country");

    if (cityInput && city) cityInput.value = city;
    if (stateInput && state) stateInput.value = state;
    if (pincodeInput && pincode) pincodeInput.value = pincode;
    if (streetInput && street && !streetInput.value) streetInput.value = street;
    if (countryInput && country) countryInput.value = country;

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Location Autofilled!';
      setTimeout(() => { btn.innerHTML = originalHtml; }, 2500);
    }
  }

  async function fetchLocFromCoords(lat, lon) {
    try {
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
      if (res.ok) {
        const data = await res.json();
        const city = data.city || data.locality || data.principalSubdivision || "Mysuru";
        const state = data.principalSubdivision || "Karnataka";
        const country = data.countryName || "India";
        const pincode = data.postcode ? data.postcode.replace(/\D/g, "").slice(0, 6) : "570016";
        const street = data.localityInfo && data.localityInfo.informative ? data.localityInfo.informative[0].name : "";

        applyLocationData(city, state, pincode, street, country);
        return true;
      }
    } catch (err) {
      console.warn("BigDataCloud lookup error:", err);
    }
    return false;
  }

  async function fetchLocFromIp() {
    try {
      const res = await fetch("https://ipapi.co/json/");
      if (res.ok) {
        const data = await res.json();
        const city = data.city || "Mysuru";
        const state = data.region || "Karnataka";
        const pincode = data.postal ? data.postal.replace(/\D/g, "").slice(0, 6) : "570016";
        const country = data.country_name || "India";

        applyLocationData(city, state, pincode, "", country);
        return true;
      }
    } catch (err) {
      console.warn("IP Geolocation lookup failed:", err);
    }
    return false;
  }

  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const ok = await fetchLocFromCoords(pos.coords.latitude, pos.coords.longitude);
        if (!ok) await fetchLocFromIp();
      },
      async (err) => {
        console.warn("Geolocation permission error/timeout:", err);
        const ok = await fetchLocFromIp();
        if (!ok) applyLocationData("Mysuru", "Karnataka", "570016", "", "India");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  } else {
    fetchLocFromIp();
  }
};

window.handleSaveAddressSubmit = function (e) {
  e.preventDefault();
  const editId = document.getElementById("addr-edit-id").value;
  const country = document.getElementById("addr-country").value;
  const fullName = document.getElementById("addr-fullname").value.trim();
  const phone = document.getElementById("addr-phone").value.trim();
  const pincode = document.getElementById("addr-pincode").value.trim();
  const flat = document.getElementById("addr-flat").value.trim();
  const street = document.getElementById("addr-street").value.trim();
  const landmark = document.getElementById("addr-landmark").value.trim();
  const city = document.getElementById("addr-city").value.trim();
  const state = document.getElementById("addr-state").value;
  const isDefault = document.getElementById("addr-is-default").checked;
  const instructions = document.getElementById("addr-instructions").value.trim();

  let addrs = getSavedAddressesList();

  if (isDefault) {
    addrs.forEach(a => a.isDefault = false);
  }

  if (editId) {
    const idx = addrs.findIndex(a => a.id === editId);
    if (idx !== -1) {
      addrs[idx] = {
        id: editId,
        country,
        fullName,
        phone,
        pincode,
        flat,
        street,
        landmark,
        city,
        state,
        isDefault,
        instructions
      };
    }
  } else {
    const newAddr = {
      id: "ADDR-" + Date.now(),
      country,
      fullName,
      phone,
      pincode,
      flat,
      street,
      landmark,
      city,
      state,
      isDefault: isDefault || addrs.length === 0,
      instructions
    };
    addrs.push(newAddr);
  }

  localStorage.setItem("savedUserAddresses", JSON.stringify(addrs));
  loadSavedAddresses();
  closeAddressInlineForm();
};

window.setDefaultAddress = function (id) {
  let addrs = getSavedAddressesList();
  addrs.forEach(a => {
    a.isDefault = (a.id === id);
  });
  localStorage.setItem("savedUserAddresses", JSON.stringify(addrs));
  loadSavedAddresses();
};

let pendingDeleteAddressId = null;

window.deleteAddress = function (id) {
  const addrs = getSavedAddressesList();
  const target = addrs.find(a => a.id === id);
  if (!target) return;

  pendingDeleteAddressId = id;

  const previewEl = document.getElementById("delete-addr-preview");
  if (previewEl) {
    previewEl.innerHTML = `
      <strong style="font-weight: 800; font-size: 0.95rem; color: #0f172a;">${target.fullName}</strong><br>
      ${target.flat}<br>
      ${target.street}${target.landmark ? ', ' + target.landmark : ''}<br>
      ${target.city ? target.city.toUpperCase() : ''}, ${target.state ? target.state.toUpperCase() : ''} ${target.pincode}<br>
      ${target.country}<br>
      Phone number: ${target.phone}
    `;
  }

  const modal = document.getElementById("delete-address-modal");
  if (modal) modal.classList.add("active");
};

window.closeDeleteAddressModal = function () {
  pendingDeleteAddressId = null;
  const modal = document.getElementById("delete-address-modal");
  if (modal) modal.classList.remove("active");
};

window.confirmDeleteAddressAction = function () {
  if (!pendingDeleteAddressId) return;

  let addrs = getSavedAddressesList();
  addrs = addrs.filter(a => a.id !== pendingDeleteAddressId);
  if (addrs.length > 0 && !addrs.some(a => a.isDefault)) {
    addrs[0].isDefault = true;
  }
  localStorage.setItem("savedUserAddresses", JSON.stringify(addrs));
  loadSavedAddresses();
  closeDeleteAddressModal();
};
