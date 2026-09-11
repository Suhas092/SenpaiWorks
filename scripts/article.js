/**
 * SenpaiWorks Dynamic Article Reader Engine
 * scripts/article.js
 */

(function () {
  "use strict";

  function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>'"]/g, tag => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    }[tag] || tag));
  }

  function escapeAttr(str) {
    if (!str) return "";
    return String(str).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function safeUrl(url) {
    if (!url) return "#";
    const trimmed = String(url).trim();
    if (trimmed.startsWith("javascript:") || trimmed.startsWith("data:") || trimmed.startsWith("vbscript:")) {
      return "#";
    }
    return trimmed;
  }

  // Fallback database for offline/fallback resilience
  const fallbackArticles = {
    "senpaiworks-2-release": {
      id: "senpaiworks-2-release",
      title: "Announcing SenpaiWorks 2.0 Platform Launch & Architectural Evolution",
      category: "Platform Update",
      author: "Team SenpaiWorks",
      date: "July 2026",
      readTime: "7 mins read",
      img: "https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/news/all_characters_yvk9ik.webp",
      content: `
        <div class="art-callout art-callout-info">
          <div class="art-callout-icon"><i class="fa-solid fa-sparkles"></i></div>
          <div class="art-callout-body">
            <strong>Welcome to SenpaiWorks 2.0</strong> — A brand new architectural foundation built for high-performance 3D rendering, seamless responsive layouts, dynamic merchandise browsing, and synchronised content delivery.
          </div>
        </div>

        <h2>1. The Vision Behind SenpaiWorks 2.0</h2>
        <p>SenpaiWorks began as a passion project for anime art, 3D character animation, and heavyweight streetwear merchandise. With version 2.0, we have completely overhauled our frontend rendering pipeline, transitioning to hardware-accelerated CSS 3D matrix transforms and a responsive light/dark theme system.</p>

        <p>Every page in our ecosystem — from the <strong>Home Showcase</strong> to the <strong>News Hub</strong> and <strong>Merch Store</strong> — now shares unified design tokens, sub-millisecond route transitions, and robust database synchronization.</p>

        <h2>2. Key Architectural Upgrades</h2>
        <ul>
          <li><strong>60FPS Hardware-Accelerated 3D Carousel:</strong> Custom matrix-3d rendering engine ensuring zero layout thrashing or stutter during high-speed drag and swipe gestures.</li>
          <li><strong>Dynamic Merchandise & News Engine:</strong> Live Prisma-backed SQLite/PostgreSQL synchronization between the Admin portal and client-facing storefront.</li>
          <li><strong>XSS-Hardened Sanitization:</strong> Native HTML attribute escaping, safe URL protocol filtering, and DOM isolation across all user-interactive modules.</li>
          <li><strong>240GSM Screen-Printed Streetwear:</strong> Real-time inventory tracking and wash-proof apparel verification.</li>
        </ul>

        <div class="art-quote-box">
          <p>"Our goal with SenpaiWorks 2.0 was simple: create the cleanest, fastest, and most visually captivating anime creator hub on the web."</p>
          <div class="art-quote-author">— Suhas H, Lead Creator & Architect</div>
        </div>

        <h2>3. What's Coming Next</h2>
        <p>Stay tuned for our upcoming Suzens Virtual Idol debut concert, new downloadable 3D Blender character rigs, and the drop of our limited-edition oversized anime graphic tees!</p>
      `
    },
    "crypto-etfs-art-library": {
      id: "crypto-etfs-art-library",
      title: "Art Library Expansion: 200+ New High-Resolution Anime Illustrations",
      category: "Art Library",
      author: "Art Direction Team",
      date: "July 2026",
      readTime: "5 mins read",
      img: "https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/brand/rem_and_ram_copy_zigezp.webp",
      content: `
        <div class="art-callout art-callout-info">
          <div class="art-callout-icon"><i class="fa-solid fa-palette"></i></div>
          <div class="art-callout-body">
            <strong>200+ New Illustrations Added</strong> — Explore our largest art drop yet, featuring 4K wallpapers, line art breakdown files, and character concept sheets.
          </div>
        </div>

        <h2>Explore the Expanded Collection</h2>
        <p>We're thrilled to announce the official release of over 200 new high-resolution illustrations to the SenpaiWorks Art Library. This collection features original character designs, dynamic battle sequences, and scenic atmospheric environments.</p>

        <p>All artworks are optimized for 4K displays and can be previewed seamlessly with our interactive zoom lens viewer.</p>
      `
    },
    "deadpool-animation": {
      id: "deadpool-animation",
      title: "Deadpool & Wolverine Fan Animation: 4K VFX Breakdown & BTS",
      category: "3D Animation",
      author: "Animation Studio",
      date: "July 2026",
      readTime: "13 mins read",
      img: "https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/artworks/deadpool_poster_krntp0.webp",
      content: `
        <div class="art-callout art-callout-info">
          <div class="art-callout-icon"><i class="fa-solid fa-clapperboard"></i></div>
          <div class="art-callout-body">
            <strong>Behind the Scenes</strong> — Discover the multi-pass rendering, custom cel-shading nodes, and motion capture techniques behind our viral fan animation.
          </div>
        </div>

        <h2>Blender Cel-Shading & Combat Choreography</h2>
        <p>Creating an authentic anime aesthetic in 3D requires balancing precise line weight control with dynamic lighting. In this deep dive, we break down how our artists achieved comic-accurate outlines using custom inverted-hull modifiers and real-time Eevee/Cycles hybrid rendering.</p>
      `
    },
    "web-architecture": {
      id: "web-architecture",
      title: "SenpaiWorks v2 Website Architecture: Custom 3D CSS Matrix Engine",
      category: "Web Dev",
      author: "Dev Team",
      date: "July 2026",
      readTime: "8 mins read",
      img: "https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/brand/code_copy_jq3ic6.webp",
      content: `
        <h2>Building a 60FPS Parallax Carousel Without Heavy Frameworks</h2>
        <p>Instead of relying on heavy third-party carousel libraries, SenpaiWorks 2.0 leverages pure vanilla JavaScript with CSS 3D transform matrices. This ensures buttery smooth 60FPS animation even on mobile devices with low battery modes.</p>
      `
    },
    "suzens-idol-debut": {
      id: "suzens-idol-debut",
      title: "Suzens: The First Bloom Virtual Idol Debut Concert Teaser",
      category: "Upcoming Event",
      author: "Idol Production Team",
      date: "August 2026",
      readTime: "6 mins read",
      img: "https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/brand/suzan_godrays_jggu36.webp",
      content: `
        <div class="art-callout art-callout-info">
          <div class="art-callout-icon"><i class="fa-solid fa-microphone-lines"></i></div>
          <div class="art-callout-body">
            <strong>Virtual Concert Debut</strong> — The Suzens 4-member virtual cyber-pop group will hold their global debut livestream this summer.
          </div>
        </div>

        <h2>Meet the Four Members</h2>
        <p>Combining real-time motion capture, holographic stage projection, and original cyber-synth melodies, Suzens represents the next frontier of virtual music entertainment at SenpaiWorks.</p>
      `
    }
  };

  async function loadArticle() {
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get("id") || "senpaiworks-2-release";

    let article = fallbackArticles[articleId];

    try {
      const res = await fetch(`/api/news/${encodeURIComponent(articleId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.title) {
          article = data;
        }
      }
    } catch (e) {
      console.warn("Could not fetch remote article, using local article data", e);
    }

    if (!article) {
      article = fallbackArticles["senpaiworks-2-release"];
    }

    // 1. Update Document Title
    document.title = `${article.title} — SenpaiWorks Studio`;

    // 2. Hydrate Hero Header
    const catEl = document.getElementById("article-hero-category");
    if (catEl) catEl.textContent = article.category || "Story";

    const titleEl = document.getElementById("article-hero-title");
    if (titleEl) titleEl.textContent = article.title || "Article";

    const authorEl = document.getElementById("article-hero-author");
    if (authorEl) authorEl.textContent = article.author || "Team SenpaiWorks";

    const dateEl = document.getElementById("article-hero-date");
    if (dateEl) dateEl.textContent = article.date || "Recent";

    const readtimeEl = document.getElementById("article-hero-readtime");
    if (readtimeEl) readtimeEl.textContent = article.readTime || "5 mins read";

    // Author Avatar Initial
    const avatarEl = document.querySelector(".article-author-avatar");
    if (avatarEl) {
      avatarEl.textContent = (article.author || "S")[0].toUpperCase();
    }

    // 3. Hydrate Cover Image
    const coverEl = document.getElementById("article-cover-img");
    if (coverEl) {
      const imgUrl = article.img || "https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/news/all_characters_yvk9ik.webp";
      coverEl.src = safeUrl(imgUrl);
      coverEl.alt = article.title;
    }

    // 4. Hydrate Article Body
    const bodyEl = document.getElementById("article-body-content");
    if (bodyEl) {
      if (article.content) {
        bodyEl.innerHTML = article.content;
      } else if (article.summary) {
        bodyEl.innerHTML = `
          <div class="art-callout art-callout-info">
            <div class="art-callout-icon"><i class="fa-solid fa-sparkles"></i></div>
            <div class="art-callout-body">
              <strong>${escapeHtml(article.category || "Story Spotlight")}</strong> — ${escapeHtml(article.title)}
            </div>
          </div>
          <p class="article-lead-p">${escapeHtml(article.summary)}</p>
        `;
      }
    }

    // 5. Populate More Articles Grid
    await loadMoreArticles(articleId);
  }

  async function loadMoreArticles(currentArticleId) {
    const grid = document.getElementById("more-articles-grid");
    if (!grid) return;

    let articlesList = [];
    try {
      const res = await fetch("/api/news");
      if (res.ok) {
        articlesList = await res.json();
      }
    } catch (e) {
      console.warn("Could not fetch more articles", e);
    }

    if (!articlesList || articlesList.length === 0) {
      articlesList = Object.values(fallbackArticles);
    }

    const filtered = articlesList.filter(a => a.id !== currentArticleId).slice(0, 3);
    if (filtered.length === 0) return;

    grid.innerHTML = filtered.map(art => {
      const img = art.img || "https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/artworks/deadpool_poster_krntp0.webp";
      return `
        <a href="article.html?id=${encodeURIComponent(art.id)}" class="more-article-card">
          <div class="more-article-thumb">
            <img src="${escapeAttr(safeUrl(img))}" alt="${escapeAttr(art.title)}" loading="lazy">
          </div>
          <div class="more-article-body">
            <span class="more-article-tag">${escapeHtml(art.category || "Story")}</span>
            <h4 class="more-article-heading">${escapeHtml(art.title)}</h4>
            <div class="more-article-meta">
              <span><i class="fa-regular fa-clock"></i> ${escapeHtml(art.readTime || "5 min read")}</span>
              <span><i class="fa-regular fa-calendar"></i> ${escapeHtml(art.date || "Recent")}</span>
            </div>
          </div>
        </a>
      `;
    }).join("");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadArticle);
  } else {
    loadArticle();
  }
})();
