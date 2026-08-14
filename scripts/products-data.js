"use strict";

window.PRODUCTS = [];

// Fetch database products and update PRODUCTS array
(function () {
  const API_URL = "/api/products";

  fetch(API_URL, { cache: "no-store" })
    .then(res => {
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    })
    .then(dbProducts => {
      const formatted = dbProducts.map(p => {
        let parsedVariants = null;
        if (p.variantsData) {
          try {
            parsedVariants = typeof p.variantsData === 'string' ? JSON.parse(p.variantsData) : p.variantsData;
          } catch (e) {
            parsedVariants = null;
          }
        }

        let colorVariants = null;
        if (p.colorVariants) {
          try {
            colorVariants = typeof p.colorVariants === 'string' ? JSON.parse(p.colorVariants) : p.colorVariants;
          } catch (e) { colorVariants = null; }
        }
        if (!colorVariants && parsedVariants && parsedVariants.colors) {
          colorVariants = parsedVariants.colors;
        }

        let addImgs = [p.img];
        if (p.additionalImages) {
          if (Array.isArray(p.additionalImages)) {
            addImgs = p.additionalImages;
          } else if (typeof p.additionalImages === 'string') {
            addImgs = p.additionalImages.split("\n").map(s => s.trim()).filter(Boolean);
          }
        }

        return {
          id: p.id,
          name: p.name,
          category: p.category,
          subCategory: p.subCategory,
          price: p.price,
          originalPrice: p.originalPrice !== undefined ? p.originalPrice : Math.round(p.price * 1.6),
          rating: p.rating,
          ratingCount: p.ratingCount,
          description: p.description,
          img: p.img,
          additionalImages: addImgs,
          badge: p.badge,
          software: p.software ? (Array.isArray(p.software) ? p.software : p.software.split(",").map(s => s.trim()).filter(Boolean)) : [],
          format: p.format ? (Array.isArray(p.format) ? p.format : p.format.split(",").map(s => s.trim()).filter(Boolean)) : [],
          isNew: p.isNew,
          type: p.type,
          creator: p.creator,
          available: p.available !== undefined ? Boolean(p.available) : true,
          stockQuantity: p.stockQuantity !== undefined ? parseInt(p.stockQuantity) : 50,
          colorVariants: colorVariants || [],
          variantsData: parsedVariants,
          featureHighlights: p.featureHighlights,
          whatsIncluded: p.whatsIncluded ? (Array.isArray(p.whatsIncluded) ? p.whatsIncluded : p.whatsIncluded.split("\n").map(s => s.trim()).filter(Boolean)) : [],
          aboutItem: p.aboutItem ? (Array.isArray(p.aboutItem) ? p.aboutItem : p.aboutItem.split("\n").map(s => s.trim()).filter(Boolean)) : [],
          specs: p.specs || {
            sizes: p.sizes,
            colors: p.colors,
            material: p.material,
            fabricType: p.fabricType,
            printingMethod: p.printingMethod,
            washingInstructions: p.washingInstructions,
            shippingWeight: p.shippingWeight,
            packageDimensions: p.packageDimensions
          }
        };
      });

      window.PRODUCTS = formatted;
      try {
        localStorage.setItem("admin_custom_products", JSON.stringify(formatted));
      } catch(e) {}
      window.dispatchEvent(new Event("productsUpdated"));
    })
    .catch(err => {
      console.warn("Backend API not reachable; falling back to cached catalog:", err.message);
      try {
        const stored = localStorage.getItem("admin_custom_products");
        if (stored) {
          window.PRODUCTS = JSON.parse(stored);
          window.dispatchEvent(new Event("productsUpdated"));
        }
      } catch(e) {}
    });
})();

// Global Helper Function for Robust Category Matching across Store and Admin
function isProductInCategory(prod, cat) {
  if (!prod || !cat || cat === "all") return true;

  const c = cat.toLowerCase().trim();
  const prodCat = (prod.category || "").toLowerCase().trim();
  const prodSubCat = (prod.subCategory || "").toLowerCase().trim();
  const prodType = (prod.type || "").toLowerCase().trim();
  const prodName = (prod.name || "").toLowerCase().trim();

  if (c === "merchandise") {
    return prodCat === "merchandise" || prodCat === "hoodies" || prodCat === "oversized t-shirts" ||
      prodSubCat === "t-shirts" || prodSubCat === "hoodies" || prodType === "physical";
  }

  if (c === "hoodies") {
    return prodCat === "hoodies" || prodSubCat === "hoodies" || prodName.includes("hoodie");
  }

  if (c === "oversized t-shirts" || c === "t-shirts") {
    return prodCat === "oversized t-shirts" || prodSubCat === "t-shirts" || prodSubCat === "oversized t-shirts" || prodName.includes("t-shirt") || prodName.includes("tee");
  }

  if (c === "3d assets" || c === "3d models") {
    return prodCat === "3d assets" || prodCat === "hair assets" || prodCat === "materials & textures" || prodCat === "brushes & resources" ||
      prodSubCat === "characters" || prodSubCat === "anime hair" || prodSubCat === "skin materials" || prodSubCat === "blender brushes" || prodSubCat === "imm brushes" ||
      (prodType === "digital" && prodCat !== "digital courses");
  }

  if (c === "digital courses" || c === "courses") {
    return prodCat === "digital courses" || prodSubCat === "blender courses" || prodSubCat === "zbrush courses";
  }

  return prodCat === c || prodSubCat === c;
}

window.isProductInCategory = isProductInCategory;
