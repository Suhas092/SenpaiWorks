"use strict";

let rawCropperImage = null;
let currentZoom = 1;
let cropOffsetX = 0;
let cropOffsetY = 0;
let isDraggingCrop = false;
let dragStartX = 0;
let dragStartY = 0;
let pendingAvatarData = null;

// 3. LOAD USER PROFILE DATA
function loadUserProfileData() {
  const currentUser = typeof getCurrentUser === "function" ? getCurrentUser() : null;

  const bannerName = document.getElementById("acc-banner-name");
  const bannerEmail = document.getElementById("acc-banner-email");
  const bannerAvatar = document.getElementById("acc-banner-avatar");

  if (!currentUser) {
    if (bannerName) bannerName.textContent = "Guest User";
    if (bannerEmail) bannerEmail.textContent = "";
    if (bannerAvatar) bannerAvatar.src = "assets/default-avatar.svg";
    return;
  }

  const userAvatar = (currentUser.avatar && !currentUser.avatar.includes('rem_happy_evhesz.webp'))
    ? currentUser.avatar
    : "assets/default-avatar.svg";

  if (bannerName) bannerName.textContent = currentUser.name || currentUser.firstName || "Member";
  if (bannerEmail) bannerEmail.textContent = currentUser.email || "";
  if (bannerAvatar) bannerAvatar.src = userAvatar;

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
  if (avatarPreview) avatarPreview.src = userAvatar;

  // Social Auth Check: Hide password section for Google / Facebook users
  const passWrapper = document.getElementById("profile-password-wrapper");
  const socialBanner = document.getElementById("profile-social-auth-banner");
  const socialBannerText = document.getElementById("social-auth-banner-text");
  const secSocialBanner = document.getElementById("security-social-banner");
  const secSocialTitle = document.getElementById("security-social-title");
  const secPassFlow = document.getElementById("security-password-flow");

  if (currentUser.provider === "google" || currentUser.provider === "facebook") {
    if (passWrapper) passWrapper.style.display = "none";
    if (socialBanner) socialBanner.style.display = "block";
    if (secPassFlow) secPassFlow.style.display = "none";
    if (secSocialBanner) secSocialBanner.style.display = "block";
    const providerName = currentUser.provider === "google" ? "Google" : "Facebook";
    if (socialBannerText) {
      socialBannerText.textContent = `Account authenticated via ${providerName} (Password managed by provider)`;
    }
    if (secSocialTitle) {
      secSocialTitle.textContent = `Password Managed by ${providerName}`;
    }
  } else {
    if (passWrapper) passWrapper.style.display = "block";
    if (socialBanner) socialBanner.style.display = "none";
    if (secPassFlow) secPassFlow.style.display = "block";
    if (secSocialBanner) secSocialBanner.style.display = "none";
  }

  if (currentUser.avatar) {
    const existingImg = new Image();
    existingImg.onload = () => {
      rawCropperImage = existingImg;
    };
    existingImg.src = currentUser.avatar;
  }
}
window.loadUserProfileData = loadUserProfileData;

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
window.setupAvatarUpload = setupAvatarUpload;

function openCropModal() {
  const modal = document.getElementById("crop-avatar-modal");
  if (modal) modal.classList.add("active");
}
window.openCropModal = openCropModal;

window.closeCropModal = function () {
  const modal = document.getElementById("crop-avatar-modal");
  if (modal) modal.classList.remove("active");
  const fileInput = document.getElementById("profile-avatar-file");
  if (fileInput) fileInput.value = "";
};

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
window.setupCropZoom = setupCropZoom;

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
  const height = 300;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2;
  const cropRadius = Math.min(width, height) / 2 - 12;

  // 1. Draw original uncropped image
  const minDim = Math.min(rawCropperImage.width, rawCropperImage.height);
  const baseScale = (cropRadius * 2) / minDim;
  const drawWidth = rawCropperImage.width * baseScale * currentZoom;
  const drawHeight = rawCropperImage.height * baseScale * currentZoom;

  const dx = centerX - (drawWidth / 2) + cropOffsetX;
  const dy = centerY - (drawHeight / 2) + cropOffsetY;

  ctx.drawImage(rawCropperImage, dx, dy, drawWidth, drawHeight);

  // 2. Dark Overlay outside circle
  ctx.save();
  ctx.fillStyle = "rgba(15, 23, 42, 0.65)";
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.arc(centerX, centerY, cropRadius, 0, Math.PI * 2, true);
  ctx.fill();
  ctx.restore();

  // 3. Clear circular crop area
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, cropRadius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(rawCropperImage, dx, dy, drawWidth, drawHeight);
  ctx.restore();

  // 4. Draw Crisp White Border for circular cutout
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, cropRadius, 0, Math.PI * 2);
  ctx.stroke();
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
  ctx.beginPath();
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
window.drawCropCanvas = drawCropCanvas;

window.saveCroppedAvatar = async function () {
  const canvas = document.getElementById("crop-canvas");
  const container = canvas ? canvas.parentElement : null;
  if (!canvas || !container || !rawCropperImage) return;

  const width = canvas.width || 380;
  const height = 300;
  const cropRadius = Math.min(width, height) / 2 - 12;

  const outputSize = 400;
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

  // Show preview immediately so the UI feels fast
  const avatarPreview = document.getElementById("profile-avatar-preview");
  const bannerAvatar = document.getElementById("acc-banner-avatar");
  if (avatarPreview) avatarPreview.src = croppedBase64;
  if (bannerAvatar) bannerAvatar.src = croppedBase64;

  window.closeCropModal();
  showStatus("Uploading avatar...", true);

  // Upload to R2 immediately — store URL, not the blob, in pendingAvatarData
  try {
    const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const resp = await fetch("/api/user/avatar", {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify({ imageBase64: croppedBase64 })
    });

    const data = await resp.json();

    if (!resp.ok || !data.success) {
      showStatus(data.error || "Avatar upload failed. Please try again.", false);
      // Revert previews
      const currentUser = window.Auth?.getCurrentUser?.() || {};
      const prev = currentUser.avatar || "assets/default-avatar.svg";
      if (avatarPreview) avatarPreview.src = prev;
      if (bannerAvatar) bannerAvatar.src = prev;
      return;
    }

    // R2 URL stored — profile save will send this string, not a blob
    pendingAvatarData = data.avatarUrl;

    // Update local user cache so the header avatar refreshes immediately
    if (window.Auth?.saveUserProfile) {
      const currentUser = window.Auth.getCurrentUser?.() || {};
      window.Auth.saveUserProfile({ ...currentUser, avatar: data.avatarUrl });
    }

    if (typeof window.checkFormChanges === "function") {
      window.checkFormChanges();
    }

    showStatus("Avatar updated successfully!", true);
  } catch (err) {
    console.error("Avatar upload error:", err);
    showStatus("Network error uploading avatar. Please try again.", false);
  }
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
    let user = (typeof getCurrentUser === "function" ? getCurrentUser() : null) || {};
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
window.setupFormHandlers = setupFormHandlers;
