/**
 * SenpaiWorks Dynamic News & Stories Loader
 * scripts/news.js
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

  async function loadDynamicNews() {
    try {
      const res = await fetch("/api/news");
      if (!res.ok) return;

      const articles = await res.json();
      if (!articles || !Array.isArray(articles) || articles.length === 0) return;

      // 1. Populate The Latest Column
      const latestListContainer = document.getElementById("news-latest-col-list");
      if (latestListContainer) {
        const latestArticles = articles.slice(0, 5);
        latestListContainer.innerHTML = latestArticles.map(art => {
          const imgUrl = art.img || "https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/news/code_copy_jq3ic6.webp";
          const summaryText = art.summary || (art.content ? art.content.replace(/<[^>]*>?/gm, '').slice(0, 130) + '...' : '');
          return `
            <a href="article.html?id=${encodeURIComponent(art.id)}" class="nw-article-card">
              <div class="nw-article-thumb">
                <img src="${escapeAttr(safeUrl(imgUrl))}" alt="${escapeAttr(art.title)}" loading="lazy">
              </div>
              <div class="nw-article-info">
                <h3>${escapeHtml(art.title)}</h3>
                <p>${escapeHtml(summaryText)}</p>
                <div class="nw-article-meta">
                  <span class="nw-tag-pill">${escapeHtml(art.category || "Story")}</span>
                  <span>· ${escapeHtml(art.readTime || "5 min read")}</span>
                  <span>· ${escapeHtml(art.date || "Recent")}</span>
                </div>
              </div>
            </a>
          `;
        }).join("");
      }

      // 2. Populate On Trending Column (Ranked by views / featured)
      const trendingContainer = document.getElementById("news-trending-col-list");
      if (trendingContainer) {
        const sortedTrending = [...articles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 4);
        if (sortedTrending.length > 0) {
          trendingContainer.innerHTML = sortedTrending.map((art, idx) => {
            return `
              <a href="article.html?id=${encodeURIComponent(art.id)}" class="nw-trend-item">
                <span class="nw-trend-rank">#${idx + 1}</span>
                <div>
                  <h4>${escapeHtml(art.title)}</h4>
                  <span class="nw-trend-meta">${escapeHtml(art.date || "Recent")} · ${escapeHtml(art.readTime || "5 mins read")}</span>
                </div>
              </a>
            `;
          }).join("");
        }
      }

      // 3. Populate Editor's Picks
      const editMain = document.getElementById("news-edit-main");
      const editStack = document.getElementById("news-edit-stack");
      const featuredArticles = articles.filter(a => a.isFeatured || a.placement === "main_feature" || a.placement === "recommended");
      const editorialList = featuredArticles.length >= 3 ? featuredArticles : articles;

      if (editMain && editorialList[0]) {
        const m = editorialList[0];
        const mImg = m.img || "https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/artworks/deadpool_poster_krntp0.webp";
        const mSummary = m.summary || (m.content ? m.content.replace(/<[^>]*>?/gm, '').slice(0, 110) + '...' : '');
        editMain.href = `article.html?id=${encodeURIComponent(m.id)}`;
        editMain.innerHTML = `
          <div class="nw-edit-img"><img src="${escapeAttr(safeUrl(mImg))}" alt="${escapeAttr(m.title)}" loading="lazy"></div>
          <div class="nw-edit-body">
            <span class="nw-tag-pill">${escapeHtml(m.category || "Featured")}</span>
            <h3>${escapeHtml(m.title)}</h3>
            <p>${escapeHtml(mSummary)}</p>
            <div class="nw-edit-foot"><span>${escapeHtml(m.author || "Team SenpaiWorks")}</span><span>· ${escapeHtml(m.readTime || "10 min read")}</span></div>
          </div>
        `;
      }

      if (editStack && editorialList.length >= 3) {
        const stackItems = editorialList.slice(1, 3);
        editStack.innerHTML = stackItems.map(item => {
          const itemImg = item.img || "https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/homepage/suzan_godrays_jggu36.webp";
          return `
            <a href="article.html?id=${encodeURIComponent(item.id)}" class="nw-edit-card nw-edit-card--small">
              <div class="nw-edit-img"><img src="${escapeAttr(safeUrl(itemImg))}" alt="${escapeAttr(item.title)}" loading="lazy"></div>
              <div class="nw-edit-body">
                <span class="nw-tag-pill">${escapeHtml(item.category || "Story")}</span>
                <h3>${escapeHtml(item.title)}</h3>
                <div class="nw-edit-foot"><span>${escapeHtml(item.author || "Art Team")}</span><span>· ${escapeHtml(item.readTime || "5 min read")}</span></div>
              </div>
            </a>
          `;
        }).join("");
      }

      bindNewsImages();
    } catch (e) {
      console.warn("Could not load dynamic news, using static fallback", e);
    }
  }

  function bindNewsImages() {
    const thumbs = document.querySelectorAll('.nw-article-thumb, .nw-edit-img');
    thumbs.forEach(wrap => {
      const img = wrap.querySelector('img');
      if (!img) return;
      const onDone = () => {
        img.classList.add('loaded');
        wrap.classList.add('img-loaded');
      };
      if (img.complete && img.naturalHeight > 0) {
        onDone();
      } else {
        img.addEventListener('load', onDone, { once: true });
        img.addEventListener('error', onDone, { once: true });
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      loadDynamicNews();
      bindNewsImages();
    });
  } else {
    loadDynamicNews();
    bindNewsImages();
  }
  window.addEventListener('load', bindNewsImages);
})();
