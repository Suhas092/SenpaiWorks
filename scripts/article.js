"use strict";

const ARTICLES_DATA = {
  "senpaiworks-2-release": {
    id: "senpaiworks-2-release",
    category: "System Architecture & Release Notes",
    title: "SenpaiWorks 2.0 Architectural Overhaul & Platform Release Notes",
    date: "July 2026",
    author: "Team SenpaiWorks",
    readTime: "7 mins read",
    bgImage: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_auto/v1757630827/all_characters_yvk9ik.webp",
    content: `
      <p>We are thrilled to officially unveil <strong>SenpaiWorks 2.0</strong>! This release represents a complete architectural evolution of our anime digital marketplace, artwork library, and streetwear storefront. What started as a basic prototype listing page has transformed into a high-performance, modular web application complete with dynamic product rendering, interactive gallery swatches, a customer review engine, dedicated checkout flows, user auth guards, and an administrative management dashboard.</p>

      <h3>1. The Evolution: Before (v1.x) vs. After (SenpaiWorks 2.0)</h3>
      <p>Below is a comparative overview contrasting the legacy v1.x website with the updated 2.0 ecosystem:</p>

      <div class="article-compare-grid">
        <div class="article-compare-card article-compare-before">
          <h4>SenpaiWorks 1.x (Legacy Baseline)</h4>
          <ul>
            <li><strong>Static Listings:</strong> Products were hardcoded in HTML markup with non-dynamic pages.</li>
            <li><strong>Unclickable Image Grids:</strong> Recommendation cards and thumbnail images could not be clicked to open details.</li>
            <li><strong>Static Placeholder Reviews:</strong> Reviews section consisted of uneditable static text blocks.</li>
            <li><strong>No Auth State:</strong> No guest prompts, mobile OTP options, or persistent session management.</li>
            <li><strong>Static Alert Cart:</strong> Shopping cart relied on basic popups without subtotal/shipping calculations.</li>
            <li><strong>No Admin Controls:</strong> Product catalog modifications required manual source code edits.</li>
          </ul>
        </div>

        <div class="article-compare-card article-compare-after">
          <h4>SenpaiWorks 2.0 (Current Release)</h4>
          <ul>
            <li><strong>Dynamic Catalog Engine:</strong> Centralized data schema in <code>products-data.js</code> supporting live search and category routing.</li>
            <li><strong>Clickable Product Cards:</strong> Responsive 4-column cards with floating badge overlays and instant detail navigation.</li>
            <li><strong>Interactive 5-Star Reviews:</strong> Glassmorphic modal composer with live aggregate calculations and <code>localStorage</code> persistence.</li>
            <li><strong>Unified Auth System:</strong> Global <code>window.checkAuthOrPrompt</code> guard with Email/Password & Mobile OTP verification.</li>
            <li><strong>Dedicated Checkout & Drawer:</strong> Dedicated checkout page (<code>checkout.html</code>), slide-out cart drawer, and ₹ INR / $ USD currency formats.</li>
            <li><strong>Creator Admin Portal:</strong> Built-in admin dashboard (<code>admin.html</code>) for real-time catalog and stock management.</li>
          </ul>
        </div>
      </div>

      <!-- Embedded Video Box -->
      <div class="article-video-box">
        <div class="article-video-header">
          <span class="article-video-badge"><i class="fa-brands fa-youtube"></i> SENPAIWORKS 2.0 VIDEO PROOF</span>
          <h4>Official Feature Demonstration & Live Benchmark Walkthrough</h4>
        </div>
        <div class="article-video-wrapper">
          <iframe src="https://www.youtube.com/embed/SsoV6Mdjr6A?rel=0&modestbranding=1" title="SenpaiWorks 2.0 Video Proof" allowfullscreen></iframe>
        </div>
      </div>

      <h3>2. Feature Matrix & Capabilities Breakdown</h3>
      <div class="article-table-wrapper">
        <table class="article-table">
          <thead>
            <tr>
              <th>Feature Area</th>
              <th>Legacy Baseline (v1.x)</th>
              <th>SenpaiWorks 2.0 Upgrade</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Catalog Engine</strong></td>
              <td>Static HTML listings</td>
              <td>Centralized JSON data model in <code>products-data.js</code> with instant search & category routing</td>
            </tr>
            <tr>
              <td><strong>Store Details Page</strong></td>
              <td>Static text & static images</td>
              <td>Full <code>store-detail.html</code> with thumbnail swatches, color/size selection, size guide modal & 4-column recommendations</td>
            </tr>
            <tr>
              <td><strong>Customer Reviews</strong></td>
              <td>Uneditable text blocks</td>
              <td>Interactive 5-star rating modal, aggregate stats calculator, and <code>localStorage</code> persistence</td>
            </tr>
            <tr>
              <td><strong>Cart & Checkout</strong></td>
              <td>Basic browser alerts</td>
              <td>Dedicated checkout flow (<code>checkout.html</code>), slide-out cart drawer (<code>drawer.html</code>), free shipping thresholds & dual INR (₹) / USD ($) formatting</td>
            </tr>
            <tr>
              <td><strong>Authentication Guard</strong></td>
              <td>No session management</td>
              <td>Unified <code>checkAuthOrPrompt()</code> with Mobile OTP, Email login, and persistent profile state</td>
            </tr>
            <tr>
              <td><strong>Creator Admin Dashboard</strong></td>
              <td>Direct code editing required</td>
              <td>Integrated Admin Portal (<code>admin.html</code>) for live product editing, stock toggles, and badge controls</td>
            </tr>
            <tr>
              <td><strong>Design System</strong></td>
              <td>Basic layout styling</td>
              <td>Modern dark theme, glassmorphism overlays, Plus Jakarta Sans typography, and fluid micro-animations</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>3. Key Engineering Upgrades in 2.0</h3>

      <h4>3.1. Store Detail & Interactive Recommendations Engine</h4>
      <p>The product details view (<code>store-detail.html</code> and <code>store-detail.js</code>) has been rebuilt to deliver an e-commerce experience comparable to leading streetwear & asset platforms:</p>
      <ul>
        <li><strong>Clickable Image Galleries:</strong> Thumbnail swatches with smooth opacity transitions.</li>
        <li><strong>Color & Size Variant Selectors:</strong> Dynamic swatch switching for merchandise colors (Black, White, Purple, Red) and apparel sizing (S, M, L, XL, XXL).</li>
        <li><strong>Size Guide Modal:</strong> Interactive unit toggles (Imperial vs Metric) complete with an SVG shirt dimension diagram.</li>
        <li><strong>4-Column "You May Also Like" Grid:</strong> Fully responsive product grid rendering clickable cards with floating badges (*Pre-Order, New Arrival, Best Seller*).</li>
      </ul>

      <h4>3.2. Customer Review Engine & Rating Analytics</h4>
      <p>Customer feedback is now fully functional and persistent:</p>
      <ul>
        <li><strong>Write a Review Modal:</strong> Triggered via the "Write a Review" button with an interactive 5-star rating selector (*Poor, Fair, Good, Very Good, Excellent*).</li>
        <li><strong>Live Aggregate Recalculation:</strong> Automatically recalculates product star averages and updates rating distribution charts (5-star down to 1-star) in real time.</li>
        <li><strong>LocalStorage Sync:</strong> Saved reviews are stored per product ID (<code>user_reviews_[product_id]</code>) and prepended instantly to the review feed.</li>
      </ul>

      <h4>3.3. Shopping Cart & Dedicated Checkout Experience</h4>
      <p>Purchasing items on SenpaiWorks is now seamless:</p>
      <ul>
        <li><strong>Slide-Out Cart Drawer (<code>drawer.html</code> / <code>drawer.js</code>):</strong> Accessible globally across the navigation header with live quantity management.</li>
        <li><strong>Dedicated Checkout Page (<code>checkout.html</code> / <code>checkout.js</code>):</strong> Includes contact info validation, address confirmation, shipping speed selectors, and dual payment support (UPI/Cards for India 🇮🇳, Credit Cards/PayPal for International 🌐).</li>
        <li><strong>Multi-Currency Smart Formatter:</strong> Automatically displays Indian Rupee (₹) prices for physical merchandise and USD ($) for global digital assets.</li>
      </ul>

      <h4>3.4. Unified Auth Guard & User State Management</h4>
      <p>A global authentication guard (<code>window.checkAuthOrPrompt</code>) intercepts protected actions—such as submitting reviews, instant buy, or accessing community feedback—prompting guest users to log in via Email or SMS Mobile OTP before proceeding.</p>

      <h4>3.5. Creator Admin Portal (<code>admin.html</code>)</h4>
      <p>SenpaiWorks creators can manage catalog offerings in real time without touching source code. Features include stock availability toggles, badge modifications, price updates, and platform metric dashboards.</p>

      <div class="article-callout">
        <p>✨ SenpaiWorks 2.0 is live! Explore our merchandise store, inspect customer reviews, or check out our latest digital asset releases.</p>
      </div>
    `
  },
  "deadpool-animation": {
    id: "deadpool-animation",
    category: "3D Animation & VFX",
    title: "Deadpool & Wolverine Fan Animation — Behind the Scenes & VFX Breakdown",
    date: "July 2026",
    author: "Animation Team",
    readTime: "5 mins read",
    bgImage: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630827/deadpool_poster_krntp0.webp",
    content: `
      <p>Step inside our animation suite to discover how our 3D artists brought Marvel's iconic duo to life in high-octane 4K rendering. From dynamic cloth simulations to custom toon-shading pipelines in Blender, this article explores every stage of production.</p>
      <h3>Character Rigging & Simulation</h3>
      <p>Both characters feature high-density facial rigs, custom joint constraints for fluid action choreography, and layered cloth physics built specifically for oversized suit meshes.</p>
    `
  },
  "suzens-idol-debut": {
    id: "suzens-idol-debut",
    category: "Virtual Idol Group",
    title: "Suzens: The First Bloom Visual Debut & Stage Performance Teaser",
    date: "July 2026",
    author: "Art Team",
    readTime: "4 mins read",
    bgImage: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630847/suzan_godrays_jggu36.webp",
    content: `
      <p>Meet Suzens, our flagship virtual idol group! Featuring original character concepts, real-time facial motion capture, and custom lighting shaders developed in-house for stage concerts.</p>
    `
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const articleId = urlParams.get("id") || "senpaiworks-2-release";

  const article = ARTICLES_DATA[articleId] || ARTICLES_DATA["senpaiworks-2-release"];

  // Populate hero & page title
  document.title = `${article.title} — SenpaiWorks Article`;

  const coverImg = document.getElementById("article-cover-img");
  const heroCategory = document.getElementById("article-hero-category");
  const heroTitle = document.getElementById("article-hero-title");
  const heroAuthor = document.getElementById("article-hero-author");
  const heroDate = document.getElementById("article-hero-date");
  const heroReadTime = document.getElementById("article-hero-readtime");
  const articleBody = document.getElementById("article-body-content");

  if (coverImg) coverImg.src = article.bgImage;
  if (heroCategory) heroCategory.textContent = article.category;
  if (heroTitle) heroTitle.textContent = article.title;
  if (heroAuthor) heroAuthor.textContent = article.author;
  if (heroDate) heroDate.textContent = article.date;
  if (heroReadTime) heroReadTime.textContent = article.readTime;
  if (articleBody) articleBody.innerHTML = article.content;

  // Render More Stories Grid
  const moreGrid = document.getElementById("more-articles-grid");
  if (moreGrid) {
    const otherArticles = Object.values(ARTICLES_DATA).filter(a => a.id !== article.id);
    moreGrid.innerHTML = otherArticles.map(item => `
      <a href="article.html?id=${item.id}" class="more-article-card">
        <img src="${item.bgImage}" alt="${item.title}" class="more-article-img">
        <div class="more-article-body">
          <h4>${item.title}</h4>
          <p>${item.category} · ${item.readTime}</p>
        </div>
      </a>
    `).join("");
  }
});
