/* ==========================================================================
   Course Details Page Data Store & Controller
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Comprehensive Course Database
  const coursesData = {
    "zbrush": {
      id: "zbrush",
      title: "ZBrush Character Sculpting: Sculpt Anime Characters from Scratch",
      subtitle: "Learn anatomy, facial features, hair sculpting, and secondary detail pass for 3D anime characters",
      category: "3D Digital Sculpting",
      breadcrumbCategory: "3D Sculpting",
      badge: "Bestseller",
      rating: "4.9",
      ratingCount: "(1,004 ratings)",
      learnersCount: "5,892",
      instructor: "SenpaiWorks Studio",
      updatedDate: "July 2026",
      thumbnail: "assets/courses/zbrush-course.png",
      videoUrl: "https://www.youtube.com/embed/SsoV6Mdjr6A",
      price: "₹489.00",
      originalPrice: "₹3,199.00",
      discount: "84% off",
      monthlyPrice: "₹375.00",
      originalMonthlyPrice: "₹500.00",
      whatYouWillLearn: [
        "Anatomy and forms of human head and face for anime styling",
        "Sculpting anime head from sphere with digital clay techniques",
        "Creating stylized anime hair using custom ZBrush curves",
        "Secondary detail pass, facial planes, and polypainting"
      ],
      relatedTopics: ["3D Sculpting", "Anatomy", "ZBrush", "3D & Animation", "Character Design"],
      duration: "13.5 hours on-demand video",
      resources: "1 downloadable 3D resource pack",
      requirements: [
        "Basic understanding of ZBrush interface navigation.",
        "A graphics tablet or pen display is recommended for pressure sensitivity.",
        "No prior anatomical expertise required—we start from zero!"
      ],
      curriculum: [
        {
          sectionTitle: "Section 1: Introduction to ZBrush & Anime Proportions",
          metaSummary: "3 lectures • 1h 45m",
          lectures: [
            { name: "01. Interface Setup & Custom Brush Configuration", duration: "12:15", isPreview: true },
            { name: "02. Anime Head Planes & Facial Proportions", duration: "38:50", isPreview: true },
            { name: "03. Base Mesh Sculpting from Sphere", duration: "54:10", isPreview: false }
          ]
        },
        {
          sectionTitle: "Section 2: Facial Features & Eye Sculpting",
          metaSummary: "4 lectures • 2h 30m",
          lectures: [
            { name: "04. Anime Eye Socket & Iris Sculpting", duration: "35:44", isPreview: true },
            { name: "05. Nose & Mouth Stylization", duration: "44:33", isPreview: false },
            { name: "06. Ear Anatomy & Stylized Folds", duration: "37:22", isPreview: false },
            { name: "07. Secondary Detail Pass & Smooth Polish", duration: "32:10", isPreview: false }
          ]
        },
        {
          sectionTitle: "Section 3: Anime Hair Sculpting with Curves",
          metaSummary: "3 lectures • 2h 15m",
          lectures: [
            { name: "08. Hair Blockout Strategy & Primary Shapes", duration: "47:48", isPreview: false },
            { name: "09. Creating Hair Strands with Curve Brushes", duration: "48:43", isPreview: false },
            { name: "10. Sharp Anime Tips & Flow Adjustment", duration: "38:47", isPreview: false }
          ]
        },
        {
          sectionTitle: "Section 4: Polypainting & Mesh Preparation",
          metaSummary: "4 lectures • 3h 10m",
          lectures: [
            { name: "11. Polypaint Skin Tones & Eye Highlights", duration: "41:25", isPreview: false },
            { name: "12. Decimation Master & High-Poly Export", duration: "40:43", isPreview: false },
            { name: "13. Preparing Mesh for Retopology in Blender", duration: "35:32", isPreview: false },
            { name: "14. Final Render & Portfolio Presentation", duration: "41:38", isPreview: false }
          ]
        }
      ]
    },
    "blender": {
      id: "blender",
      title: "Blender 3D Complete Pipeline: Modeling, Topology & Texturing",
      subtitle: "Comprehensive guide to anime character modeling, clean low-poly retopology, weight painting, UV unwrapping, and stylized shading",
      category: "3D Modeling & Rigging",
      breadcrumbCategory: "3D Modeling",
      badge: "Highest Rated",
      rating: "4.9",
      ratingCount: "(1,420 ratings)",
      learnersCount: "7,210",
      instructor: "SenpaiWorks Studio",
      updatedDate: "July 2026",
      thumbnail: "assets/courses/blender-course.png",
      videoUrl: "https://www.youtube.com/embed/SsoV6Mdjr6A",
      price: "₹499.00",
      originalPrice: "₹3,499.00",
      discount: "86% off",
      monthlyPrice: "₹375.00",
      originalMonthlyPrice: "₹500.00",
      whatYouWillLearn: [
        "Complete 3D anime character creation inside Blender",
        "Clean quad retopology and UV layout optimization",
        "Weight painting, bone constraints, and armature setups",
        "Non-photorealistic (NPR) anime shaders and lineart modifiers"
      ],
      relatedTopics: ["Blender 3D", "Anime Modeling", "3D Rigging", "Texturing", "NPR Shaders"],
      duration: "16.2 hours on-demand video",
      resources: "2 downloadable Blender project files",
      requirements: [
        "Blender 3.6 or later installed.",
        "Basic knowledge of 3D viewport navigation.",
        "Computer with dedicated GPU recommended."
      ],
      curriculum: [
        {
          sectionTitle: "Section 1: Blender Workspace & Modeling Setup",
          metaSummary: "3 lectures • 1h 30m",
          lectures: [
            { name: "01. Setting up Reference Images & Viewports", duration: "15:20", isPreview: true },
            { name: "02. Blockout & Proportions", duration: "42:10", isPreview: true },
            { name: "03. Face Modeling with Subsurf Modifier", duration: "32:30", isPreview: false }
          ]
        },
        {
          sectionTitle: "Section 2: Retopology & UV Unwrapping",
          metaSummary: "3 lectures • 2h 45m",
          lectures: [
            { name: "04. Clean Quad Retopology for Face & Body", duration: "55:10", isPreview: true },
            { name: "05. Seam Placement & Efficient UV Packing", duration: "48:20", isPreview: false },
            { name: "06. Baking Normal Maps & Curvature", duration: "41:30", isPreview: false }
          ]
        },
        {
          sectionTitle: "Section 3: Stylized NPR Shading & Rigging",
          metaSummary: "4 lectures • 3h 20m",
          lectures: [
            { name: "07. Custom Anime Toon Shader Nodes", duration: "50:15", isPreview: false },
            { name: "08. Outline Lineart Modifiers", duration: "45:30", isPreview: false },
            { name: "09. Rigify Armature & Weight Painting", duration: "58:40", isPreview: false },
            { name: "10. Pose Setup & Final EEVEE Render", duration: "45:15", isPreview: false }
          ]
        }
      ]
    },
    "marvelous-designer": {
      id: "marvelous-designer",
      title: "Marvelous Designer: 3D Clothing & Anime Garment Creation",
      subtitle: "Learn pattern creation, sewing workflows, realistic anime streetwear draping, and exporting clean garment meshes to Blender & ZBrush",
      category: "3D Clothing & Simulation",
      breadcrumbCategory: "3D Garments",
      badge: "New Masterclass",
      rating: "4.8",
      ratingCount: "(840 ratings)",
      learnersCount: "3,450",
      instructor: "SenpaiWorks Studio",
      updatedDate: "July 2026",
      thumbnail: "assets/courses/marvelous-designer-course.png",
      videoUrl: "https://www.youtube.com/embed/SsoV6Mdjr6A",
      price: "₹449.00",
      originalPrice: "₹2,999.00",
      discount: "85% off",
      monthlyPrice: "₹375.00",
      originalMonthlyPrice: "₹500.00",
      whatYouWillLearn: [
        "2D pattern drafting for hoodies, jackets, skirts, and streetwear",
        "Sewing and arranging cloth around 3D character avatars",
        "Adjusting fabric physics, fold density, and stiffness properties",
        "Exporting clean quads & UVs for Blender & ZBrush rendering"
      ],
      relatedTopics: ["Marvelous Designer", "3D Fashion", "Streetwear", "Cloth Physics", "3D Simulation"],
      duration: "10.8 hours on-demand video",
      resources: "5 garment pattern files (.zpac)",
      requirements: [
        "Marvelous Designer software installed.",
        "Basic understanding of 3D avatar imports."
      ],
      curriculum: [
        {
          sectionTitle: "Section 1: 2D Pattern Drafting & Sewing",
          metaSummary: "3 lectures • 1h 40m",
          lectures: [
            { name: "01. Marvelous Designer Interface & Avatar Setup", duration: "18:30", isPreview: true },
            { name: "02. Drafting Oversized Hoodie Patterns", duration: "45:10", isPreview: true },
            { name: "03. Sewing & Simulation Run", duration: "36:20", isPreview: false }
          ]
        },
        {
          sectionTitle: "Section 2: Anime Streetwear Details & Accessories",
          metaSummary: "3 lectures • 2h 15m",
          lectures: [
            { name: "04. Zippers, Pockets & Ribbed Cuffs", duration: "42:15", isPreview: false },
            { name: "05. Layered Skirts & Pleat Simulation", duration: "48:30", isPreview: false },
            { name: "06. Fine-Tuning Fabric Folds & Internal Lines", duration: "44:15", isPreview: false }
          ]
        }
      ]
    },
    "web-dev": {
      id: "web-dev",
      title: "Creating Modern Web Portfolios & Creative Websites",
      subtitle: "Step-by-step masterclass on building responsive artist portfolio websites, glassmorphism layouts, interactive Web3D showcases, and custom JavaScript",
      category: "Web Development",
      breadcrumbCategory: "Front End",
      badge: "Popular",
      rating: "4.9",
      ratingCount: "(2,100 ratings)",
      learnersCount: "9,420",
      instructor: "SenpaiWorks Studio",
      updatedDate: "July 2026",
      thumbnail: "assets/courses/web-dev-course.png",
      videoUrl: "https://www.youtube.com/embed/SsoV6Mdjr6A",
      price: "₹399.00",
      originalPrice: "₹2,499.00",
      discount: "84% off",
      monthlyPrice: "₹375.00",
      originalMonthlyPrice: "₹500.00",
      whatYouWillLearn: [
        "Building modern responsive web layouts with HTML5, CSS3 & JS",
        "Creating glassmorphism cards, glowing backgrounds, and dark modes",
        "Implementing drag & swipe carousels, mobile drawers, and modals",
        "Deploying portfolio web applications with live performance optimization"
      ],
      relatedTopics: ["Web Development", "HTML/CSS", "JavaScript", "Portfolio Design", "Web3D"],
      duration: "14.0 hours on-demand video",
      resources: "Full website source code template",
      requirements: [
        "No prior coding experience required!",
        "Any free code editor (VS Code recommended)."
      ],
      curriculum: [
        {
          sectionTitle: "Section 1: HTML5 & CSS3 Design Foundation",
          metaSummary: "3 lectures • 1h 50m",
          lectures: [
            { name: "01. Project Setup & Semantic Layout", duration: "22:10", isPreview: true },
            { name: "02. Flexbox, CSS Grid & Responsive Breakpoints", duration: "48:30", isPreview: true },
            { name: "03. Glassmorphism & Custom CSS Design Tokens", duration: "39:20", isPreview: false }
          ]
        },
        {
          sectionTitle: "Section 2: JavaScript Interactivity & Carousels",
          metaSummary: "3 lectures • 2h 20m",
          lectures: [
            { name: "04. DOM Manipulation & Event Handlers", duration: "45:10", isPreview: false },
            { name: "05. Building Touch-Swipe Drag Carousels", duration: "52:40", isPreview: false },
            { name: "06. Dynamic Data Parsing & Query Params", duration: "42:10", isPreview: false }
          ]
        }
      ]
    },
    "unreal-engine": {
      id: "unreal-engine",
      title: "Unreal Engine 5: Anime Environment Art & Cinematic Rendering",
      subtitle: "Master environment building in Unreal Engine 5, Lumen dynamic lighting, stylized anime shaders, camera sequencers, and real-time cinematic rendering",
      category: "Real-Time & Environments",
      breadcrumbCategory: "Unreal Engine 5",
      badge: "Trending",
      rating: "4.9",
      ratingCount: "(980 ratings)",
      learnersCount: "4,150",
      instructor: "SenpaiWorks Studio",
      updatedDate: "July 2026",
      thumbnail: "assets/courses/unreal-engine-course.png",
      videoUrl: "https://www.youtube.com/embed/SsoV6Mdjr6A",
      price: "₹549.00",
      originalPrice: "₹3,999.00",
      discount: "86% off",
      monthlyPrice: "₹375.00",
      originalMonthlyPrice: "₹500.00",
      whatYouWillLearn: [
        "Assembling anime fantasy environments with Megascans & custom assets",
        "Configuring Unreal Engine 5 Lumen global illumination & sky atmosphere",
        "Authoring stylized post-process anime shaders and toon cel-shading",
        "Cinematic Camera Sequencer animations and 4K Movie Render Queue"
      ],
      relatedTopics: ["Unreal Engine 5", "Environment Art", "Lumen", "Cinematics", "Stylized Shaders"],
      duration: "15.4 hours on-demand video",
      resources: "UE5 project sample environment",
      requirements: [
        "Unreal Engine 5 installed.",
        "Dedicated graphics card (NVIDIA GTX 1070 / RTX or equivalent)."
      ],
      curriculum: [
        {
          sectionTitle: "Section 1: UE5 Project Setup & Environment Blockout",
          metaSummary: "3 lectures • 1h 45m",
          lectures: [
            { name: "01. Project Settings & Foliage Tool Setup", duration: "25:10", isPreview: true },
            { name: "02. Landscape Composition & Blockout", duration: "44:20", isPreview: true },
            { name: "03. Foliage Placement & Anime Tree Shaders", duration: "35:40", isPreview: false }
          ]
        },
        {
          sectionTitle: "Section 2: Lumen Lighting & Post-Processing",
          metaSummary: "3 lectures • 2h 30m",
          lectures: [
            { name: "04. Volumetric Fog & Sunset Sky Atmosphere", duration: "48:15", isPreview: false },
            { name: "05. Cel-Shaded Post-Process Shaders", duration: "52:30", isPreview: false },
            { name: "06. Camera Sequencer & 4K Video Export", duration: "49:15", isPreview: false }
          ]
        }
      ]
    }
  };

  // 2. Read 'id' from URL query string
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id') || 'zbrush'; // Default to ZBrush if no ID
  const course = coursesData[courseId] || coursesData['zbrush'];

  // 3. Populate Hero & Main Content DOM
  document.title = `${course.title} - SenpaiWorks`;

  const breadcrumbCatEl = document.getElementById('breadcrumb-category');
  if (breadcrumbCatEl) breadcrumbCatEl.textContent = course.breadcrumbCategory;

  const titleEl = document.getElementById('course-title');
  if (titleEl) titleEl.textContent = course.title;

  const subtitleEl = document.getElementById('course-subtitle');
  if (subtitleEl) subtitleEl.textContent = course.subtitle;

  const badgeEl = document.getElementById('course-badge');
  if (badgeEl) badgeEl.textContent = course.badge;

  const instructorEl = document.getElementById('course-instructor');
  if (instructorEl) instructorEl.textContent = course.instructor;

  const updatedEl = document.getElementById('course-updated');
  if (updatedEl) updatedEl.textContent = course.updatedDate;

  const ratingEl = document.getElementById('course-rating');
  if (ratingEl) ratingEl.textContent = course.rating;

  const ratingCountEl = document.getElementById('course-rating-count');
  if (ratingCountEl) ratingCountEl.textContent = course.ratingCount;

  const learnersEl = document.getElementById('course-learners');
  if (learnersEl) learnersEl.textContent = course.learnersCount;

  // Sidebar Elements
  const sidebarThumb = document.getElementById('sidebar-thumb');
  if (sidebarThumb) sidebarThumb.src = course.thumbnail;

  const priceEl = document.getElementById('course-price');
  if (priceEl) priceEl.textContent = course.price;

  const originalPriceEl = document.getElementById('course-original-price');
  if (originalPriceEl) originalPriceEl.textContent = course.originalPrice;

  const discountEl = document.getElementById('course-discount');
  if (discountEl) discountEl.textContent = course.discount;

  const incDuration = document.getElementById('inc-duration');
  if (incDuration) incDuration.textContent = course.duration;

  const incResources = document.getElementById('inc-resources');
  if (incResources) incResources.textContent = course.resources;

  // 4. Populate "What You'll Learn" Grid
  const learnGridEl = document.getElementById('what-you-will-learn');
  if (learnGridEl && course.whatYouWillLearn) {
    learnGridEl.innerHTML = course.whatYouWillLearn.map(item => `
      <div class="learn-item">
        <i class="fa-solid fa-check"></i>
        <span>${item}</span>
      </div>
    `).join('');
  }

  // 5. Populate Related Topics Tags
  const topicsEl = document.getElementById('related-topics');
  if (topicsEl && course.relatedTopics) {
    topicsEl.innerHTML = course.relatedTopics.map(topic => `
      <span class="topic-pill">${topic}</span>
    `).join('');
  }

  // 6. Populate Requirements List
  const reqListEl = document.getElementById('course-requirements');
  if (reqListEl && course.requirements) {
    reqListEl.innerHTML = course.requirements.map(req => `
      <li>${req}</li>
    `).join('');
  }

  // 7. Calculate Total Lectures & Length
  let totalLectures = 0;
  course.curriculum.forEach(sec => {
    totalLectures += sec.lectures.length;
  });

  const contentMetaEl = document.getElementById('content-meta-summary');
  if (contentMetaEl) {
    contentMetaEl.textContent = `${course.curriculum.length} sections • ${totalLectures} lectures • ${course.duration}`;
  }

  // 8. Populate Accordion Curriculum
  const accordionContainer = document.getElementById('curriculum-accordion');
  if (accordionContainer && course.curriculum) {
    accordionContainer.innerHTML = course.curriculum.map((section, idx) => `
      <div class="accordion-item ${idx === 0 ? 'active' : ''}">
        <div class="accordion-header">
          <div class="accordion-title-wrap">
            <i class="fa-solid fa-chevron-down accordion-icon"></i>
            <span>${section.sectionTitle}</span>
          </div>
          <span class="accordion-meta-info">${section.metaSummary}</span>
        </div>
        <div class="accordion-content">
          ${section.lectures.map(lec => `
            <div class="lecture-row">
              <div class="lecture-left">
                <i class="fa-solid fa-circle-play"></i>
                <span>${lec.name}</span>
                ${lec.isPreview ? `<span class="preview-btn-text" data-video="${course.videoUrl}">Preview</span>` : ''}
              </div>
              <span class="lecture-duration">${lec.duration}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    // Accordion Toggle Event Listeners
    accordionContainer.querySelectorAll('.accordion-header').forEach(header => {
      header.addEventListener('click', () => {
        const item = header.parentElement;
        item.classList.toggle('active');
      });
    });
  }

  // 9. Pricing Option Radio Selection
  const subOption = document.getElementById('sub-option');
  const oneTimeOption = document.getElementById('one-time-option');
  const radioSub = document.getElementById('radio-sub');
  const radioOnce = document.getElementById('radio-once');
  const ctaBtn = document.getElementById('cta-action-btn');

  if (subOption && oneTimeOption) {
    subOption.addEventListener('click', () => {
      radioSub.checked = true;
      subOption.classList.add('active');
      oneTimeOption.classList.remove('active');
      if (ctaBtn) ctaBtn.querySelector('span').textContent = 'Start Subscription';
    });

    oneTimeOption.addEventListener('click', () => {
      radioOnce.checked = true;
      oneTimeOption.classList.add('active');
      subOption.classList.remove('active');
      if (ctaBtn) ctaBtn.querySelector('span').textContent = `Enroll Now - ${course.price}`;
    });
  }

  // 10. Coupon Code Handling
  const couponInput = document.getElementById('coupon-input');
  const applyCouponBtn = document.getElementById('apply-coupon-btn');
  const couponMsg = document.getElementById('coupon-status-msg');

  if (applyCouponBtn && couponInput) {
    applyCouponBtn.addEventListener('click', () => {
      const code = couponInput.value.trim().toUpperCase();
      if (!code) {
        couponMsg.className = 'coupon-status-msg error';
        couponMsg.textContent = 'Please enter a coupon code.';
        return;
      }

      if (code === 'SENPAI2026' || code === 'SENPAIWORKS') {
        couponMsg.className = 'coupon-status-msg success';
        couponMsg.textContent = 'Coupon SENPAI2026 Applied! Extra 20% discount unlocked.';
        if (priceEl) priceEl.textContent = '₹390.00';
      } else {
        couponMsg.className = 'coupon-status-msg error';
        couponMsg.textContent = 'Invalid coupon code. Try SENPAI2026';
      }
    });
  }

  // 11. Video Preview Modal
  const videoModal = document.getElementById('video-modal');
  const modalIframe = document.getElementById('modal-iframe');
  const playPreviewBtn = document.getElementById('play-preview-btn');
  const previewMediaBox = document.getElementById('preview-media-box');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const modalTitle = document.getElementById('modal-title');

  function openVideoModal(videoSrc, title) {
    if (videoModal && modalIframe) {
      modalIframe.src = videoSrc;
      if (modalTitle && title) modalTitle.textContent = title;
      videoModal.style.display = 'flex';
    }
  }

  function closeVideoModal() {
    if (videoModal && modalIframe) {
      videoModal.style.display = 'none';
      modalIframe.src = '';
    }
  }

  if (previewMediaBox) {
    previewMediaBox.addEventListener('click', () => {
      openVideoModal(course.videoUrl, `Preview: ${course.title}`);
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeVideoModal);
  }

  if (videoModal) {
    videoModal.addEventListener('click', (e) => {
      if (e.target === videoModal) closeVideoModal();
    });
  }

  // Delegate preview clicks from lecture rows
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('preview-btn-text')) {
      const videoSrc = e.target.getAttribute('data-video') || course.videoUrl;
      const lectureName = e.target.closest('.lecture-left').querySelector('span').textContent;
      openVideoModal(videoSrc, `Lecture Preview: ${lectureName}`);
    }
  });

});
