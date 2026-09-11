function showToastNotice(msg) {
  let toast = document.getElementById("detail-toast-notice");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "detail-toast-notice";
    toast.className = "category-toast-notification";
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #4ade80;"></i> <span>${msg}</span>`;
  if (window.toastTimeout) clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// Definition of showWishlistDialog removed from here

function isUserLoggedIn() {
  if (window.Auth && typeof window.Auth.isLoggedIn === "function") {
    return window.Auth.isLoggedIn();
  }
  const isLoggedOut = localStorage.getItem("userLoggedOut") === "true" || localStorage.getItem("isLoggedIn") === "false";
  if (isLoggedOut) return false;
  const user = localStorage.getItem("currentUser");
  return !!user;
}

function runInitProductDetail() {
  if (window.dbProductsPromise) {
    window.dbProductsPromise
      .catch(e => console.warn("dbProductsPromise error in store-detail:", e))
      .finally(() => {
        initProductDetailPage().catch(err => console.error("Error in initProductDetailPage:", err));
      });
  } else {
    initProductDetailPage().catch(err => console.error("Error in initProductDetailPage:", err));
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", runInitProductDetail);
} else {
  runInitProductDetail();
}

function findProductMatch(searchId, productList) {
  if (!Array.isArray(productList) || productList.length === 0) return null;
  if (!searchId) return productList[0];

  const cleanId = String(decodeURIComponent(searchId)).trim().toLowerCase();
  const rawId = cleanId.replace(/[^a-z0-9]/gi, '');

  let found = productList.find(p => String(p.id).toLowerCase() === cleanId);
  if (found) return found;

  found = productList.find(p => String(p.name).toLowerCase() === cleanId);
  if (found) return found;

  found = productList.find(p => String(p.id).replace(/[^a-z0-9]/gi, '') === rawId);
  if (found) return found;

  const baseSlug = cleanId.replace(/-tshirt$|-hoodie$/, '');
  found = productList.find(p => String(p.id).toLowerCase().includes(baseSlug) || String(p.name).toLowerCase().includes(baseSlug));
  if (found) return found;

  if (cleanId.includes("itachi")) {
    found = productList.find(p => String(p.id).toLowerCase().includes("itachi") || String(p.name).toLowerCase().includes("itachi"));
    if (found) return found;
  }
  if (cleanId.includes("zoro")) {
    found = productList.find(p => String(p.id).toLowerCase().includes("zoro") || String(p.name).toLowerCase().includes("zoro"));
    if (found) return found;
  }
  if (cleanId.includes("kaneki")) {
    found = productList.find(p => String(p.id).toLowerCase().includes("kaneki") || String(p.name).toLowerCase().includes("kaneki"));
    if (found) return found;
  }

  return null;
}

async function initProductDetailPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  let product = null;

  // 1. Try direct ID fetch from backend API
  if (productId) {
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(productId)}`);
      if (res.ok) {
        product = await res.json();
      }
    } catch (err) {
      console.warn("Direct ID fetch failed, searching local catalog...", err);
    }
  }

  // 2. If direct ID fetch failed, fetch full product array from API
  if (!product) {
    try {
      const res = await fetch(`/api/products`);
      if (res.ok) {
        const all = await res.json();
        if (Array.isArray(all) && all.length > 0) {
          product = findProductMatch(productId, all);
        }
      }
    } catch (err) {
      console.warn("Full API products fetch failed:", err);
    }
  }

  // 3. Fallback to window.PRODUCTS or global PRODUCTS
  if (!product) {
    let allProducts = window.PRODUCTS || (typeof PRODUCTS !== "undefined" ? [...PRODUCTS] : []);
    product = findProductMatch(productId, allProducts);
  }

  if (!product) {
    console.warn("Requested product not found:", productId);
    displayProductNotFound();
    return;
  }

  const isClothing = product.category === "Merchandise" || product.category === "Oversized T-Shirts" || product.category === "Hoodies";

  // 1. Breadcrumbs
  const breadcrumbCurrent = document.getElementById("breadcrumb-current");
  const detailBreadcrumbs = document.getElementById("detail-breadcrumbs");
  if (breadcrumbCurrent) breadcrumbCurrent.textContent = product.name;
  if (detailBreadcrumbs) {
    detailBreadcrumbs.innerHTML = `
      <a href="home.html">Home</a> &gt; 
      <a href="store.html">Store</a> &gt; 
      <a href="store.html?category=${encodeURIComponent(product.category)}">${product.category}</a> &gt; 
      <span id="breadcrumb-current">${product.name}</span>
    `;
  }

  // 2. Title & Main Image Preview
  const productTitle = document.getElementById("product-title");
  if (productTitle) productTitle.textContent = product.name;

  const shareBtn = document.getElementById("action-share");
  const wishlistBtn = document.getElementById("action-wishlist");

  if (shareBtn) {
    shareBtn.onclick = () => {
      navigator.clipboard.writeText(window.location.href);
      const icon = shareBtn.querySelector("i");
      if (icon) icon.className = "fa-solid fa-check";
      shareBtn.style.color = "#10b981";
      setTimeout(() => {
        if (icon) icon.className = "fa-solid fa-arrow-up-from-bracket";
        shareBtn.style.color = "";
      }, 2000);
    };
  }

  function updateWishlistCountBadge() {
    if (!wishlistBtn || !product) return;
    let wishlistArr = [];
    try {
      wishlistArr = JSON.parse(localStorage.getItem("userWishlist")) || [];
    } catch (e) { wishlistArr = []; }

    let isWishlisted = wishlistArr.some(item => (product.id && item.id === product.id) || item.name === product.name);
    const icon = wishlistBtn.querySelector("i");

    if (icon) {
      icon.className = isWishlisted ? "fa-solid fa-heart" : "fa-regular fa-heart";
      icon.style.color = isWishlisted ? "#ff4d6a" : "";
    }
  }

  if (wishlistBtn && product) {
    updateWishlistCountBadge();

    // Removing dialog definition from here as it will be moved to the global scope.

    window.addEventListener("wishlistUpdated", updateWishlistCountBadge);
  }

  // 3. Ratings Summary
  const ratingStarsPreview = document.getElementById("rating-stars-preview");
  const avgRatingPreview = document.getElementById("avg-rating-preview");
  const reviewsCountPreview = document.getElementById("reviews-count-preview");

  if (ratingStarsPreview) ratingStarsPreview.innerHTML = getStarsHTML(product.rating || 5.0);
  if (avgRatingPreview) avgRatingPreview.textContent = (product.rating || 5.0).toFixed(1);
  if (reviewsCountPreview) {
    reviewsCountPreview.textContent = `(${product.ratingCount || 48} reviews)`;
  }

  // 4. Price & Discount Badge Layout
  const productPrice = document.getElementById("product-price");
  const originalPrice = document.getElementById("original-price");
  const discountBadge = document.getElementById("discount-badge");
  const stockStatus = document.getElementById("stock-status");

  const priceVal = typeof product.price === "number" ? product.price : 899;
  const origVal = product.originalPrice ? product.originalPrice : (isClothing ? Math.round(priceVal * 1.6) : Math.round(priceVal * 1.5));
  const savingsPct = Math.round(((origVal - priceVal) / origVal) * 100);

  if (productPrice) productPrice.textContent = `₹${priceVal.toLocaleString('en-IN')}`;
  if (originalPrice) {
    originalPrice.textContent = `₹${origVal.toLocaleString('en-IN')}`;
    originalPrice.style.display = "inline";
  }
  if (discountBadge) {
    discountBadge.textContent = `${savingsPct}% OFF`;
    discountBadge.style.display = "inline-block";
  }

  const isAvailable = product.available !== false;

  if (stockStatus) {
    if (!isAvailable) {
      stockStatus.textContent = "Currently Unavailable ❌";
      stockStatus.style.color = "#ef4444";
      stockStatus.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
      stockStatus.style.borderColor = "rgba(239, 68, 68, 0.3)";
    } else {
      stockStatus.textContent = product.type === "digital" ? "Instant Delivery" : "In Stock (India Only 🇮🇳)";
      stockStatus.style.color = product.type === "digital" ? "#10b981" : "#b5947a";
      stockStatus.style.backgroundColor = product.type === "digital" ? "#ecfdf5" : "#faf8f5";
      stockStatus.style.borderColor = product.type === "digital" ? "#a7f3d0" : "#e5e7eb";
    }
  }

  // Parse variantsData JSON
  let vData = product.variantsData;
  if (typeof vData === "string" && vData) {
    try { vData = JSON.parse(vData); } catch (e) { vData = null; }
  }

  // 5. Description Text Toggle
  const productDesc = document.getElementById("product-description");
  const descToggleBtn = document.getElementById("desc-toggle-btn");
  const descPanel = document.querySelector(".description-panel");

  if (productDesc) {
    productDesc.innerHTML = `<p>${product.description}</p>`;
  }

  if (descToggleBtn && descPanel) {
    descToggleBtn.onclick = () => {
      const isExpanded = descPanel.classList.toggle("expanded");
      descToggleBtn.textContent = isExpanded ? "Show Less" : "Show More";
    };
  }

  // 6. State Machine for Color + Size Selection & Variant-Specific Gallery
  const colorGroup = document.getElementById("color-selection-group");
  const colorSwatches = document.getElementById("color-swatches");
  const selectedColorLabel = document.getElementById("selected-color-label");

  const sizeGroup = document.getElementById("size-selection-group");
  const sizeGrid = document.getElementById("size-buttons-grid");
  const sizeGuideLink = document.getElementById("view-size-guide-btn");

  const addCartBtn = document.getElementById("action-add-cart");
  const buyNowBtn = document.getElementById("action-buy-now");
  const titleWishlistBtn = document.getElementById("action-wishlist");

  let colorsList = [];
  if (product.colorVariants && Array.isArray(product.colorVariants) && product.colorVariants.length > 0) {
    colorsList = product.colorVariants.map(v => ({
      name: v.name,
      hex: v.colorCode || (v.name.toLowerCase() === 'white' ? '#ffffff' : '#111111'),
      img: v.img || product.img,
      available: v.available !== false
    }));
  } else if (vData && vData.colors) {
    colorsList = vData.colors.map(c => ({
      name: c.name,
      hex: c.hex,
      img: c.img || product.img,
      available: c.available !== false
    }));
  } else {
    colorsList = [
      { name: "Black", hex: "#111111", img: product.img, available: true },
      { name: "White", hex: "#ffffff", img: product.img, available: true }
    ];
  }

  let sizesList = (vData && vData.sizes) ? vData.sizes : [
    { name: "S", available: true },
    { name: "M", available: true },
    { name: "L", available: true },
    { name: "XL", available: false },
    { name: "XXL", available: false }
  ];

  let selectedColor = colorsList[0] ? colorsList[0].name : "Black";
  const requestedColor = urlParams.get("color");
  if (requestedColor) {
    const matchedColor = colorsList.find(c => c.name.toLowerCase() === requestedColor.toLowerCase());
    if (matchedColor) selectedColor = matchedColor.name;
  }
  let selectedSize = sizesList[0] ? sizesList[0].name : "M";

  // Check if product is already in shopping cart
  const checkInCart = () => {
    try {
      const cartStr = localStorage.getItem("shoppingCart");
      const cart = cartStr ? JSON.parse(cartStr) : [];
      const variantStr = `${selectedColor} / ${selectedSize}`;
      return cart.some(c => (c.id === product.id || (c.name && c.name.toLowerCase() === product.name.toLowerCase())) && c.variant === variantStr);
    } catch (e) { return false; }
  };

  function checkVariantCombinationAvailable(cName, sName) {
    const cObj = colorsList.find(c => c.name === cName);
    const sObj = sizesList.find(s => s.name === sName);

    if (cObj && cObj.available === false) return false;
    if (sObj && sObj.available === false) return false;
    if (product.available === false) return false;

    return true;
  }

  function updateActionButtonsState() {
    const isAvail = checkVariantCombinationAvailable(selectedColor, selectedSize);

    let wishlistArr = [];
    try {
      wishlistArr = JSON.parse(localStorage.getItem("userWishlist")) || [];
    } catch (e) { wishlistArr = []; }

    const variantId = `${product.id}-${selectedColor.toLowerCase().replace(/\s+/g, '-')}-${selectedSize.toLowerCase()}`;
    const isVariantWishlisted = wishlistArr.some(item => item.variantId === variantId || (item.id === product.id && item.color === selectedColor && item.size === selectedSize));

    if (isAvail) {
      if (buyNowBtn) {
        buyNowBtn.disabled = false;
        buyNowBtn.textContent = "BUY NOW";
        buyNowBtn.style.opacity = "1";
        buyNowBtn.style.cursor = "pointer";
        buyNowBtn.style.pointerEvents = "auto";
      }
      if (addCartBtn) {
        addCartBtn.disabled = false;
        addCartBtn.textContent = checkInCart() ? "Added to Cart ✓" : "ADD TO CART";
        addCartBtn.style.opacity = "1";
        addCartBtn.style.cursor = "pointer";
        addCartBtn.style.pointerEvents = "auto";
        addCartBtn.onclick = () => {
          let cart = [];
          try {
            cart = JSON.parse(localStorage.getItem("shoppingCart")) || [];
          } catch (e) { cart = []; }

          const variantStr = `${selectedColor} / ${selectedSize}`;
          const existingIdx = cart.findIndex(c => c.name === product.name && c.variant === variantStr);

          if (existingIdx > -1) {
            cart.splice(existingIdx, 1);
            localStorage.setItem("shoppingCart", JSON.stringify(cart));
            window.dispatchEvent(new Event("cartUpdated"));
            
            addCartBtn.textContent = "ADD TO CART";
            addCartBtn.classList.remove("added-in-cart");
            
            showToastNotice(`Removed ${product.name} from Cart`);
          } else {
            window.addToCart({
              id: product.id,
              name: product.name,
              price: product.price,
              img: (colorsList.find(c => c.name === selectedColor) || {}).img || product.img,
              type: product.type,
              variant: variantStr
            });
            addCartBtn.textContent = "ADDED TO CART ✓";
            addCartBtn.classList.add("added-in-cart");
            
            if (window.showCartModal) {
              window.showCartModal("Hooray! Your product is successfully added to cart.");
            } else {
              showToastNotice(`Added ${product.name} to your Cart!`);
            }
          }
        };
      }
      if (titleWishlistBtn) {
        titleWishlistBtn.style.display = "none";
      }
    } else {
      if (buyNowBtn) {
        buyNowBtn.disabled = true;
        buyNowBtn.textContent = "UNAVAILABLE";
        buyNowBtn.style.opacity = "0.5";
        buyNowBtn.style.cursor = "not-allowed";
        buyNowBtn.style.pointerEvents = "none";
      }
      if (addCartBtn) {
        addCartBtn.disabled = false;
        addCartBtn.textContent = isVariantWishlisted ? "SAVED TO WISHLIST ✓" : "SAVE TO WISHLIST ❤️";
        addCartBtn.style.opacity = "1";
        addCartBtn.style.cursor = "pointer";
        addCartBtn.style.pointerEvents = "auto";
        addCartBtn.onclick = saveCurrentVariantToWishlist;
      }
      if (titleWishlistBtn) {
        titleWishlistBtn.style.display = "inline-flex";
        const icon = titleWishlistBtn.querySelector("i");
        if (icon) {
          icon.className = isVariantWishlisted ? "fa-solid fa-heart" : "fa-regular fa-heart";
          icon.style.color = isVariantWishlisted ? "#ff4d6a" : "";
        }
      }
    }
  }

  function renderVariantGallery(cName) {
    const cObj = colorsList.find(c => c.name === cName);
    const mainImg = document.getElementById("main-preview-img");
    const thumbGallery = document.getElementById("thumbnail-gallery");

    const colorImg = (cObj && cObj.img) ? cObj.img : product.img;

    if (mainImg) {
      mainImg.style.opacity = "0";
      setTimeout(() => {
        mainImg.src = colorImg;
        mainImg.style.opacity = "1";
      }, 150);
    }

    if (thumbGallery) {
      let galleryImages = [colorImg];
      if (product.additionalImages) {
        if (Array.isArray(product.additionalImages)) {
          galleryImages.push(...product.additionalImages);
        } else if (typeof product.additionalImages === 'string' && product.additionalImages.trim() !== '') {
          galleryImages.push(...product.additionalImages.split('\n').map(s => s.trim()).filter(Boolean));
        }
      }
      galleryImages = [...new Set(galleryImages)].filter(Boolean);

      thumbGallery.innerHTML = galleryImages.map((imgUrl, idx) => `
        <div class="gallery-thumb ${idx === 0 ? 'active' : ''}" data-img="${imgUrl.replace(/"/g, "&quot;")}" title="${cName} View ${idx + 1}">
          <img src="${imgUrl}" alt="${cName} ${product.name} View ${idx + 1}">
        </div>
      `).join("");

      const thumbs = thumbGallery.querySelectorAll(".gallery-thumb");
      thumbs.forEach(thumb => {
        thumb.addEventListener("click", () => {
          thumbs.forEach(t => t.classList.remove("active"));
          thumb.classList.add("active");
          const imgUrl = thumb.getAttribute("data-img");
          if (mainImg && imgUrl) {
            mainImg.style.opacity = "0";
            setTimeout(() => {
              mainImg.src = imgUrl;
              mainImg.style.opacity = "1";
            }, 150);
          }
        });
      });
    }
  }

  if (isClothing) {
    if (colorGroup) colorGroup.style.display = "block";
    if (selectedColorLabel) selectedColorLabel.textContent = selectedColor;

    if (colorSwatches) {
      colorSwatches.innerHTML = colorsList.map((c, idx) => {
        const cAvail = c.available !== false && isAvailable;
        const activeClass = (c.name === selectedColor) ? 'active' : '';
        const tileImg = c.img || product.img;
        const outBadge = cAvail ? '' : `<span class="color-tile-badge-out">UNAVAILABLE</span>`;
        const titleText = `${c.name} ${cAvail ? '✅' : '❌ (Currently Unavailable)'}`;

        return `
          <button type="button" class="color-tile-card ${activeClass}" title="${titleText}" data-color="${c.name}">
            ${outBadge}
            <div class="color-tile-img-wrap">
              <img src="${tileImg}" alt="${c.name} ${product.name}">
            </div>
            <span class="color-tile-name">${c.name}</span>
          </button>
        `;
      }).join("");

      const tileBtns = colorSwatches.querySelectorAll(".color-tile-card");
      tileBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          colorSwatches.querySelectorAll(".color-tile-card").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          selectedColor = btn.getAttribute("data-color");
          if (selectedColorLabel) selectedColorLabel.textContent = selectedColor;

          renderVariantGallery(selectedColor);
          updateActionButtonsState();
        });
      });
    }

    if (sizeGroup) sizeGroup.style.display = "block";
    if (sizeGuideLink) sizeGuideLink.style.display = "inline";

    if (sizeGrid) {
      sizeGrid.innerHTML = sizesList.map((szObj, idx) => {
        const szAvail = szObj.available !== false && isAvailable;
        const activeClass = (szObj.name === selectedSize) ? 'active' : '';
        const styleAttr = szAvail ? '' : 'style="text-decoration: line-through; opacity: 0.6;"';
        return `<button type="button" class="size-btn ${activeClass}" ${styleAttr} data-size="${szObj.name}">${szObj.name} ${szAvail ? '' : '❌'}</button>`;
      }).join("");

      const sizeBtns = sizeGrid.querySelectorAll(".size-btn");
      sizeBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          sizeGrid.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          selectedSize = btn.getAttribute("data-size");
          updateActionButtonsState();
        });
      });
    }
  } else {
    if (colorGroup) colorGroup.style.display = "none";
    if (sizeGroup) sizeGroup.style.display = "none";
  }

  // Wishlist handler for saving exact variant
  const saveCurrentVariantToWishlist = () => {
    if (!isUserLoggedIn()) {
      showToastNotice("Please sign in to save products to your Wishlist!");
      setTimeout(() => {
        window.location.href = "login.html?redirect=" + encodeURIComponent(window.location.href);
      }, 1200);
      return;
    }

    let wishlistArr = [];
    try {
      wishlistArr = JSON.parse(localStorage.getItem("userWishlist")) || [];
    } catch (e) { wishlistArr = []; }

    const cObj = colorsList.find(c => c.name === selectedColor);
    const variantImg = (cObj && cObj.img) ? cObj.img : product.img;
    const variantId = `${product.id}-${(selectedColor || '').toLowerCase().replace(/\s+/g, '-')}-${(selectedSize || '').toLowerCase()}`;

    const existingIdx = wishlistArr.findIndex(item => item.variantId === variantId || (item.id === product.id && item.color === selectedColor && item.size === selectedSize));

    if (existingIdx > -1) {
      wishlistArr.splice(existingIdx, 1);
      showToastNotice(`Removed ${selectedColor || 'Standard'} from Wishlist`);
    } else {
      wishlistArr.push({
        variantId: variantId,
        id: product.id,
        name: product.name,
        price: product.price,
        type: product.type || "physical",
        img: variantImg,
        color: selectedColor,
        size: selectedSize,
        category: product.category || "Merchandise",
        savedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      });
      window.showWishlistModal("Your item has been successfully added to your Wishlist.");
      localStorage.setItem("wishlist_has_unseen_items", "true");
    }

    localStorage.setItem("userWishlist", JSON.stringify(wishlistArr));

    try {
      const countsMap = JSON.parse(localStorage.getItem("product_wishlist_counts") || "{}");
      const key = product.id || product.name;
      countsMap[key] = wishlistArr.filter(item => (product.id && item.id === product.id) || item.name === product.name).length;
      localStorage.setItem("product_wishlist_counts", JSON.stringify(countsMap));
    } catch(e) {}

    window.dispatchEvent(new Event("wishlistUpdated"));
    if (typeof updateWishlistCountBadge === "function") updateWishlistCountBadge();
    updateActionButtonsState();
  };

  if (titleWishlistBtn) titleWishlistBtn.onclick = saveCurrentVariantToWishlist;

window.showWishlistModal = function(msg) {
  let modal = document.getElementById("custom-wishlist-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "custom-wishlist-modal";
    modal.innerHTML = `
      <div style="background: white; padding: 24px; border-radius: 12px; text-align: center; max-width: 340px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
        <h3 style="margin: 0 0 12px 0; font-family: 'Outfit', sans-serif; color: #0f172a;">Added to Wishlist</h3>
        <p style="margin: 0 0 20px 0; color: #64748b; font-size: 0.95rem; line-height: 1.5;">${msg}</p>
        <div style="display: flex; gap: 10px; margin-top: 10px;">
          <button onclick="document.getElementById('custom-wishlist-modal').style.opacity='0'; setTimeout(()=>document.getElementById('custom-wishlist-modal').style.display='none', 200);" style="flex: 1; background: #e2e8f0; color: #0f172a; border: none; padding: 10px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s;">Cancel</button>
          <button onclick="window.location.href='profile.html#wishlist'" style="flex: 1; background: #3b82f6; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: 600; cursor: pointer;">View Wishlist</button>
        </div>
      </div>
    `;
    modal.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.4); display: none; align-items: center; justify-content: center; z-index: 10000; backdrop-filter: blur(4px); opacity: 0; transition: opacity 0.2s;";
    document.body.appendChild(modal);
  } else {
    modal.querySelector("p").textContent = msg;
  }
  modal.style.display = "flex";
  setTimeout(() => modal.style.opacity = "1", 10);
};

window.showCartModal = function(msg) {
  let modal = document.getElementById("custom-cart-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "custom-cart-modal";
    modal.innerHTML = `
      <div style="background: white; padding: 24px; border-radius: 12px; text-align: center; max-width: 340px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
        <i class="fa-solid fa-bag-shopping" style="color: #3b82f6; font-size: 2.5rem; margin-bottom: 16px;"></i>
        <h3 style="margin: 0 0 12px 0; font-family: 'Outfit', sans-serif; color: #0f172a;">Cart Updated</h3>
        <p style="margin: 0 0 20px 0; color: #64748b; font-size: 0.95rem; line-height: 1.5;">${msg}</p>
        <div style="display: flex; gap: 10px; justify-content: stretch;">
          <button onclick="document.getElementById('custom-cart-modal').style.opacity='0'; setTimeout(()=>document.getElementById('custom-cart-modal').style.display='none', 200);" style="flex: 1; background: #e2e8f0; color: #0f172a; border: none; padding: 10px; border-radius: 8px; font-weight: 600; cursor: pointer;">Cancel</button>
          <button onclick="window.location.href='cart.html'" style="flex: 1; background: #000000ff; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: 600; cursor: pointer;">Go to Cart</button>
        </div>
      </div>
    `;
    modal.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.4); display: none; align-items: center; justify-content: center; z-index: 10000; backdrop-filter: blur(4px); opacity: 0; transition: opacity 0.2s;";
    document.body.appendChild(modal);
  } else {
    modal.querySelector("p").textContent = msg;
  }
  modal.style.display = "flex";
  setTimeout(() => modal.style.opacity = "1", 10);
};

  if (addCartBtn) {
    addCartBtn.onclick = () => {
      let cart = [];
      try {
        cart = JSON.parse(localStorage.getItem("shoppingCart")) || [];
      } catch (e) { cart = []; }

      const variantStr = `${selectedColor} / ${selectedSize}`;
      const existingIdx = cart.findIndex(c => c.name === product.name && c.variant === variantStr);

      if (existingIdx > -1) {
        cart.splice(existingIdx, 1);
        localStorage.setItem("shoppingCart", JSON.stringify(cart));
        window.dispatchEvent(new Event("cartUpdated"));
        
        addCartBtn.textContent = "ADD TO CART";
        addCartBtn.classList.remove("added-in-cart");
        
        showToastNotice(`Removed ${product.name} from Cart`);
      } else {
        window.addToCart({
          id: product.id,
          name: product.name,
          price: product.price,
          img: (colorsList.find(c => c.name === selectedColor) || {}).img || product.img,
          type: product.type,
          variant: variantStr
        });

        addCartBtn.textContent = "ADDED TO CART ✓";
        addCartBtn.classList.add("added-in-cart");
        
        window.showCartModal("Hooray! Your product is successfully added to cart.");
      }
    };
  }

  if (buyNowBtn) {
    buyNowBtn.onclick = () => {
      const doBuyNow = () => {
        let cart = localStorage.getItem("shoppingCart");
        cart = cart ? JSON.parse(cart) : [];

        const existing = cart.find(c => c.id === product.id && c.variant === `${selectedColor} / ${selectedSize}`);
        if (existing) {
          existing.quantity += 1;
        } else {
          cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            img: (colorsList.find(c => c.name === selectedColor) || {}).img || product.img,
            type: product.type || "physical",
            quantity: 1,
            variant: `${selectedColor} / ${selectedSize}`
          });
        }
        localStorage.setItem("shoppingCart", JSON.stringify(cart));
        window.location.href = "checkout.html";
      };

      if (window.checkAuthOrPrompt) {
        window.checkAuthOrPrompt("proceed with Instant Buy", doBuyNow);
      } else {
        doBuyNow();
      }
    };
  }

  // Initialize initial gallery and button states
  renderVariantGallery(selectedColor);
  updateActionButtonsState();

  // 9. Interactive Gallery switcher
  const mainImg = document.getElementById("main-preview-img");
  const thumbGallery = document.getElementById("thumbnail-gallery");
  if (mainImg) {
    mainImg.src = product.img;
    mainImg.alt = product.name;
    mainImg.style.opacity = "1";
    mainImg.style.display = "block";
    mainImg.onerror = function () {
      this.onerror = null;
      this.src = "https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/avatars/rem_happy_evhesz.webp";
    };
  }

  if (thumbGallery) {
    let images = [];
    if (product.img) images.push(product.img);

    if (Array.isArray(product.additionalImages) && product.additionalImages.length > 0) {
      images.push(...product.additionalImages);
    } else if (typeof product.additionalImages === "string" && product.additionalImages.trim()) {
      images.push(...product.additionalImages.split("\n").map(s => s.trim()).filter(Boolean));
    }

    if (product.colorVariants && Array.isArray(product.colorVariants)) {
      product.colorVariants.forEach(v => {
        if (v.img && !images.includes(v.img)) {
          images.push(v.img);
        }
      });
    }

    images = [...new Set(images)].filter(Boolean);

    if (images.length === 0) {
      images = [product.img || "https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/avatars/rem_happy_evhesz.webp"];
    }

    thumbGallery.innerHTML = images.map((imgUrl, idx) => `
      <div class="gallery-thumb ${idx === 0 ? 'active' : ''}" data-img="${imgUrl.replace(/"/g, "&quot;")}" title="View angle ${idx + 1}">
        <img src="${imgUrl}" alt="${product.name} Sub-image ${idx + 1}">
      </div>
    `).join("");

    const thumbs = thumbGallery.querySelectorAll(".gallery-thumb");
    thumbs.forEach(thumb => {
      thumb.addEventListener("click", () => {
        thumbs.forEach(t => t.classList.remove("active"));
        thumb.classList.add("active");
        const imgUrl = thumb.getAttribute("data-img");
        if (mainImg && imgUrl) {
          mainImg.style.opacity = "0";
          setTimeout(() => {
            mainImg.src = imgUrl;
            mainImg.style.opacity = "1";
          }, 150);
        }
      });
    });
  }

  // 10. Recommended Slider / "Other Color Options" Section
  const piwSlider = document.getElementById("piw-slider");
  const piwSection = document.getElementById("pair-it-with-section");
  const piwHeader = document.querySelector("#pair-it-with-section .piw-header h3");

  if (piwSlider) {
    if (product.colorVariants && product.colorVariants.length > 0) {
      if (piwHeader) piwHeader.textContent = "Other Color Options";
      if (piwSection) piwSection.style.display = "block";
      piwSlider.innerHTML = product.colorVariants.map(variant => `
        <div class="piw-card" style="cursor: pointer;" onclick="switchDetailColorVariant('${variant.img.replace(/'/g, "\\'")}')">
          <div class="piw-card-img-wrap">
            <img src="${variant.img}" alt="${variant.name}">
          </div>
          <h4>${variant.name} T-Shirt</h4>
          <div class="piw-card-price-row">
            <span class="piw-card-price" style="font-size: 0.8rem; font-weight: 700; color: #111;">${variant.name}</span>
            <button class="piw-card-add-btn" style="padding: 5px 10px; font-size: 0.75rem;">
              Select
            </button>
          </div>
        </div>
      `).join("");
    } else {
      const catalog = window.PRODUCTS || (typeof PRODUCTS !== "undefined" ? PRODUCTS : []);
      const recommended = catalog.filter(p => p.id !== product.id).slice(0, 3);
      if (recommended.length > 0) {
        if (piwSection) piwSection.style.display = "block";
        piwSlider.innerHTML = recommended.map(p => {
          const recPrice = (p.category === "Merchandise" || p.type === "physical") ? "₹1,299" : `$${p.price.toFixed(0)}`;
          return `
            <div class="piw-card">
              <div class="piw-card-img-wrap">
                <a href="store-detail.html?id=${p.id}">
                  <img src="${p.img}" alt="${p.name}">
                </a>
              </div>
              <h4><a href="store-detail.html?id=${p.id}">${p.name}</a></h4>
              <div class="piw-card-price-row">
                <span class="piw-card-price">${recPrice}</span>
                <button class="piw-card-add-btn" onclick="addToCart({ id: '${p.id}', name: '${p.name.replace(/'/g, "\\'")}', price: ${p.price}, img: '${p.img}', type: '${p.type}' })">
                  <i class="fa-solid fa-cart-plus"></i> Add
                </button>
              </div>
            </div>
          `;
        }).join("");
      } else {
        if (piwSection) piwSection.style.display = "none";
      }
    }
  }

  window.switchDetailColorVariant = function (imgUrl) {
    const mainImg = document.getElementById("main-preview-img");
    if (mainImg && imgUrl) {
      mainImg.style.opacity = "0";
      setTimeout(() => {
        mainImg.src = imgUrl;
        mainImg.style.opacity = "1";
      }, 150);
    }
  };

  const prevArrow = document.getElementById("piw-arrow-left");
  const nextArrow = document.getElementById("piw-arrow-right");
  if (prevArrow && nextArrow) {
    let offset = 0;
    prevArrow.onclick = () => {
      offset = Math.max(0, offset - 100);
      if (piwSlider) piwSlider.style.transform = `translateX(-${offset}px)`;
    };
    nextArrow.onclick = () => {
      offset = Math.min(300, offset + 100);
      if (piwSlider) piwSlider.style.transform = `translateX(-${offset}px)`;
    };
  }

  // 11. Size Guide Modal Interactions
  const viewSizeGuideBtn = document.getElementById("view-size-guide-btn");
  const sizeGuideModal = document.getElementById("size-guide-modal");
  const sizeGuideClose = document.getElementById("size-guide-close");

  if (viewSizeGuideBtn && sizeGuideModal) {
    viewSizeGuideBtn.onclick = (e) => {
      e.preventDefault();
      sizeGuideModal.classList.add("active");
    };
  }

  if (sizeGuideClose && sizeGuideModal) {
    sizeGuideClose.onclick = () => {
      sizeGuideModal.classList.remove("active");
    };

    sizeGuideModal.onclick = (e) => {
      if (e.target === sizeGuideModal) {
        sizeGuideModal.classList.remove("active");
      }
    };
  }

  window.toggleSizeUnits = function (unit) {
    const btnImp = document.getElementById("unit-imperial");
    const btnMet = document.getElementById("unit-metric");
    const tblImp = document.getElementById("sg-table-imperial");
    const tblMet = document.getElementById("sg-table-metric");

    if (unit === 'metric') {
      if (btnImp) btnImp.classList.remove("active");
      if (btnMet) btnMet.classList.add("active");
      if (tblImp) tblImp.style.display = "none";
      if (tblMet) tblMet.style.display = "table";
    } else {
      if (btnMet) btnMet.classList.remove("active");
      if (btnImp) btnImp.classList.add("active");
      if (tblMet) tblMet.style.display = "none";
      if (tblImp) tblImp.style.display = "table";
    }
  };

  // 11. Closeup Section & Materials Display
  const closeupSec = document.querySelector(".closeup-details-section");
  const materialsSec = document.querySelector(".materials-breakdown-section");
  if (closeupSec && materialsSec) {
    if (isClothing) {
      closeupSec.style.display = "block";
      materialsSec.style.display = "block";
    } else {
      closeupSec.style.display = "none";
      materialsSec.style.display = "none";
    }
  }

  // 12. Technical Description / Included
  const longDesc = document.getElementById("product-long-description");
  if (longDesc) {
    longDesc.innerHTML = `<p>${product.description}</p>
      <p>All items in the SenpaiWorks catalog represent the gold standard in asset creation. Designed by professional creators, assets are fully compliant with commercial production guidelines, optimized for integration, and undergo rigorous testing before release.</p>`;
  }

  const whatsIncludedContainer = document.getElementById("whats-included-container");
  const whatsIncludedList = document.getElementById("whats-included-list");

  if (product.whatsIncluded && product.whatsIncluded.length > 0) {
    if (whatsIncludedList) {
      whatsIncludedList.innerHTML = product.whatsIncluded.map(item => `<li>${item}</li>`).join("");
    }
    if (whatsIncludedContainer) whatsIncludedContainer.style.display = "block";
  } else {
    if (whatsIncludedContainer) whatsIncludedContainer.style.display = "none";
  }

  const specsTable = document.getElementById("specs-table");
  if (specsTable) {
    specsTable.innerHTML = generateSpecsTableHTML(product);
  }

  // 13. FAQ Accordion populator
  const faqGroup = document.getElementById("faq-accordion-group");
  if (faqGroup) {
    const faqList = product.faqs && product.faqs.length > 0 ? product.faqs : [
      { q: "Is a commercial license included?", a: "Yes, all products purchased on the SenpaiWorks marketplace include a full commercial usage license. You may use them in commercial renders, games, products, or animations without royalty." },
      { q: "What is the return and refund policy?", a: "Since digital files are downloaded immediately upon purchase, they cannot be returned or refunded. However, if there are design defects or file corruptions, please open a support ticket and we will resolve it immediately." }
    ];

    faqGroup.innerHTML = faqList.map((faq, idx) => `
      <div class="faq-item" id="faq-item-${idx}">
        <div class="faq-header" onclick="toggleFaq(${idx})">
          <span>${faq.q}</span>
          <i class="fa-solid fa-chevron-down faq-icon"></i>
        </div>
        <div class="faq-content">
          <p>${faq.a}</p>
        </div>
      </div>
    `).join("");
  }

  // 14. Customer reviews aggregates and list render
  renderReviewsSection(product);
  initReviewModal(product);

  // 15. Related / recommended grid (Displays up to 10 T-shirt & merchandise products)
  const relatedGrid = document.getElementById("related-products-grid");
  if (relatedGrid) {
    const catalog = window.PRODUCTS || (typeof PRODUCTS !== "undefined" ? PRODUCTS : []);
    const tshirts = catalog.filter(p => (p.subCategory === "T-Shirts" || p.category === "Merchandise" || p.category === "Oversized T-Shirts" || p.category === "Hoodies") && p.id !== product.id);
    const sameCategory = catalog.filter(p => p.category === product.category && p.id !== product.id && !tshirts.some(t => t.id === p.id));
    const fallbacks = catalog.filter(p => p.id !== product.id && !tshirts.some(t => t.id === p.id) && !sameCategory.some(o => o.id === p.id));

    const combinedRelated = [...tshirts, ...sameCategory, ...fallbacks].slice(0, 10);
    relatedGrid.innerHTML = generateProductsGridHTML(combinedRelated);
  }
}

// Global handler to scroll You May Also Like carousel left or right (pages by exact visible count: 4 desktop, 3 tablet, 2 mobile)
window.scrollRelatedGrid = function (direction) {
  const grid = document.getElementById("related-products-grid");
  if (!grid) return;
  const pageAmount = grid.clientWidth * direction;
  grid.scrollBy({ left: pageAmount, behavior: "smooth" });
};

// 18. Specification table template helper
function generateSpecsTableHTML(prod) {
  const s = prod.specs || {};
  const isClothing = prod.category === "Merchandise" || prod.category === "Oversized T-Shirts" || prod.category === "Hoodies";

  if (isClothing) {
    const isHoodie = prod.category === "Hoodies" || (prod.subCategory && prod.subCategory.includes("Hoodie"));
    return `
      <tr><td>Material</td><td>100% Premium Organic Combed Cotton</td></tr>
      <tr><td>Fabric Weight</td><td>${isHoodie ? '350 GSM Heavy Duty Fleece' : '240 GSM Heavyweight Cotton'}</td></tr>
      <tr><td>Fit</td><td>Oversized Streetwear Fit</td></tr>
      <tr><td>Sleeve Type</td><td>${isHoodie ? 'Full Sleeve Ribbed Cuff' : 'Half Sleeve Drop Shoulder'}</td></tr>
      <tr><td>Neck Type</td><td>${isHoodie ? 'Double-Layered Hooded Collar' : 'Crew Neck Ribbed Collar'}</td></tr>
      <tr><td>Print Type</td><td>High-Fidelity DTF & High-Density Screen Print</td></tr>
      <tr><td>Wash Care Instructions</td><td>Machine wash cold inside out, tumble dry low, do not iron on print</td></tr>
      <tr><td>Country of Origin</td><td>India 🇮🇳</td></tr>
      <tr><td>Manufacturer</td><td>SenpaiWorks Apparel Ltd.</td></tr>
      <tr><td>Replacement & Exchange Policy</td><td>30-Day Free Replacement & Easy Exchange Guarantee</td></tr>
    `;
  }

  if (prod.category === "Digital Courses") {
    return `
      <tr><td>Instructor</td><td>${s.instructor || "Suhas H (Senpai)"}</td></tr>
      <tr><td>Course Level</td><td>${s.courseLevel || "All Levels"}</td></tr>
      <tr><td>Duration</td><td>${s.duration || "12 Hours"}</td></tr>
      <tr><td>Number of Lessons</td><td>${s.lessons || "30 Lectures"}</td></tr>
      <tr><td>Language</td><td>${s.language || "English"}</td></tr>
      <tr><td>Software Required</td><td>${s.softwareRequired || "Blender"}</td></tr>
      <tr><td>Certificate Included</td><td>Yes</td></tr>
    `;
  }

  // 3D Assets or Hair Assets or Shaders
  return `
    <tr><td>Software Compatibility</td><td>${s.compatibility || "Blender, Maya, ZBrush"}</td></tr>
    <tr><td>File Formats</td><td>${s.formats || ".fbx, .obj, .blend"}</td></tr>
    <tr><td>PBR Support</td><td>Yes</td></tr>
    <tr><td>Rigged</td><td>${s.rigged || "Yes"}</td></tr>
    <tr><td>Animated</td><td>${s.animated || "No"}</td></tr>
    <tr><td>UV Mapped</td><td>Yes</td></tr>
    <tr><td>File Size</td><td>${s.fileSize || "15 MB"}</td></tr>
    <tr><td>License Type</td><td>Full Commercial License</td></tr>
  `;
}

// 19. Stars HTML generator
function getStarsHTML(rating) {
  const floor = Math.floor(rating);
  const diff = rating - floor;
  let html = "";
  for (let i = 0; i < floor; i++) {
    html += `<i class="fa-solid fa-star"></i>`;
  }
  if (diff >= 0.5) {
    html += `<i class="fa-solid fa-star-half-stroke"></i>`;
  }
  const filledCount = floor + (diff >= 0.5 ? 1 : 0);
  for (let i = filledCount; i < 5; i++) {
    html += `<i class="fa-regular fa-star"></i>`;
  }
  return html;
}

// 20. Dynamic FAQs toggle handler
window.toggleFaq = function (idx) {
  const faqItem = document.getElementById(`faq-item-${idx}`);
  if (faqItem) {
    const isActive = faqItem.classList.contains("active");

    // Collapse all FAQs first
    document.querySelectorAll(".faq-item").forEach(item => {
      item.classList.remove("active");
      const content = item.querySelector(".faq-content");
      if (content) content.style.maxHeight = null;
    });

    if (!isActive) {
      faqItem.classList.add("active");
      const content = faqItem.querySelector(".faq-content");
      if (content) {
        content.style.maxHeight = content.scrollHeight + "px";
      }
    }
  }
};

// Helper for non-intrusive toast notifications
function showToastNotice(msg, type = "info") {
  if (window.showAuthToast) {
    window.showAuthToast(msg);
    return;
  }
  let toast = document.getElementById("senpai-global-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "senpai-global-toast";
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #0f172a;
      color: #f8fafc;
      padding: 12px 20px;
      border-radius: 8px;
      border: 1px solid #3b82f6;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
      font-size: 0.88rem;
      font-weight: 600;
      z-index: 99999;
      display: flex;
      align-items: center;
      gap: 10px;
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    `;
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i class="fa-solid fa-circle-info" style="color: #3b82f6;"></i> <span>${escapeHtml(msg)}</span>`;
  toast.style.transform = "translateY(0)";
  toast.style.opacity = "1";
  setTimeout(() => {
    toast.style.transform = "translateY(100px)";
    toast.style.opacity = "0";
  }, 3500);
}

// 21. Real Helpful Vote Handler (Customer Protected)
window.voteReviewHelpful = async function (btn, reviewId) {
  const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
  if (!token) {
    showToastNotice("Please sign in to vote on customer reviews.");
    setTimeout(() => {
      window.location.href = "login.html?redirect=" + encodeURIComponent(window.location.href);
    }, 1200);
    return;
  }

  try {
    const res = await fetch(`/api/reviews/${reviewId}/helpful`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (!res.ok) {
      showToastNotice(data.error || "Failed to submit vote.");
      return;
    }

    const actionsBar = btn.closest(".review-actions-bar");
    let countSpan = actionsBar ? actionsBar.querySelector(".helpful-people-count") : null;

    if (data.helpfulCount > 0) {
      const helpfulText = data.helpfulCount === 1 ? "1 person found this helpful" : `${data.helpfulCount} people found this helpful`;
      btn.innerHTML = `<i class="fa-${data.voted ? 'solid' : 'regular'} fa-thumbs-up"></i> Helpful (${data.helpfulCount})`;
      if (data.voted) {
        btn.classList.add("voted");
      } else {
        btn.classList.remove("voted");
      }
      if (!countSpan && actionsBar) {
        countSpan = document.createElement("span");
        countSpan.className = "helpful-people-count";
        countSpan.style.cssText = "font-size: 0.78rem; color: #94a3b8;";
        actionsBar.appendChild(countSpan);
      }
      if (countSpan) countSpan.textContent = helpfulText;
    } else {
      btn.innerHTML = `<i class="fa-regular fa-thumbs-up"></i> Helpful`;
      btn.classList.remove("voted");
      if (countSpan) {
        countSpan.remove();
      }
    }
  } catch (err) {
    console.error("Helpful vote error:", err);
    showToastNotice("Network error while submitting vote.");
  }
};

// 22. Generates cards for related items section
function generateProductsGridHTML(list) {
  return list.map(prod => {
    const badgeMarkup = prod.badge ? `<span class="prod-badge badge-custom">${prod.badge}</span>` : "";
    const inrPrice = prod.category === "Merchandise" || prod.type === "physical" ? 1299 : (prod.price > 100 ? prod.price : Math.round(prod.price * 83));
    const formattedPrice = prod.price === 0 ? "FREE" : `₹${inrPrice.toLocaleString('en-IN')}`;

    return `
      <div class="product-card ${prod.type}">
        <div class="prod-img-wrap">
          <a href="store-detail.html?id=${prod.id}">
            <img src="${prod.img}" alt="${prod.name}">
          </a>
          <div class="prod-badges-row">
            ${badgeMarkup}
          </div>
        </div>
        <div class="prod-body">
          <div class="prod-meta">
            <span class="prod-rating"><i class="fa-solid fa-star"></i> ${prod.rating.toFixed(1)} (${prod.ratingCount})</span>
            <span class="prod-price">${formattedPrice}</span>
          </div>
          <h3 class="prod-title"><a href="store-detail.html?id=${prod.id}">${prod.name}</a></h3>
          <p class="prod-desc">${prod.description}</p>
        </div>
      </div>
    `;
  }).join("");
}

// 23. Fallback display state if product ID is not found in URL parameters
function displayProductNotFound() {
  const container = document.querySelector(".store-detail-container");
  if (container) {
    container.innerHTML = `
      <div style="text-align: center; padding: 100px 20px;">
        <i class="fa-solid fa-circle-exclamation" style="font-size: 4rem; color: #ff4d6a; margin-bottom: 24px;"></i>
        <h2 style="font-size: 2rem; font-weight: 800; margin-bottom: 12px;">Product Not Found</h2>
        <p style="color: #a0a0a5; margin-bottom: 30px;">The product ID specified in the link does not exist in our creator catalog.</p>
        <a href="store.html" style="background: var(--accent-blue); color: white; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none; display: inline-block;">Return to Store</a>
      </div>
    `;
  }
}

// ── 24. Real Customer Reviews System (Prisma Database-Backed) ──────────────────

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

let currentReviewSort = "recent";
let currentReviewDisplayLimit = 5;
let currentRatingFilter = null; // 1-5 or null
let verifiedOnlyFilter = false; // boolean
let activeDetailProduct = null;
let currentEligibilityData = null;

async function renderReviewsSection(product) {
  if (!product) return;
  activeDetailProduct = product;

  const avgRatingValHuge = document.getElementById("reviews-huge-rating");
  const hugeStarsRow = document.getElementById("reviews-huge-stars");
  const hugeCountText = document.getElementById("reviews-huge-count");
  const distributionChart = document.getElementById("rating-distribution-chart");
  const commentsList = document.getElementById("reviews-comments-list");
  const headerCountText = document.getElementById("reviews-header-count-text");
  const loadMoreWrap = document.getElementById("reviews-load-more-wrap");
  const loadMoreBtn = document.getElementById("load-more-reviews-btn");

  const ratingStarsPreview = document.getElementById("rating-stars-preview");
  const avgRatingPreview = document.getElementById("avg-rating-preview");
  const reviewsCountPreview = document.getElementById("reviews-count-preview");

  try {
    const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    let queryUrl = `/api/products/${encodeURIComponent(product.id)}/reviews?sort=${currentReviewSort}&limit=${currentReviewDisplayLimit}&offset=0`;
    if (currentRatingFilter) queryUrl += `&star=${currentRatingFilter}`;
    if (verifiedOnlyFilter) queryUrl += `&verifiedOnly=true`;

    const res = await fetch(queryUrl, { headers });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch reviews: ${res.status}`);
    }

    const data = await res.json();
    const totalCount = data.totalCount || 0;
    const filteredCount = data.filteredCount !== undefined ? data.filteredCount : totalCount;
    const avgRating = totalCount > 0 ? data.avgRating : (product.rating || 5.0);
    const distribution = data.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const reviews = data.reviews || [];
    const userVotedReviewIds = data.userVotedReviewIds || [];

    // Header product previews
    if (ratingStarsPreview) ratingStarsPreview.innerHTML = getStarsHTML(avgRating);
    if (avgRatingPreview) avgRatingPreview.textContent = avgRating.toFixed(1);
    if (reviewsCountPreview) reviewsCountPreview.textContent = `(${totalCount} reviews)`;

    // Aggregates Box
    if (avgRatingValHuge) avgRatingValHuge.textContent = avgRating.toFixed(1);
    if (hugeStarsRow) hugeStarsRow.innerHTML = getStarsHTML(avgRating);
    if (hugeCountText) hugeCountText.textContent = `based on ${totalCount} review${totalCount === 1 ? '' : 's'}`;

    // Distribution Bars (Clickable Star Filters)
    if (distributionChart) {
      const getPct = (c) => totalCount > 0 ? Math.round((c / totalCount) * 100) + "%" : "0%";
      distributionChart.innerHTML = [5, 4, 3, 2, 1].map(star => {
        const isSelected = currentRatingFilter === star;
        const count = distribution[star] || 0;
        const pct = getPct(count);
        return `
          <div class="chart-row ${isSelected ? 'active-filter' : ''}" onclick="handleStarFilter(${star})" title="Filter by ${star} stars (${count} reviews)" style="cursor: pointer; padding: 4px 6px; border-radius: 6px; transition: background 0.2s; ${isSelected ? 'background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.4);' : ''}">
            <span class="stars-label" style="${isSelected ? 'font-weight: 700; color: #3b82f6;' : ''}">${star} star</span>
            <div class="bar-bg"><div class="bar-fill" style="width: ${pct}"></div></div>
            <span class="percent-label">${pct}</span>
          </div>
        `;
      }).join("");
    }

    // Header text
    if (headerCountText) {
      let filterDesc = [];
      if (currentRatingFilter) filterDesc.push(`${currentRatingFilter}-star`);
      if (verifiedOnlyFilter) filterDesc.push(`verified`);
      
      const filterSuffix = filterDesc.length > 0 ? ` (${filterDesc.join(', ')})` : '';
      headerCountText.textContent = filteredCount > 0 ? `Showing ${reviews.length} of ${filteredCount} reviews${filterSuffix}` : `No reviews matching criteria${filterSuffix}`;
    }

    // Reviews list
    if (commentsList) {
      if (reviews.length === 0) {
        commentsList.innerHTML = `
          <div style="padding: 40px 20px; text-align: center; color: #94a3b8;">
            <i class="fa-regular fa-comment-dots" style="font-size: 2.5rem; margin-bottom: 12px; opacity: 0.6;"></i>
            <p style="font-size: 1rem; font-weight: 600; color: #cbd5e1; margin-bottom: 4px;">No reviews found</p>
            <p style="font-size: 0.85rem; color: #64748b;">${(currentRatingFilter || verifiedOnlyFilter) ? 'Try clearing your filters to view more reviews.' : 'Be the first to share your thoughts!'}</p>
            ${(currentRatingFilter || verifiedOnlyFilter) ? `<button type="button" onclick="clearAllReviewFilters()" style="margin-top: 12px; background: #334155; color: #f8fafc; border: none; padding: 6px 14px; border-radius: 6px; font-size: 0.82rem; cursor: pointer;">Clear Filters</button>` : ''}
          </div>
        `;
      } else {
        commentsList.innerHTML = reviews.map(rev => {
          const authorName = rev.user ? (rev.user.name || rev.user.username || "Community Member") : "Community Member";
          const safeAuthor = escapeHtml(authorName);
          const safeTitle = escapeHtml(rev.title);
          const safeText = escapeHtml(rev.text);
          const safeDate = new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
          const isVoted = userVotedReviewIds.includes(rev.id);
          const initial = safeAuthor.charAt(0).toUpperCase() || "U";
          const helpfulCount = rev.helpfulCount || 0;
          const helpfulText = helpfulCount === 1 ? "1 person found this helpful" : `${helpfulCount} people found this helpful`;

          const avatarHtml = rev.user && rev.user.avatar 
            ? `<img src="${escapeHtml(rev.user.avatar)}" alt="${safeAuthor}" class="user-avatar-img" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 1px solid #334155;">` 
            : `<div class="user-avatar-initial">${initial}</div>`;

          const verifiedBadgeHtml = rev.verifiedPurchase 
            ? `<span style="font-size: 0.72rem; color: #10b981; display: inline-flex; align-items: center; gap: 4px; font-weight: 600;">
                 <i class="fa-solid fa-circle-check"></i> Verified Purchase
               </span>`
            : '';

          const variantHtml = rev.variant 
            ? `<span class="review-variant-tag" style="font-size: 0.75rem; color: #94a3b8; margin-top: 2px;">Variant: ${escapeHtml(rev.variant)}</span>`
            : '';

          return `
            <div class="review-comment-card" data-review-id="${rev.id}">
              <div class="review-user-row">
                ${avatarHtml}
                <div style="display: flex; flex-direction: column;">
                  <span class="user-name-text">${safeAuthor}</span>
                  <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    ${verifiedBadgeHtml}
                    ${variantHtml}
                  </div>
                </div>
              </div>
              <div class="review-rating-line">
                <span class="star-rating-stars">${getStarsHTML(rev.rating)}</span>
                <span class="review-title-text">${safeTitle}</span>
              </div>
              <p class="review-date-text">Reviewed on ${safeDate}</p>
              <p class="review-body-text">${safeText}</p>
              <div class="review-actions-bar" style="display: flex; align-items: center; gap: 10px; margin-top: 12px; flex-wrap: wrap;">
                <button class="helpful-vote-btn ${isVoted ? 'voted' : ''}" onclick="window.voteReviewHelpful(this, ${rev.id})">
                  <i class="fa-${isVoted ? 'solid' : 'regular'} fa-thumbs-up"></i> Helpful ${helpfulCount > 0 ? `(${helpfulCount})` : ''}
                </button>
                <button type="button" class="report-review-btn" onclick="window.openReportReviewModal(${rev.id})" style="background: transparent; border: none; color: #64748b; font-size: 0.78rem; cursor: pointer; padding: 4px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; transition: color 0.2s;" title="Report this review">
                  <i class="fa-regular fa-flag"></i> Report
                </button>
                ${helpfulCount > 0 ? `<span class="helpful-people-count" style="font-size: 0.78rem; color: #94a3b8;">${helpfulText}</span>` : ''}
              </div>
            </div>
          `;
        }).join("");
      }
    }

    // Load More Visibility
    if (loadMoreWrap) {
      if (filteredCount > currentReviewDisplayLimit) {
        loadMoreWrap.style.display = "flex";
        if (loadMoreBtn) {
          const btnSpan = loadMoreBtn.querySelector("span");
          if (btnSpan) btnSpan.textContent = "Load More Reviews";
        }
      } else {
        loadMoreWrap.style.display = "none";
      }
    }
  } catch (err) {
    console.error("Error rendering reviews section:", err);
  }
}

// Global Handlers for Review Sorting, Filters & Load More
window.handleReviewSortChange = function (sortValue) {
  if (sortValue === "verified") {
    verifiedOnlyFilter = true;
    currentReviewSort = "recent";
  } else {
    verifiedOnlyFilter = false;
    currentReviewSort = sortValue;
  }
  currentReviewDisplayLimit = 5;
  if (activeDetailProduct) {
    renderReviewsSection(activeDetailProduct);
  }
};

window.handleStarFilter = function (star) {
  if (currentRatingFilter === star) {
    currentRatingFilter = null; // Toggle off
  } else {
    currentRatingFilter = star;
  }
  currentReviewDisplayLimit = 5;
  if (activeDetailProduct) {
    renderReviewsSection(activeDetailProduct);
  }
};

window.clearAllReviewFilters = function () {
  currentRatingFilter = null;
  verifiedOnlyFilter = false;
  const sortSelect = document.getElementById("reviews-sort-select");
  if (sortSelect && sortSelect.value === "verified") {
    sortSelect.value = "recent";
    currentReviewSort = "recent";
  }
  currentReviewDisplayLimit = 5;
  if (activeDetailProduct) {
    renderReviewsSection(activeDetailProduct);
  }
};

window.handleLoadMoreReviews = function () {
  currentReviewDisplayLimit += 5;
  if (activeDetailProduct) {
    renderReviewsSection(activeDetailProduct);
  }
};

// Report Review Handlers
window.openReportReviewModal = function (reviewId) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    showToastNotice("Please log in to report a review.");
    setTimeout(() => {
      window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
    }, 1200);
    return;
  }
  const modal = document.getElementById("report-review-modal");
  const hiddenId = document.getElementById("report-target-review-id");
  if (hiddenId) hiddenId.value = reviewId;
  if (modal) modal.classList.add("active");
};

window.closeReportReviewModal = function () {
  const modal = document.getElementById("report-review-modal");
  if (modal) modal.classList.remove("active");
  const form = document.getElementById("report-review-form");
  if (form) form.reset();
};

window.handleReportReviewSubmit = async function (e) {
  if (e) e.preventDefault();
  const reviewId = document.getElementById("report-target-review-id")?.value;
  const selectedRadio = document.querySelector('input[name="report-reason"]:checked');
  const details = document.getElementById("report-details-input")?.value || "";
  const submitBtn = document.getElementById("report-submit-btn");

  if (!reviewId || !selectedRadio) {
    showToastNotice("Please select a reason for reporting.");
    return;
  }

  const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
  if (!token) {
    showToastNotice("Please sign in to report a review.");
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting...`;
  }

  try {
    const res = await fetch(`/api/reviews/${reviewId}/report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        reason: selectedRadio.value,
        details: details.trim()
      })
    });

    const data = await res.json();
    if (!res.ok) {
      showToastNotice(data.error || "Failed to submit report.");
      return;
    }

    closeReportReviewModal();
    showToastNotice(data.message || "Thank you. We'll check if this review meets our community guidelines.");
  } catch (err) {
    console.error("Error submitting report:", err);
    showToastNotice("Network error while submitting report.");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Report";
    }
  }
};

// 25. Initialize Write / Edit a Review Modal & Gating Logic
async function initReviewModal(product) {
  const writeReviewBtn = document.getElementById("write-review-btn");
  const reviewModal = document.getElementById("write-review-modal");
  const reviewCloseBtn = document.getElementById("review-modal-close");
  const reviewCancelBtn = document.getElementById("review-cancel-btn");
  const reviewForm = document.getElementById("write-review-form");
  const reviewProductName = document.getElementById("review-modal-product-name");
  const reviewProductImg = document.getElementById("review-modal-product-img");
  const reviewCategoryHint = document.getElementById("review-modal-category-hint");
  const reviewSubmitBtn = document.getElementById("review-submit-btn");

  if (!writeReviewBtn || !reviewModal) return;

  const starInputContainer = document.getElementById("star-rating-input");
  const ratingValueInput = document.getElementById("review-rating-value");
  const ratingTextHint = document.getElementById("rating-text-hint");
  const titleInput = document.getElementById("review-title-input");
  const textInput = document.getElementById("review-text-input");

  const hints = ["", "1.0 - Poor", "2.0 - Fair", "3.0 - Good", "4.0 - Very Good", "5.0 - Excellent"];

  const updateStars = (val) => {
    if (!starInputContainer) return;
    const stars = starInputContainer.querySelectorAll("i");
    stars.forEach((star, idx) => {
      if (idx + 1 <= val) {
        star.className = "fa-solid fa-star active-star";
      } else {
        star.className = "fa-regular fa-star";
      }
    });
    if (ratingTextHint) ratingTextHint.textContent = hints[val] || "Select a rating";
  };

  if (starInputContainer) {
    const stars = starInputContainer.querySelectorAll("i");
    stars.forEach(star => {
      star.onmouseenter = () => {
        const rating = parseInt(star.getAttribute("data-rating"), 10);
        updateStars(rating);
      };
      star.onclick = () => {
        const rating = parseInt(star.getAttribute("data-rating"), 10);
        if (ratingValueInput) ratingValueInput.value = rating;
        updateStars(rating);
      };
    });

    starInputContainer.onmouseleave = () => {
      const cur = parseInt(ratingValueInput ? ratingValueInput.value : 0, 10) || 0;
      updateStars(cur);
    };
  }

  // Category-aware prompt helper text
  const isClothing = product.category === "Merchandise" || product.category === "Oversized T-Shirts" || product.category === "Hoodies" || product.type === "physical";
  const isDigital = product.type === "digital" || product.category === "Digital Courses" || product.category === "3D Assets";
  
  let categoryHelperText = "What did you like or dislike about this product?";
  if (isClothing) {
    categoryHelperText = "How's the fit, fabric feel, and print quality?";
  } else if (isDigital) {
    categoryHelperText = "How was the asset quality, compatibility, and ease of use?";
  }

  const openModal = () => {
    if (reviewProductName) reviewProductName.textContent = product.name;
    if (reviewProductImg) {
      const imgSrc = product.img || (product.colorVariants && product.colorVariants[0] ? product.colorVariants[0].img : "");
      reviewProductImg.src = imgSrc;
    }
    if (reviewCategoryHint) {
      reviewCategoryHint.textContent = categoryHelperText;
    }

    if (currentEligibilityData && currentEligibilityData.alreadyReviewed && currentEligibilityData.existingReview) {
      const rev = currentEligibilityData.existingReview;
      if (ratingValueInput) ratingValueInput.value = rev.rating;
      updateStars(rev.rating);
      if (titleInput) titleInput.value = rev.title || "";
      if (textInput) textInput.value = rev.text || "";
      if (reviewSubmitBtn) reviewSubmitBtn.textContent = "Save Changes";
    } else {
      if (ratingValueInput) ratingValueInput.value = 0;
      updateStars(0);
      if (titleInput) titleInput.value = "";
      if (textInput) textInput.value = "";
      if (reviewSubmitBtn) reviewSubmitBtn.textContent = "Submit Review";
    }

    reviewModal.classList.add("active");
  };

  const closeModal = () => {
    reviewModal.classList.remove("active");
  };

  if (reviewCloseBtn) reviewCloseBtn.onclick = closeModal;
  if (reviewCancelBtn) reviewCancelBtn.onclick = closeModal;
  reviewModal.onclick = (e) => {
    if (e.target === reviewModal) closeModal();
  };

  // Check Eligibility on Load (Opened to all authenticated users)
  const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
  
  if (!token) {
    writeReviewBtn.textContent = "Log in to write a review";
    writeReviewBtn.disabled = false;
    writeReviewBtn.classList.remove("disabled-btn");
    writeReviewBtn.style.opacity = "1";
    writeReviewBtn.style.cursor = "pointer";
    writeReviewBtn.title = "Click to sign in to your account";
    writeReviewBtn.onclick = () => {
      window.location.href = "login.html?redirect=" + encodeURIComponent(window.location.href);
    };
  } else {
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(product.id)}/reviews/eligibility`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      currentEligibilityData = data;

      if (data.alreadyReviewed) {
        writeReviewBtn.textContent = "Edit Your Review";
        writeReviewBtn.disabled = false;
        writeReviewBtn.classList.remove("disabled-btn");
        writeReviewBtn.style.opacity = "1";
        writeReviewBtn.style.cursor = "pointer";
        writeReviewBtn.title = "Click to edit your published review";
        writeReviewBtn.onclick = openModal;
      } else {
        writeReviewBtn.textContent = "Write a Review";
        writeReviewBtn.disabled = false;
        writeReviewBtn.classList.remove("disabled-btn");
        writeReviewBtn.style.opacity = "1";
        writeReviewBtn.style.cursor = "pointer";
        writeReviewBtn.title = "Share your review with the community";
        writeReviewBtn.onclick = openModal;
      }
    } catch (err) {
      console.warn("Failed to check review eligibility:", err);
      writeReviewBtn.textContent = "Write a Review";
      writeReviewBtn.disabled = false;
      writeReviewBtn.onclick = openModal;
    }
  }

  // Check for auto-open query param: ?openReview=true
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("openReview") === "true") {
    if (token) {
      setTimeout(() => {
        openModal();
      }, 400);
    } else {
      window.location.href = "login.html?redirect=" + encodeURIComponent(window.location.href);
    }
  }

  // Form Submission
  if (reviewForm) {
    reviewForm.onsubmit = async (e) => {
      e.preventDefault();
      const ratingVal = parseInt(ratingValueInput ? ratingValueInput.value : 0, 10);
      const titleVal = titleInput ? titleInput.value.trim() : "";
      const textVal = textInput ? textInput.value.trim() : "";

      if (!ratingVal || ratingVal < 1 || ratingVal > 5) {
        alert("Please select a star rating between 1 and 5.");
        return false;
      }
      if (!titleVal || titleVal.length < 2) {
        alert("Please provide a title for your review (minimum 2 characters).");
        return false;
      }
      if (!textVal || textVal.length < 5) {
        alert("Please write your review feedback (minimum 5 characters).");
        return false;
      }

      const activeToken = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
      if (!activeToken) {
        alert("Please log in to submit your review.");
        window.location.href = "login.html?redirect=" + encodeURIComponent(window.location.href);
        return false;
      }

      if (reviewSubmitBtn) {
        reviewSubmitBtn.disabled = true;
        reviewSubmitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;
      }

      try {
        const isEditing = currentEligibilityData && currentEligibilityData.alreadyReviewed && currentEligibilityData.existingReview;
        const endpoint = isEditing ? `/api/reviews/${currentEligibilityData.existingReview.id}` : `/api/products/${encodeURIComponent(product.id)}/reviews`;
        const method = isEditing ? "PUT" : "POST";

        const res = await fetch(endpoint, {
          method,
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${activeToken}`
          },
          body: JSON.stringify({
            rating: ratingVal,
            title: titleVal,
            text: textVal
          })
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.error || "Failed to submit review. Please try again.");
          if (reviewSubmitBtn) {
            reviewSubmitBtn.disabled = false;
            reviewSubmitBtn.textContent = isEditing ? "Save Changes" : "Submit Review";
          }
          return false;
        }

        closeModal();

        if (window.showAuthToast) {
          window.showAuthToast(data.message || (isEditing ? "Your review has been updated!" : "Your review has been published!"));
        } else {
          showToastNotice(data.message || (isEditing ? "Your review has been updated!" : "Your review has been published!"));
        }

        // Refresh reviews list & eligibility
        await renderReviewsSection(product);
        await initReviewModal(product);

      } catch (err) {
        console.error("Review submission error:", err);
        alert("A network error occurred. Please check your connection and try again.");
      } finally {
        if (reviewSubmitBtn) {
          reviewSubmitBtn.disabled = false;
          reviewSubmitBtn.textContent = (currentEligibilityData && currentEligibilityData.alreadyReviewed) ? "Save Changes" : "Submit Review";
        }
      }

      return false;
    };
  }
}


