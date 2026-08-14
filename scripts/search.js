// ============================================================
//  SenpaiWorks — Unified Live Search Engine & Catalog Search
// ============================================================

(function () {
  "use strict";

  // ── Global Search Database ─────────────────────────────────
  // Pre-seeded multi-category search entries from across the entire studio
  const STATIC_SEARCH_DATA = [
    // 2D Art Library Artworks
    {
      id: "art-kaori",
      title: "Kaori Miyazono",
      category: "2D Art",
      subCategory: "Digital Art",
      type: "artwork",
      desc: "Violinist girl portrait with vibrant pastel sky background inspired by Your Lie in April.",
      img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630821/black_kaori_copy_csr9qi.webp",
      link: "art-library.html"
    },
    {
      id: "art-miku",
      title: "Miku Nakano",
      category: "2D Art",
      subCategory: "Digital Portrait",
      type: "artwork",
      desc: "Miku Nakano third sister of Nakano quintuplets digital character illustration.",
      img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630824/miku_full_copy_vdritm.webp",
      link: "art-library.html"
    },
    {
      id: "art-mikasa",
      title: "Mikasa Ackerman",
      category: "2D Art",
      subCategory: "Digital Portrait",
      type: "artwork",
      desc: "Mikasa Ackerman Attack on Titan anime digital portrait artwork.",
      img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630823/Mikasa_copy_jcwuga.webp",
      link: "art-library.html"
    },
    {
      id: "art-li-shiya",
      title: "Li Shiya",
      category: "2D Art",
      subCategory: "Digital Portrait",
      type: "artwork",
      desc: "Li Shiya mature upperclassman from The Girl Downstairs digital artwork.",
      img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630823/li_shiya_copy_jyopqy.webp",
      link: "art-library.html"
    },
    {
      id: "art-nico-robin",
      title: "Nico Robin",
      category: "2D Art",
      subCategory: "Digital Portrait",
      type: "artwork",
      desc: "Nico Robin archaeologist of Straw Hat Pirates One Piece digital art.",
      img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630824/nico_robin_copy_eoj6o4.webp",
      link: "art-library.html"
    },
    {
      id: "art-zoro",
      title: "Roronoa Zoro",
      category: "2D Art",
      subCategory: "Insane Artwork",
      type: "artwork",
      desc: "Roronoa Zoro swordsman of One Piece high intensity action artwork.",
      img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630823/zoro_copy_bki4to.webp",
      link: "art-library.html"
    },
    {
      id: "art-itachi",
      title: "Itachi Uchiha",
      category: "2D Art",
      subCategory: "Insane Artwork",
      type: "artwork",
      desc: "Itachi Uchiha Sharingan eyes & crow genjutsu anime visual masterpiece.",
      img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630822/itachi_copy_laotwi.webp",
      link: "art-library.html"
    },
    {
      id: "art-rose",
      title: "Rose",
      category: "2D Art",
      subCategory: "Color Pencil",
      type: "artwork",
      desc: "Traditional color pencil portrait drawing of Rose.",
      img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630824/rose_copy_hqkhss.webp",
      link: "art-library.html"
    },
    {
      id: "art-iu",
      title: "IU (Lee Ji-eun)",
      category: "2D Art",
      subCategory: "Color Pencil",
      type: "artwork",
      desc: "Color pencil realistic portrait illustration of IU.",
      img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630822/iu_copy_cdbits.webp",
      link: "art-library.html"
    },

    // Suzens Virtual Band Items
    {
      id: "suzen-band",
      title: "Suzens — Virtual Idol Anime Band",
      category: "Virtual Band",
      subCategory: "Idol Showcase",
      type: "band",
      desc: "Official homepage of Suzens 3D anime band — featuring Suzana, Tiara, Remi, and Ayana with live concert dates and album previews.",
      img: "assets/suzens band.png",
      link: "suzens.html"
    },
    {
      id: "suzen-suzana",
      title: "Suzana — Lead Vocalist",
      category: "Virtual Band",
      subCategory: "Member Profile",
      type: "band",
      desc: "The Electric Spark of Suzens. Lead vocalist and rhythm guitarist for live metaverse holographic stage performances.",
      img: "assets/suzana all out.png",
      link: "suzens.html#sz-members"
    },
    {
      id: "suzen-tiara",
      title: "Tiara — Lead Guitarist",
      category: "Virtual Band",
      subCategory: "Member Profile",
      type: "band",
      desc: "The Holographic Virtuoso. Lead guitarist and synth composer blending neo-classical guitar solos with cyber electronics.",
      img: "assets/tiara all out.png",
      link: "suzens.html#sz-members"
    },

    // News & Editorial Articles
    {
      id: "news-suzens-debut",
      title: "Suzens: The First Bloom Virtual Debut Concert",
      category: "News",
      subCategory: "Idol Showcase",
      type: "news",
      desc: "SenpaiWorks reveals the 3D visual redesign and upcoming live concert tour for original virtual idol group Suzens.",
      img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630847/suzan_godrays_jggu36.webp",
      link: "article.html?id=suzens-idol-debut"
    },
    {
      id: "news-senpaiworks-v2",
      title: "Designing SenpaiWorks v2 Architecture & Motion Graphics",
      category: "News",
      subCategory: "Dev Log",
      type: "news",
      desc: "Deep dive into building high-performance creative web portals, 3D character pipelines, and fast media rendering engines.",
      img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_auto/v1757630849/code_copy_jq3ic6.webp",
      link: "news.html"
    },

    // Courses & Learn
    {
      id: "course-2d-pattern",
      title: "2D Pattern Drafting & Sewing Masterclass",
      category: "Learn",
      subCategory: "Course",
      type: "course",
      desc: "Comprehensive masterclass on 2D pattern drafting for hoodies, streetwear jackets, skirts, and custom apparel sewing.",
      img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630823/lisa_copy_zsrdfj.webp",
      link: "course-detail.html?id=2d-pattern-drafting"
    },
    {
      id: "course-3d-sculpting",
      title: "3D Character Sculpting & Rigging in Blender",
      category: "Learn",
      subCategory: "Course",
      type: "course",
      desc: "Learn to sculpt, texture, and rig high-polygon anime characters for 3D animation, VTuber models, and game assets.",
      img: "assets/material_vest.png",
      link: "learn.html"
    },

    // Motion & VFX
    {
      id: "motion-vfx-reel",
      title: "SenpaiWorks Motion Studio — 2D & 4D VFX Reels",
      category: "Motion VFX",
      subCategory: "Animation Studio",
      type: "motion",
      desc: "Watch official Suzens & Deadpool anime music videos, frame-by-frame 2D cel animation keyframes, and 4D hyper-real physics simulations.",
      img: "assets/art-others-1.png",
      link: "motion.html"
    },

    // Westeros & Franchise
    {
      id: "franchise-westeros",
      title: "Westeros — Game Art & Streetwear Collection",
      category: "Franchise",
      subCategory: "Lore & Apparel",
      type: "franchise",
      desc: "Explore Westeros lore, original dark fantasy character art, game assets, and official medieval-streetwear graphic apparel.",
      img: "assets/art-others-2.png",
      link: "franchise.html"
    }
  ];

  // ── Search State ───────────────────────────────────────────
  let allSearchItems = [];
  let currentFilter = "all";
  let currentSort = "relevance";

  // ── Build Full Search Index ────────────────────────────────
  function buildSearchIndex() {
    allSearchItems = [...STATIC_SEARCH_DATA];

    // Safely pull products from window.PRODUCTS or PRODUCTS global
    const storeProducts = window.PRODUCTS || (typeof PRODUCTS !== "undefined" ? PRODUCTS : []);
    if (Array.isArray(storeProducts)) {
      storeProducts.forEach((p) => {
        // Skip if already in index
        if (allSearchItems.some((item) => item.id === p.id)) return;

        allSearchItems.push({
          id: p.id,
          title: p.name,
          category: "Store",
          subCategory: p.category || p.subCategory || "Merchandise",
          type: "store",
          desc: p.description || `${p.name} — Premium ${p.category} drop by SenpaiWorks.`,
          price: p.price,
          rating: p.rating,
          badge: p.badge || (p.isNew ? "New" : ""),
          img: p.img,
          link: `store-detail.html?id=${p.id}`
        });
      });
    }
  }

  // ── Render Search Results ──────────────────────────────────
  function renderResults() {
    const searchInput = document.getElementById("searchInput");
    const resultsHeader = document.getElementById("resultsHeader");
    const resultsGrid = document.getElementById("resultsGrid");
    const clearBtn = document.getElementById("searchClearBtn");

    if (!resultsGrid || !searchInput || !resultsHeader) return;

    const query = searchInput.value.trim().toLowerCase();

    if (clearBtn) {
      clearBtn.style.display = query.length > 0 ? "flex" : "none";
    }

    if (query.length === 0) {
      resultsHeader.innerHTML = `
        <div class="search-empty-state">
          <i class="fa-solid fa-magnifying-glass search-empty-icon"></i>
          <h3>What are you looking for today?</h3>
          <p>Search across store products, 2D art, virtual band members, news, and masterclasses.</p>
          <div class="search-suggestions-tags">
            <span class="tag-title">Popular:</span>
            <button type="button" class="search-suggest-tag" onclick="setSearchQuery('Itachi')">Itachi</button>
            <button type="button" class="search-suggest-tag" onclick="setSearchQuery('Suzens')">Suzens</button>

            <button type="button" class="search-suggest-tag" onclick="setSearchQuery('Miku')">Miku</button>
            <button type="button" class="search-suggest-tag" onclick="setSearchQuery('T-Shirt')">T-Shirt</button>
            <button type="button" class="search-suggest-tag" onclick="setSearchQuery('Blender')">Blender</button>
            <button type="button" class="search-suggest-tag" onclick="setSearchQuery('Westeros')">Westeros</button>
          </div>
        </div>
      `;
      resultsGrid.innerHTML = "";
      updateCategoryCounts([]);
      return;
    }

    // Filter matching items by query
    let filtered = allSearchItems.filter((item) => {
      const matchQuery =
        item.title.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.subCategory.toLowerCase().includes(query) ||
        (item.desc && item.desc.toLowerCase().includes(query));

      const matchCategory =
        currentFilter === "all" ||
        (currentFilter === "store" && item.category === "Store") ||
        (currentFilter === "artwork" && item.category === "2D Art") ||
        (currentFilter === "band" && (item.category === "Virtual Band" || item.category === "Motion VFX")) ||
        (currentFilter === "news" && item.category === "News") ||
        (currentFilter === "learn" && item.category === "Learn");

      return matchQuery && matchCategory;
    });

    // Update category tabs counter
    updateCategoryCounts(allSearchItems.filter(item =>
      item.title.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.subCategory.toLowerCase().includes(query) ||
      (item.desc && item.desc.toLowerCase().includes(query))
    ));

    // Sort items
    if (currentSort === "name-asc") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (currentSort === "price-low") {
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (currentSort === "price-high") {
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    }

    // Header count text
    resultsHeader.innerHTML = `
      <div class="search-results-summary">
        <span>Found <strong style="color: #0284c7;">${filtered.length}</strong> result${filtered.length === 1 ? "" : "s"} for "<strong style="color: #0f172a;">${escapeHTML(query)}</strong>"</span>
      </div>
    `;

    if (filtered.length === 0) {
      resultsGrid.innerHTML = `
        <div class="search-no-results">
          <i class="fa-solid fa-ghost no-results-icon"></i>
          <h3>No matching results found for "${escapeHTML(query)}"</h3>
          <p>Try searching with different keywords like <strong>"Suzens"</strong>, <strong>"T-Shirt"</strong>, <strong>"Miku"</strong>, or <strong>"Artwork"</strong>.</p>
        </div>
      `;
      return;
    }

    // Render result cards
    resultsGrid.innerHTML = filtered
      .map((item) => {
        const badgeHTML = item.badge
          ? `<span class="result-badge">${escapeHTML(item.badge)}</span>`
          : "";
        const priceHTML = item.price
          ? `<div class="result-price">$${item.price.toFixed(2)}</div>`
          : "";
        const ratingHTML = item.rating
          ? `<div class="result-rating"><i class="fa-solid fa-star"></i> ${item.rating}</div>`
          : "";

        return `
          <a class="result-card" href="${item.link}">
            <div class="result-card-img-wrap">
              <img src="${item.img}" alt="${escapeHTML(item.title)}" loading="lazy" onerror="this.src='assets/SenpaiWorks logo bg.png'" />
              ${badgeHTML}
              <span class="result-type-pill ${item.type}">${escapeHTML(item.category)}</span>
            </div>
            <div class="result-card-body">
              <div class="result-card-sub">${escapeHTML(item.subCategory)}</div>
              <h3 class="result-card-title">${escapeHTML(item.title)}</h3>
              <p class="result-card-desc">${escapeHTML(item.desc)}</p>
              <div class="result-card-footer">
                ${priceHTML}
                ${ratingHTML}
                <span class="result-view-link">View Details <i class="fa-solid fa-arrow-right"></i></span>
              </div>
            </div>
          </a>
        `;
      })
      .join("");
  }

  // ── Update Filter Category Counters ──────────────────────
  function updateCategoryCounts(queryMatches) {
    const filterBtns = document.querySelectorAll(".search-filter-pill");
    filterBtns.forEach((btn) => {
      const cat = btn.getAttribute("data-filter");
      let count = 0;
      if (cat === "all") {
        count = queryMatches.length;
      } else if (cat === "store") {
        count = queryMatches.filter(i => i.category === "Store").length;
      } else if (cat === "artwork") {
        count = queryMatches.filter(i => i.category === "2D Art").length;
      } else if (cat === "band") {
        count = queryMatches.filter(i => i.category === "Virtual Band" || i.category === "Motion VFX").length;
      } else if (cat === "news") {
        count = queryMatches.filter(i => i.category === "News").length;
      } else if (cat === "learn") {
        count = queryMatches.filter(i => i.category === "Learn").length;
      }

      const badge = btn.querySelector(".pill-count");
      if (badge) badge.textContent = count;
    });
  }

  // ── Helper HTML Escaper ────────────────────────────────────
  function escapeHTML(str) {
    if (!str) return "";
    return String(str).replace(/[&<>'"]/g, (tag) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[tag] || tag)
    );
  }

  // ── Global Helper for Suggested Tag Click ──────────────────
  window.setSearchQuery = function (q) {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.value = q;
      searchInput.focus();
      renderResults();
    }
  };

  // ── Initialization ─────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", () => {
    buildSearchIndex();

    const searchInput = document.getElementById("searchInput");
    const searchForm = document.getElementById("searchForm");
    const clearBtn = document.getElementById("searchClearBtn");
    const sortSelect = document.getElementById("searchSortSelect");

    // Read URL search parameter if passed (e.g. search.html?q=itachi)
    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get("q") || urlParams.get("query") || "";

    if (searchInput) {
      if (initialQuery) {
        searchInput.value = initialQuery;
      }

      searchInput.addEventListener("input", () => {
        renderResults();
      });
    }

    if (clearBtn && searchInput) {
      clearBtn.addEventListener("click", () => {
        searchInput.value = "";
        searchInput.focus();
        renderResults();
      });
    }

    if (searchForm) {
      searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        renderResults();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        currentSort = e.target.value;
        renderResults();
      });
    }

    // Category Filter Pills Listener
    const filterBtns = document.querySelectorAll(".search-filter-pill");
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        filterBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.getAttribute("data-filter") || "all";
        renderResults();
      });
    });

    // Initial Render
    renderResults();
  });
})();
