"use strict";

document.addEventListener("DOMContentLoaded", async () => {
  if (window.dbProductsPromise) {
    await window.dbProductsPromise;
  }
  initProductDetailPage();
});

function initProductDetailPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  let allProducts = typeof PRODUCTS !== "undefined" ? [...PRODUCTS] : [];
  try {
    const custom = JSON.parse(localStorage.getItem("customProducts")) || [];
    allProducts = [...allProducts, ...custom];
  } catch(e) {}

  let product = null;
  if (productId) {
    const cleanId = String(decodeURIComponent(productId)).trim().toLowerCase();
    product = allProducts.find(p => 
      String(p.id).toLowerCase() === cleanId || 
      String(p.name).toLowerCase() === cleanId ||
      String(p.id).replace(/[^a-z0-9]/gi, '') === cleanId.replace(/[^a-z0-9]/gi, '')
    );
  }

  if (!product && allProducts.length > 0) {
    product = allProducts[0];
  }

  if (!product) {
    displayProductNotFound();
    return;
  }

  const isClothing = product.category === "Merchandise" && (product.subCategory === "Hoodies" || product.subCategory === "T-Shirts" || product.subCategory === "Vests" || product.subCategory === "Apparel");

  // 1. Breadcrumbs
  const breadcrumbCurrent = document.getElementById("breadcrumb-current");
  const detailBreadcrumbs = document.getElementById("detail-breadcrumbs");
  if (breadcrumbCurrent) breadcrumbCurrent.textContent = product.name;
  if (detailBreadcrumbs) {
    detailBreadcrumbs.innerHTML = `
      <a href="home.html">Home</a> &gt; 
      <a href="store.html">Store</a> &gt; 
      <a href="store.html?category=${product.category}">${product.category}</a> &gt; 
      <span id="breadcrumb-current">${product.name}</span>
    `;
  }

  // 2. Title & Meta Action Buttons
  const productTitle = document.getElementById("product-title");
  if (productTitle) productTitle.textContent = product.name;

  const shareBtn = document.getElementById("action-share");
  const wishlistBtn = document.getElementById("action-wishlist");

  if (shareBtn) {
    shareBtn.onclick = () => {
      navigator.clipboard.writeText(window.location.href);
      const icon = shareBtn.querySelector("i");
      icon.className = "fa-solid fa-check";
      shareBtn.style.color = "#10b981";
      setTimeout(() => {
        icon.className = "fa-solid fa-arrow-up-from-bracket";
        shareBtn.style.color = "";
      }, 2000);
    };
  }

  if (wishlistBtn && product) {
    let wishlistArr = [];
    try {
      wishlistArr = JSON.parse(localStorage.getItem("userWishlist")) || [];
    } catch (e) { wishlistArr = []; }

    let isWishlisted = wishlistArr.some(item => (product.id && item.id === product.id) || item.name === product.name);
    const icon = wishlistBtn.querySelector("i");

    if (isWishlisted && icon) {
      icon.className = "fa-solid fa-heart";
      icon.style.color = "#ff4d6a";
    }

    wishlistBtn.onclick = () => {
      let currentWishlist = [];
      try {
        currentWishlist = JSON.parse(localStorage.getItem("userWishlist")) || [];
      } catch(e) { currentWishlist = []; }

      const existingIdx = currentWishlist.findIndex(item => (product.id && item.id === product.id) || item.name === product.name);

      if (existingIdx > -1) {
        currentWishlist.splice(existingIdx, 1);
        if (icon) {
          icon.className = "fa-regular fa-heart";
          icon.style.color = "";
        }
      } else {
        const itemPrice = typeof product.price === 'number' ? (product.price > 100 ? product.price : Math.round(product.price * 83)) : 1499;
        currentWishlist.push({
          id: product.id || "prod-" + Date.now(),
          name: product.name,
          price: itemPrice,
          type: product.type || "physical",
          variant: product.variant || product.subCategory || "Standard Edition",
          img: product.img || (product.additionalImages && product.additionalImages[0]) || "",
          category: product.category || "Merchandise"
        });
        if (icon) {
          icon.className = "fa-solid fa-heart";
          icon.style.color = "#ff4d6a";
        }
      }

      localStorage.setItem("userWishlist", JSON.stringify(currentWishlist));
    };
  }

  // 3. Ratings Summary
  const ratingStarsPreview = document.getElementById("rating-stars-preview");
  const avgRatingPreview = document.getElementById("avg-rating-preview");
  const reviewsCountPreview = document.getElementById("reviews-count-preview");

  if (ratingStarsPreview) ratingStarsPreview.innerHTML = getStarsHTML(product.rating);
  if (avgRatingPreview) avgRatingPreview.textContent = product.rating.toFixed(1);
  if (reviewsCountPreview) {
    reviewsCountPreview.textContent = `(${product.ratingCount} reviews)`;
  }

  // 4. Price & Discount Badge Layout
  const productPrice = document.getElementById("product-price");
  const originalPrice = document.getElementById("original-price");
  const discountBadge = document.getElementById("discount-badge");
  const stockStatus = document.getElementById("stock-status");

  if (product.category === "Merchandise" || product.type === "physical") {
    const rupees = 1299;
    const origRupees = 2499;
    const discountPct = Math.round(((origRupees - rupees) / origRupees) * 100);

    if (productPrice) productPrice.textContent = `₹${rupees.toLocaleString('en-IN')}`;
    if (originalPrice) {
      originalPrice.textContent = `₹${origRupees.toLocaleString('en-IN')}`;
      originalPrice.style.display = "inline";
    }
    if (discountBadge) {
      discountBadge.textContent = `${discountPct}% OFF`;
      discountBadge.style.display = "inline-block";
    }
  } else {
    const inrVal = product.price > 100 ? product.price : Math.round(product.price * 83);
    if (productPrice) productPrice.textContent = product.price === 0 ? "FREE" : `₹${inrVal.toLocaleString('en-IN')}`;
    if (product.price > 0) {
      const origPriceVal = Math.round(inrVal * 1.4);
      if (originalPrice) originalPrice.textContent = `₹${origPriceVal.toLocaleString('en-IN')}`;
      if (discountBadge) discountBadge.textContent = `-28%`;
      if (originalPrice) originalPrice.style.display = "inline";
      if (discountBadge) discountBadge.style.display = "inline-block";
    } else {
      if (originalPrice) originalPrice.style.display = "none";
      if (discountBadge) discountBadge.style.display = "none";
    }
  }

  if (stockStatus) {
    stockStatus.textContent = product.type === "digital" ? "Instant Delivery" : "In Stock (India Only 🇮🇳)";
    stockStatus.style.color = product.type === "digital" ? "#10b981" : "#b5947a";
    stockStatus.style.backgroundColor = product.type === "digital" ? "#ecfdf5" : "#faf8f5";
    stockStatus.style.borderColor = product.type === "digital" ? "#a7f3d0" : "#e5e7eb";
  }

  // 5. Description Text Toggle
  const productDesc = document.getElementById("product-description");
  const descToggleBtn = document.getElementById("desc-toggle-btn");
  const descPanel = document.querySelector(".description-panel");

  if (productDesc) {
    productDesc.innerHTML = `<p>${product.description}</p>
      <p>This premium collection is crafted to bring high-end design sensibilities into your workflow or daily style. Tailored fits, custom rig specifications, and fully tested production-ready shaders are standard across all SenpaiWorks catalog releases.</p>`;
  }

  if (descToggleBtn && descPanel) {
    descToggleBtn.onclick = () => {
      const isExpanded = descPanel.classList.toggle("expanded");
      descToggleBtn.textContent = isExpanded ? "Show Less" : "Show More";
    };
  }

  // 6. Color Selection
  const colorGroup = document.getElementById("color-selection-group");
  const colorSwatches = document.getElementById("color-swatches");
  if (product.colorVariants && product.colorVariants.length > 0) {
    if (colorGroup) colorGroup.style.display = "block";
    if (colorSwatches) {
      colorSwatches.innerHTML = product.colorVariants.map((variant, idx) => {
        return `<button class="color-swatch-btn ${idx === 0 ? 'active' : ''}" style="background-color: ${variant.colorCode};" title="${variant.name}" data-img="${variant.img.replace(/'/g, "\\'")}"></button>`;
      }).join("");

      const swatchBtns = colorSwatches.querySelectorAll(".color-swatch-btn");
      swatchBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          swatchBtns.forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          const newImg = btn.getAttribute("data-img");
          const mainImg = document.getElementById("main-preview-img");
          if (mainImg && newImg) {
            mainImg.style.opacity = 0;
            setTimeout(() => {
              mainImg.src = newImg;
              mainImg.style.opacity = 1;
            }, 150);
          }
        });
      });
    }
  } else {
    if (colorGroup) colorGroup.style.display = "none";
  }

  // 7. Size Selection
  const sizeGroup = document.getElementById("size-selection-group");
  const sizeGrid = document.getElementById("size-buttons-grid");
  const sizeGuideLink = document.getElementById("view-size-guide-btn");
  if (product.category === "Merchandise" || isClothing) {
    if (sizeGroup) sizeGroup.style.display = "block";
    if (sizeGuideLink) sizeGuideLink.style.display = "inline";
    const allSizes = ["S", "M", "L", "XL", "XXL"];

    if (sizeGrid) {
      sizeGrid.innerHTML = allSizes.map((sz, idx) => {
        return `<button class="size-btn ${idx === 0 ? 'active' : ''}" data-size="${sz}">${sz}</button>`;
      }).join("");

      const sizeBtns = sizeGrid.querySelectorAll(".size-btn");
      sizeBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          sizeBtns.forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
        });
      });
    }
  } else {
    if (sizeGroup) sizeGroup.style.display = "none";
  }

  // 8. Primary Action Buttons
  const addCartBtn = document.getElementById("action-add-cart");
  const buyNowBtn = document.getElementById("action-buy-now");

  // Check if product is already in shopping cart
  const checkInCart = () => {
    try {
      const cartStr = localStorage.getItem("shoppingCart");
      const cart = cartStr ? JSON.parse(cartStr) : [];
      return cart.some(c => c.id === product.id || (c.name && c.name.toLowerCase() === product.name.toLowerCase()));
    } catch(e) { return false; }
  };

  if (addCartBtn) {
    if (checkInCart()) {
      addCartBtn.textContent = "Added to Cart ✓";
      addCartBtn.classList.add("added-in-cart");
    }

    addCartBtn.onclick = () => {
      const activeSizeBtn = document.querySelector("#size-buttons-grid .size-btn.active");
      const sizeVal = activeSizeBtn ? activeSizeBtn.textContent.trim() : (product.sizes && product.sizes.length > 0 ? product.sizes[0] : "Standard Edition");

      window.addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        img: product.img,
        type: product.type,
        variant: sizeVal
      });

      addCartBtn.textContent = "Added to Cart ✓";
      addCartBtn.classList.add("added-in-cart");
    };
  }

  if (buyNowBtn) {
    buyNowBtn.onclick = () => {
      const doBuyNow = () => {
        let cart = localStorage.getItem("shoppingCart");
        cart = cart ? JSON.parse(cart) : [];

        const activeSizeBtn = document.querySelector("#size-buttons-grid .size-btn.active");
        const sizeVal = activeSizeBtn ? activeSizeBtn.textContent.trim() : (product.sizes && product.sizes.length > 0 ? product.sizes[0] : "Standard Edition");

        const existing = cart.find(c => c.id === product.id || c.name === product.name);
        if (existing) {
          existing.quantity += 1;
          existing.variant = sizeVal;
        } else {
          cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            img: product.img,
            type: product.type || "physical",
            quantity: 1,
            variant: sizeVal
          });
        }
        localStorage.setItem("shoppingCart", JSON.stringify(cart));

        // Direct redirect to checkout.html
        window.location.href = "checkout.html";
      };

      if (window.checkAuthOrPrompt) {
        window.checkAuthOrPrompt("proceed with Instant Buy", doBuyNow);
      } else {
        doBuyNow();
      }
    };
  }

  // 9. Interactive Gallery switcher
  const mainImg = document.getElementById("main-preview-img");
  const thumbGallery = document.getElementById("thumbnail-gallery");
  if (mainImg) {
    mainImg.src = product.img;
    mainImg.alt = product.name;
    mainImg.style.opacity = "1";
    mainImg.style.display = "block";
    mainImg.onerror = function() {
      this.onerror = null;
      this.src = "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp";
    };
  }

  if (thumbGallery) {
    const images = product.additionalImages && product.additionalImages.length > 0
      ? product.additionalImages
      : [product.img];

    thumbGallery.innerHTML = images.map((imgUrl, idx) => `
      <div class="gallery-thumb ${idx === 0 ? 'active' : ''}" data-idx="${imgUrl.replace(/"/g, "&quot;")}">
        <img src="${imgUrl}" alt="Thumbnail ${idx + 1}">
      </div>
    `).join("");

    const thumbs = thumbGallery.querySelectorAll(".gallery-thumb");
    thumbs.forEach(thumb => {
      thumb.addEventListener("click", () => {
        thumbs.forEach(t => t.classList.remove("active"));
        thumb.classList.add("active");
        const imgUrl = thumb.getAttribute("data-idx");
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
      const recommended = PRODUCTS.filter(p => p.id !== product.id).slice(0, 3);
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

  window.switchDetailColorVariant = function(imgUrl) {
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

  window.toggleSizeUnits = function(unit) {
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
    const tshirts = PRODUCTS.filter(p => (p.subCategory === "T-Shirts" || p.category === "Merchandise") && p.id !== product.id);
    const sameCategory = PRODUCTS.filter(p => p.category === product.category && p.id !== product.id && !tshirts.some(t => t.id === p.id));
    const fallbacks = PRODUCTS.filter(p => p.id !== product.id && !tshirts.some(t => t.id === p.id) && !sameCategory.some(o => o.id === p.id));
    
    const combinedRelated = [...tshirts, ...sameCategory, ...fallbacks].slice(0, 10);
    relatedGrid.innerHTML = generateProductsGridHTML(combinedRelated);
  }
}

// Global handler to scroll You May Also Like carousel left or right (pages by exact visible count: 4 desktop, 3 tablet, 2 mobile)
window.scrollRelatedGrid = function(direction) {
  const grid = document.getElementById("related-products-grid");
  if (!grid) return;
  const pageAmount = grid.clientWidth * direction;
  grid.scrollBy({ left: pageAmount, behavior: "smooth" });
};

// 18. Specification table template helper
function generateSpecsTableHTML(prod) {
  const s = prod.specs || {};
  
  if (prod.category === "Merchandise") {
    return `
      <tr><td>Available Sizes</td><td>${s.sizes || "S, M, L, XL"}</td></tr>
      <tr><td>Available Colors</td><td>${s.colors || "Charcoal, Navy"}</td></tr>
      <tr><td>Material</td><td>${s.material || "100% Cotton"}</td></tr>
      <tr><td>Fabric Type</td><td>${s.fabricType || "Medium weight knit"}</td></tr>
      <tr><td>Printing Method</td><td>${s.printingMethod || "Screen Printed"}</td></tr>
      <tr><td>Washing Instructions</td><td>${s.washingInstructions || "Machine wash cold"}</td></tr>
      <tr><td>Shipping Weight</td><td>${s.shippingWeight || "200g"}</td></tr>
      <tr><td>Package Dimensions</td><td>${s.packageDimensions || "25cm x 20cm x 3cm"}</td></tr>
    `;
  }
  
  if (prod.category === "Digital Courses") {
    return `
      <tr><td>Instructor</td><td>${s.instructor || "Suhas H (Senpai)"}</td></tr>
      <tr><td>Course Level</td><td>${s.courseLevel || "All Levels"}</td></tr>
      <tr><td>Duration</td><td>${s.duration || "12 Hours"}</td></tr>
      <tr><td>Number of Lessons</td><td>${s.lessons || "30 Lectures"}</td></tr>
      <tr><td>Language</td><td>${s.language || "English"}</td></tr>
      <tr><td>Subtitle Availability</td><td>${s.subtitleAvailability || "English"}</td></tr>
      <tr><td>Software Required</td><td>${s.softwareRequired || "Blender"}</td></tr>
      <tr><td>Downloadable Files</td><td>${s.downloadableFiles || "Yes"}</td></tr>
      <tr><td>Certificate Included</td><td>${s.certificateIncluded || "Yes"}</td></tr>
    `;
  }

  // 3D Assets or Hair Assets or Shaders
  return `
    <tr><td>Software Compatibility</td><td>${s.compatibility || "Blender"}</td></tr>
    <tr><td>Blender Version</td><td>${s.blenderVersion || "N/A"}</td></tr>
    <tr><td>Maya Compatibility</td><td>${s.mayaCompatibility || "N/A"}</td></tr>
    <tr><td>ZBrush Compatibility</td><td>${s.zbrushCompatibility || "N/A"}</td></tr>
    <tr><td>Unreal Engine Compatibility</td><td>${s.unrealCompatibility || "N/A"}</td></tr>
    <tr><td>Unity Compatibility</td><td>${s.unityCompatibility || "N/A"}</td></tr>
    <tr><td>File Formats</td><td>${s.formats || ".fbx"}</td></tr>
    <tr><td>Polygon Count</td><td>${s.polyCount || "N/A"}</td></tr>
    <tr><td>Vertex Count</td><td>${s.vertexCount || "N/A"}</td></tr>
    <tr><td>Texture Resolution</td><td>${s.texResolution || "N/A"}</td></tr>
    <tr><td>PBR Support</td><td>${s.pbr || "No"}</td></tr>
    <tr><td>Rigged</td><td>${s.rigged || "No"}</td></tr>
    <tr><td>Animated</td><td>${s.animated || "No"}</td></tr>
    <tr><td>Shape Keys</td><td>${s.shapeKeys || "No"}</td></tr>
    <tr><td>UV Mapped</td><td>${s.uvMapped || "No"}</td></tr>
    <tr><td>File Size</td><td>${s.fileSize || "15 MB"}</td></tr>
    <tr><td>Version</td><td>${s.version || "1.0"}</td></tr>
    <tr><td>Last Updated</td><td>${s.lastUpdated || "2026-01-01"}</td></tr>
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
window.toggleFaq = function(idx) {
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

// 21. Helpful Vote clicker
window.voteHelpful = function(btn, initialCount) {
  if (btn.classList.contains("voted")) {
    btn.classList.remove("voted");
    btn.innerHTML = `<i class="fa-regular fa-thumbs-up"></i> Helpful (${initialCount})`;
  } else {
    btn.classList.add("voted");
    btn.innerHTML = `<i class="fa-solid fa-thumbs-up"></i> Voted Helpful (${initialCount + 1})`;
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

// State for customer reviews pagination & sorting
let currentReviewSort = "recent";
let currentReviewDisplayLimit = 5;
let activeDetailProduct = null;

const DEFAULT_PRODUCT_REVIEWS = [
  { id: "rev_1", author: "Alex Mercer", rating: 5, date: "July 24, 2026", title: "Exceptional quality and incredible detail!", text: "The fabric weight and print sharpness exceeded my expectations. Fits true to size with an awesome streetwear drape.", helpfulCount: 18 },
  { id: "rev_2", author: "Sarah Jenkins", rating: 5, date: "July 20, 2026", title: "My new favorite item!", text: "Subtle yet stylish. Worn it to multiple anime expos and got tons of compliments from fellow fans.", helpfulCount: 14 },
  { id: "rev_3", author: "Kenji Sato", rating: 4, date: "July 15, 2026", title: "Very comfortable & great fit", text: "Great organic cotton texture and holds up really well after multiple cold washes. Will order again!", helpfulCount: 9 },
  { id: "rev_4", author: "Michael B.", rating: 5, date: "July 10, 2026", title: "Top-tier craftsmanship", text: "SenpaiWorks never disappoints with their creator merch. High fidelity print and super fast shipping.", helpfulCount: 12 },
  { id: "rev_5", author: "David Chen", rating: 5, date: "July 4, 2026", title: "Stunning graphics!", text: "The color vibrancy in person is insane. Extremely soft feel on skin.", helpfulCount: 8 },
  { id: "rev_6", author: "Elena Rostova", rating: 4, date: "June 28, 2026", title: "Great customer support", text: "Package arrived 2 days earlier than expected. Sizing is comfortably relaxed.", helpfulCount: 5 },
  { id: "rev_7", author: "Jordan Taylor", rating: 5, date: "June 22, 2026", title: "Worth every penny!", text: "The premium heavyweight feel is immediately noticeable when you unpack it.", helpfulCount: 11 },
  { id: "rev_8", author: "Chloe Bennett", rating: 5, date: "June 18, 2026", title: "Five stars overall", text: "Super aesthetic design, high durability, and overall 10/10 purchase experience.", helpfulCount: 7 },
  { id: "rev_9", author: "Rohan Patel", rating: 4, date: "June 12, 2026", title: "Solid quality and finish", text: "Really nice stitching and high density graphic print that does not fade.", helpfulCount: 4 },
  { id: "rev_10", author: "Liam O'Connor", rating: 5, date: "June 5, 2026", title: "Best anime apparel in my closet", text: "Looks fire with cargo pants or jackets. Essential staple item.", helpfulCount: 15 },
  { id: "rev_11", author: "Hannah Wright", rating: 5, date: "May 29, 2026", title: "Amazing gift!", text: "Bought this as a birthday present and they absolutely loved it.", helpfulCount: 6 },
  { id: "rev_12", author: "Marcus Vance", rating: 4, date: "May 20, 2026", title: "Very satisfied", text: "Clean packaging, premium materials, and authentic SenpaiWorks branding.", helpfulCount: 3 }
];

// 24. Render Customer Reviews, sorting, and 7-item pagination limit
function renderReviewsSection(product) {
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

  let baseReviews = product.reviews && product.reviews.length >= 7 ? product.reviews : DEFAULT_PRODUCT_REVIEWS;

  let savedReviews = [];
  try {
    const raw = localStorage.getItem("user_reviews_" + product.id);
    if (raw) savedReviews = JSON.parse(raw);
  } catch(e){}

  const allReviews = [...savedReviews, ...baseReviews];
  const totalCount = allReviews.length;
  const sumRating = allReviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
  const avgRating = totalCount > 0 ? sumRating / totalCount : product.rating;

  if (ratingStarsPreview) ratingStarsPreview.innerHTML = getStarsHTML(avgRating);
  if (avgRatingPreview) avgRatingPreview.textContent = avgRating.toFixed(1);
  if (reviewsCountPreview) reviewsCountPreview.textContent = `(${totalCount} reviews)`;

  if (avgRatingValHuge) avgRatingValHuge.textContent = avgRating.toFixed(1);
  if (hugeStarsRow) hugeStarsRow.innerHTML = getStarsHTML(avgRating);
  if (hugeCountText) hugeCountText.textContent = `based on ${totalCount} review${totalCount === 1 ? '' : 's'}`;

  if (distributionChart) {
    let counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allReviews.forEach(r => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating)));
      counts[star] = (counts[star] || 0) + 1;
    });
    const getPct = (c) => totalCount > 0 ? Math.round((c / totalCount) * 100) + "%" : "0%";

    distributionChart.innerHTML = `
      <div class="chart-row">
        <span class="stars-label">5 star</span>
        <div class="bar-bg"><div class="bar-fill" style="width: ${getPct(counts[5])}"></div></div>
        <span class="percent-label">${getPct(counts[5])}</span>
      </div>
      <div class="chart-row">
        <span class="stars-label">4 star</span>
        <div class="bar-bg"><div class="bar-fill" style="width: ${getPct(counts[4])}"></div></div>
        <span class="percent-label">${getPct(counts[4])}</span>
      </div>
      <div class="chart-row">
        <span class="stars-label">3 star</span>
        <div class="bar-bg"><div class="bar-fill" style="width: ${getPct(counts[3])}"></div></div>
        <span class="percent-label">${getPct(counts[3])}</span>
      </div>
      <div class="chart-row">
        <span class="stars-label">2 star</span>
        <div class="bar-bg"><div class="bar-fill" style="width: ${getPct(counts[2])}"></div></div>
        <span class="percent-label">${getPct(counts[2])}</span>
      </div>
      <div class="chart-row">
        <span class="stars-label">1 star</span>
        <div class="bar-bg"><div class="bar-fill" style="width: ${getPct(counts[1])}"></div></div>
        <span class="percent-label">${getPct(counts[1])}</span>
      </div>
    `;
  }

  // Sort reviews based on currentReviewSort
  let sortedReviews = [...allReviews];
  if (currentReviewSort === "highest") {
    sortedReviews.sort((a, b) => b.rating - a.rating);
  } else if (currentReviewSort === "lowest") {
    sortedReviews.sort((a, b) => a.rating - b.rating);
  } else if (currentReviewSort === "helpful") {
    sortedReviews.sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0));
  } else {
    // recent
    sortedReviews.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }

  // Apply display limit (initial 7)
  const visibleReviews = sortedReviews.slice(0, currentReviewDisplayLimit);

  if (headerCountText) {
    headerCountText.textContent = `Showing ${visibleReviews.length} of ${totalCount} reviews`;
  }

  if (commentsList) {
    commentsList.innerHTML = visibleReviews.map(rev => {
      const initial = (rev.author && rev.author.charAt(0).toUpperCase()) || "U";
      return `
        <div class="review-comment-card">
          <div class="review-user-row">
            <div class="user-avatar-initial">${initial}</div>
            <span class="user-name-text">${rev.author}</span>
          </div>
          <div class="review-rating-line">
            <span class="star-rating-stars">${getStarsHTML(rev.rating)}</span>
            <span class="review-title-text">${rev.title}</span>
          </div>
          <p class="review-date-text">Reviewed on ${rev.date}</p>
          <p class="review-body-text">${rev.text}</p>
          <div class="review-actions-bar">
            <button class="helpful-vote-btn" onclick="voteHelpful(this, ${rev.helpfulCount || 0})">
              <i class="fa-regular fa-thumbs-up"></i> Helpful (${rev.helpfulCount || 0})
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  // Handle Load More Reviews Button
  if (loadMoreWrap) {
    if (totalCount > currentReviewDisplayLimit) {
      loadMoreWrap.style.display = "flex";
      if (loadMoreBtn) {
        const btnSpan = loadMoreBtn.querySelector("span");
        if (btnSpan) btnSpan.textContent = "Load More Reviews";
      }
    } else {
      loadMoreWrap.style.display = "none";
    }
  }
}

// Global Handlers for Review Sorting & Load More
window.handleReviewSortChange = function(sortValue) {
  currentReviewSort = sortValue;
  currentReviewDisplayLimit = 5;
  if (activeDetailProduct) {
    renderReviewsSection(activeDetailProduct);
  }
};

window.handleLoadMoreReviews = function() {
  currentReviewDisplayLimit += 5;
  if (activeDetailProduct) {
    renderReviewsSection(activeDetailProduct);
  }
};

// 25. Initialize Write a Review modal logic
function initReviewModal(product) {
  const writeReviewBtn = document.getElementById("write-review-btn");
  const reviewModal = document.getElementById("write-review-modal");
  const reviewCloseBtn = document.getElementById("review-modal-close");
  const reviewCancelBtn = document.getElementById("review-cancel-btn");
  const reviewForm = document.getElementById("write-review-form");
  const reviewProductName = document.getElementById("review-modal-product-name");

  if (!writeReviewBtn || !reviewModal) return;

  const openModal = () => {
    const reviewProductName = document.getElementById("review-modal-product-name");
    const reviewProductImg = document.getElementById("review-modal-product-img");
    if (reviewProductName) reviewProductName.textContent = product.name;
    if (reviewProductImg) {
      const imgSrc = product.img || (product.colorVariants && product.colorVariants[0] ? product.colorVariants[0].img : "");
      reviewProductImg.src = imgSrc;
    }
    reviewModal.classList.add("active");
  };

  const closeModal = () => {
    reviewModal.classList.remove("active");
  };

  writeReviewBtn.onclick = () => {
    const userStr = localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser");
    if (!userStr) {
      if (window.checkAuthOrPrompt) {
        window.checkAuthOrPrompt("write a review", openModal);
      } else if (window.openAuthModal) {
        window.openAuthModal("write a review");
      } else {
        alert("Please sign in or register to write a product review.");
      }
      return;
    }
    openModal();
  };

  if (reviewCloseBtn) reviewCloseBtn.onclick = closeModal;
  if (reviewCancelBtn) reviewCancelBtn.onclick = closeModal;
  reviewModal.onclick = (e) => {
    if (e.target === reviewModal) closeModal();
  };

  // Interactive star rating setup
  const starInputContainer = document.getElementById("star-rating-input");
  const ratingValueInput = document.getElementById("review-rating-value");
  const ratingTextHint = document.getElementById("rating-text-hint");

  if (starInputContainer) {
    const stars = starInputContainer.querySelectorAll("i");
    const hints = ["", "1.0 - Poor", "2.0 - Fair", "3.0 - Good", "4.0 - Very Good", "5.0 - Excellent"];

    const updateStars = (val) => {
      stars.forEach((star, idx) => {
        if (idx + 1 <= val) {
          star.className = "fa-solid fa-star active-star";
        } else {
          star.className = "fa-regular fa-star";
        }
      });
      if (ratingTextHint) ratingTextHint.textContent = hints[val] || "Select a rating";
    };

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

  // Form Submission
  if (reviewForm) {
    reviewForm.onsubmit = (e) => {
      e.preventDefault();
      const ratingVal = parseInt(document.getElementById("review-rating-value").value, 10);
      const titleVal = document.getElementById("review-title-input").value.trim();
      const textVal = document.getElementById("review-text-input").value.trim();

      if (!ratingVal || ratingVal < 1) {
        alert("Please select a star rating for your review.");
        return false;
      }
      if (!titleVal || !textVal) {
        alert("Please fill in both the review title and review text.");
        return false;
      }

      // Extract user name directly from logged-in account
      let authorVal = "Verified Customer";
      try {
        const uStr = localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser");
        if (uStr) {
          const u = JSON.parse(uStr);
          authorVal = u.name || u.username || u.displayName || (u.email ? u.email.split('@')[0] : "Verified Customer");
        }
      } catch(e){}

      const newRev = {
        id: "rev_" + Date.now(),
        author: authorVal,
        rating: ratingVal,
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        title: titleVal,
        text: textVal,
        helpfulCount: 0
      };

      try {
        const key = "user_reviews_" + product.id;
        let list = [];
        const raw = localStorage.getItem(key);
        if (raw) list = JSON.parse(raw);
        list.unshift(newRev);
        localStorage.setItem(key, JSON.stringify(list));

        // Global master review log for Admin Panel tracking
        let masterLog = [];
        const masterRaw = localStorage.getItem("site_master_reviews_log");
        if (masterRaw) masterLog = JSON.parse(masterRaw);
        masterLog.unshift({
          id: newRev.id,
          user: authorVal,
          rating: ratingVal,
          title: titleVal,
          text: textVal,
          productId: product.id,
          productName: product.name,
          date: newRev.date,
          status: "Published"
        });
        localStorage.setItem("site_master_reviews_log", JSON.stringify(masterLog));
      } catch(err) {
        console.error("Failed saving review to localStorage:", err);
      }

      renderReviewsSection(product);

      closeModal();

      if (window.showAuthToast) {
        window.showAuthToast("Thank you! Your review has been published.");
      } else {
        alert("Thank you! Your review has been published.");
      }
      return false;
    };
  }
}
