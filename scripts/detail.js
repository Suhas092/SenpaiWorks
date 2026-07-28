"use strict";

const animeData = {
  deadpool: {
    title: "Deadpool Animation",
    cover: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630827/deadpool_poster_krntp0.webp",
    genres: ["Action", "Adventure", "Superhero", "Fan-Animation"],
    watchUrl: "https://www.youtube.com/watch?v=SsoV6Mdjr6A",
    synonyms: "Deadpool Action Animation",
    aired: "May 6, 2025",
    premiered: "Summer 2025",
    duration: "3 min 41 sec",
    studio: "SenpaiWorks",
    software: ["Blender", "ZBrush", "Substance 3D Painter", "Marvelous Designer", "Maya", "After Effects", "Photoshop", "Houdini", "Mixamo", "Clip Studio Paint"],
    plot: `Fan-Made Animated Short by SenpaiWorks is an action-packed tribute inspired by the Marvel X-Men universe and the iconic portrayal of Deadpool by Ryan Reynolds. Featuring an ensemble cast of 5 key characters — Deadpool, Wolverine, Colossus, Yukio, and Negasonic — this project reimagines high-octane 3D anime action combined with comedic timing and cinematic visual effects.`,

    // Project Statistics Dashboard
    stats: {
      totalCharacters: 5,
      totalAssets: 48,
      completedStages: 16,
      productionProgress: 100,
      estimatedCompletion: "May 2025 (Released)"
    },

    // Characters Cast Breakdown
    characters: [
      { name: "Deadpool (Wade Wilson)", role: "Protagonist", description: "High-detail suit sculpt with custom katana sheaths, pouch utility belt, and expressive eye blendshapes for mask emotes." },
      { name: "Wolverine (Logan)", role: "Co-Star", description: "Adamantium claw prop models, muscle mesh topology, and distressed leather suit textures." },
      { name: "Colossus (Piotr Rasputin)", role: "Supporting Heavy", description: "Metallic chrome anisotropic shader setup and heavy muscle rigging deformation." },
      { name: "Yukio", role: "Supporting Ninja", description: "Dynamic hair particle hair cards and energetic electric whip VFX setup." },
      { name: "Negasonic Teenage Warhead", role: "Supporting Mutant", description: "X-Men yellow/black suit design, flame blast aura particle effects." }
    ],

    // 16 Pipeline Stages Data
    pipelineStages: [
      {
        id: "research",
        number: "01",
        title: "Research",
        icon: "fa-solid fa-magnifying-glass",
        progress: 100,
        status: "Completed",
        desc: "Before creating anything, references were gathered from real-life stunt references, Ryan Reynolds' Deadpool movie choreography, Marvel comic turnarounds, and high-tempo anime action sequences.",
        software: ["Photoshop", "PureRef"],
        notes: "Studied comic suit stitch seams, tactical leather webbing, and katana action timing for Deadpool, Wolverine, and Colossus.",
        gallery: [
          { url: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630827/deadpool_poster_krntp0.webp", caption: "Deadpool Visual Moodboard & Reference Study" }
        ]
      },
      {
        id: "concept-art",
        number: "02",
        title: "Concept Art",
        icon: "fa-solid fa-palette",
        progress: 100,
        status: "Completed",
        desc: "Concept artists explored multiple costume variations, mask expressions, silhouette tests, and key visual art for the 5-character ensemble cast.",
        software: ["Clip Studio Paint", "Photoshop"],
        notes: "Designed suit variations balancing comic-book accuracy with high-tech tactical gear for Deadpool and Wolverine.",
        gallery: [
          { url: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630827/deadpool_poster_krntp0.webp", caption: "Character Concept & Color Key Sheet" }
        ]
      },
      {
        id: "story-development",
        number: "03",
        title: "Story Development",
        icon: "fa-solid fa-book-bookmark",
        progress: 100,
        status: "Completed",
        desc: "Character dynamics between Deadpool, Wolverine, Colossus, Yukio, and Negasonic were outlined through animatics, shot lists, and comedic beat scripts.",
        software: ["Photoshop"],
        notes: "Structured fast-paced combat sequences alternating between intense swordplay and slapstick Deadpool moments.",
        gallery: []
      },
      {
        id: "character-design",
        number: "04",
        title: "Character Design",
        icon: "fa-solid fa-user-gear",
        progress: 100,
        status: "Completed",
        desc: "Turnaround sheets, expression charts, and weapon prop designs (Deadpool katanas, Wolverine claws, Yukio whip) were finalized.",
        software: ["Clip Studio Paint", "Photoshop"],
        notes: "Detailed model sheets created for all 5 characters: Deadpool, Wolverine, Colossus, Yukio, and Negasonic.",
        gallery: []
      },
      {
        id: "environment-design",
        number: "05",
        title: "Environment Design",
        icon: "fa-solid fa-city",
        progress: 100,
        status: "Completed",
        desc: "Set locations designed included ruined urban alleyways, destroyed X-Mansion courtyards, and industrial warehouse battlegrounds.",
        software: ["Blender", "Photoshop"],
        notes: "Designed modular destruction props and debris kits for high-speed action collision interaction.",
        gallery: []
      },
      {
        id: "3d-modeling",
        number: "06",
        title: "3D Modeling",
        icon: "fa-solid fa-cube",
        progress: 100,
        status: "Completed",
        desc: "Concept art transformed into 3D base meshes for all 5 character models and environmental props.",
        software: ["Blender", "Maya"],
        notes: "Clean quad blockouts constructed for Deadpool suit pouches, Wolverine armor plates, and Colossus heavy frame.",
        gallery: []
      },
      {
        id: "sculpting",
        number: "07",
        title: "Sculpting",
        icon: "fa-solid fa-paintbrush",
        progress: 100,
        status: "Completed",
        desc: "High-resolution digital sculpting of muscular anatomical detail, leather fabric wrinkles, weapon engravings, and facial morph targets.",
        software: ["ZBrush"],
        notes: "Sculpted intricate suit fabric weave on Deadpool and metallic muscle grooves on Colossus at multi-million polygon resolution.",
        gallery: []
      },
      {
        id: "retopology",
        number: "08",
        title: "Retopology",
        icon: "fa-solid fa-vector-square",
        progress: 100,
        status: "Completed",
        desc: "Production-ready low-poly meshes created from high-res ZBrush sculpts with clean edge flow for organic deformation.",
        software: ["Blender", "Maya"],
        notes: "Optimized poly-count while preserving silhouette sharpness around Deadpool's shoulder harness and joints.",
        gallery: []
      },
      {
        id: "uv-mapping",
        number: "09",
        title: "UV Mapping",
        icon: "fa-solid fa-border-all",
        progress: 100,
        status: "Completed",
        desc: "Models unfolded into UDIM UV tiles to maximize texel density for close-up cinematic hero shots.",
        software: ["Blender", "RizomUV"],
        notes: "Separated character UVs across dedicated 4K maps for head, suit torso, weapons, and accessories.",
        gallery: []
      },
      {
        id: "texturing",
        number: "10",
        title: "Texturing",
        icon: "fa-solid fa-spray-can",
        progress: 100,
        status: "Completed",
        desc: "PBR texture maps (Base Color, Normal, Roughness, Metallic, Height, Subsurface) painted for realistic fabric, leather, and metal finish.",
        software: ["Substance 3D Painter"],
        notes: "Hand-crafted battle wear, bullet scuffs, leather grain on Deadpool, and anisotropic chrome finish on Colossus.",
        gallery: []
      },
      {
        id: "rigging",
        number: "11",
        title: "Rigging",
        icon: "fa-solid fa-bone",
        progress: 100,
        status: "Completed",
        desc: "Advanced skeletal control systems built with IK/FK switches, custom facial morph sliders, and dynamic prop parenting.",
        software: ["Blender", "Maya", "Mixamo"],
        notes: "Created specialized eye-mask blendshapes allowing Deadpool's mask to squinch and emote dynamically like the films.",
        gallery: []
      },
      {
        id: "animation",
        number: "12",
        title: "Animation",
        icon: "fa-solid fa-person-running",
        progress: 100,
        status: "Completed",
        desc: "Keyframe animation passes bringing Deadpool, Wolverine, and Colossus to life with martial arts choreography and comedic beats.",
        software: ["Blender", "Maya"],
        notes: "Blended motion capture base passes with stylized hand-keyed anime timing (animating on 2s for snappy impacts).",
        gallery: []
      },
      {
        id: "lighting",
        number: "13",
        title: "Lighting",
        icon: "fa-solid fa-lightbulb",
        progress: 100,
        status: "Completed",
        desc: "Cinematic key, fill, and rim lighting rigs established for mood, depth, and character separation from backgrounds.",
        software: ["Blender (Cycles)"],
        notes: "High-contrast rim lights placed to emphasize Deadpool's red suit contours against dark urban backdrop.",
        gallery: []
      },
      {
        id: "rendering",
        number: "14",
        title: "Rendering",
        icon: "fa-solid fa-sliders",
        progress: 100,
        status: "Completed",
        desc: "High-quality multi-pass render output generated with diffuse, specular, AO, depth, and crypto-matte passes.",
        software: ["Blender Cycles"],
        notes: "Rendered at 4K resolution with denoising and custom toon shadow pass layers.",
        gallery: []
      },
      {
        id: "compositing",
        number: "15",
        title: "Compositing",
        icon: "fa-solid fa-wand-magic-sparkles",
        progress: 100,
        status: "Completed",
        desc: "Combining render passes with Houdini particle FX (sparks, blood impact, smoke clouds), camera shakes, lens flares, and color grading.",
        software: ["After Effects", "Houdini"],
        notes: "Integrated 3D particle simulations with stylized 2D anime speed lines and hit flashes.",
        gallery: []
      },
      {
        id: "final-production",
        number: "16",
        title: "Final Production",
        icon: "fa-solid fa-trophy",
        progress: 100,
        status: "Completed",
        desc: "Assembly of rendered animation, sound design, voice track sync, score mastering, and poster key art delivery.",
        software: ["Premiere Pro", "After Effects"],
        notes: "Released as a tribute animation short by SenpaiWorks celebrating the Marvel X-Men universe.",
        gallery: [
          { url: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630827/deadpool_poster_krntp0.webp", caption: "Final Render Release Key Art" }
        ]
      }
    ]
  },

  suzens: {
    title: "Suzens: The First Bloom",
    cover: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630847/suzan_godrays_jggu36.webp",
    genres: ["Pop", "Digital Band", "Music", "Fantasy"],
    watchUrl: "#",
    synonyms: "Suzens: The First Bloom",
    aired: "In Development",
    premiered: "TBA",
    duration: "Approx. 3–4 min (Music Video)",
    studio: "SenpaiWorks",
    software: ["Blender", "ZBrush", "Substance 3D Painter", "Marvelous Designer", "Maya", "After Effects", "Photoshop", "Houdini", "Clip Studio Paint"],
    plot: `Suzens is an original digital girl group inspired by K-pop culture, anime aesthetics, and idol storytelling. Each member is designed as a reflection of the creator's inspirations and favorite characters, reimagined as stylish, powerful idols.`,

    stats: {
      totalCharacters: 4,
      totalAssets: 62,
      completedStages: 10,
      productionProgress: 72,
      estimatedCompletion: "Q4 2025"
    },

    characters: [
      { name: "Suzen (Lead Vocal)", role: "Center Idol", description: "Ethereal god-ray lighting aesthetic, digital hair cards, holographic idol stage costume." },
      { name: "Kira (Main Dancer)", role: "Performer", description: "High-tempo choreography rigging, street-fashion techwear apparel." },
      { name: "Mei (Rapper / Visual)", role: "Visual", description: "Sharp anime eyes, cybernetic accessory props, dynamic cloth physics." },
      { name: "Rin (Sub-Vocal)", role: "Composer", description: "Keyboard/synth 3D prop modeling, pastel aesthetic color palette." }
    ],

    pipelineStages: [
      { id: "research", number: "01", title: "Research", icon: "fa-solid fa-magnifying-glass", progress: 100, status: "Completed", desc: "K-pop stage choreography research, fashion moodboards, and digital band visual references.", software: ["Photoshop", "PureRef"], notes: "Analyzed idol lightshow stages, stage outfit drapery, and anime hair physics.", gallery: [{ url: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630847/suzan_godrays_jggu36.webp", caption: "Suzens Concept Key Art" }] },
      { id: "concept-art", number: "02", title: "Concept Art", icon: "fa-solid fa-palette", progress: 100, status: "Completed", desc: "Character costume designs, color keys, and group logo branding created.", software: ["Clip Studio Paint"], notes: "Explored idol techwear dresses and glowing stage mic props.", gallery: [] },
      { id: "story-development", number: "03", title: "Story Development", icon: "fa-solid fa-book-bookmark", progress: 100, status: "Completed", desc: "Music video storyboard animatic and lore background written.", software: ["Photoshop"], notes: "Mapped beat-by-beat camera movements to song breakdown.", gallery: [] },
      { id: "character-design", number: "04", title: "Character Design", icon: "fa-solid fa-user-gear", progress: 100, status: "Completed", desc: "Model sheets and expression sheets finalized for all 4 band members.", software: ["Clip Studio Paint"], notes: "Detailed turnarounds for Suzen, Kira, Mei, and Rin.", gallery: [] },
      { id: "environment-design", number: "05", title: "Environment Design", icon: "fa-solid fa-city", progress: 100, status: "Completed", desc: "Digital holographic concert arena and sakura bloom stage created.", software: ["Blender", "Photoshop"], notes: "Modeled neon light towers, LED screen matrices, and stage floor reflections.", gallery: [] },
      { id: "3d-modeling", number: "06", title: "3D Modeling", icon: "fa-solid fa-cube", progress: 100, status: "Completed", desc: "Base meshes for all 4 idols and stage props completed.", software: ["Blender", "Maya"], notes: "Clean quad mesh topology optimized for complex dance deformation.", gallery: [] },
      { id: "sculpting", number: "07", title: "Sculpting", icon: "fa-solid fa-paintbrush", progress: 100, status: "Completed", desc: "Facial feature sculpts, soft anime features, and garment details.", software: ["ZBrush", "Marvelous Designer"], notes: "Simulated multi-layered cloth skirts and ruffles in Marvelous Designer.", gallery: [] },
      { id: "retopology", number: "08", title: "Retopology", icon: "fa-solid fa-vector-square", progress: 100, status: "Completed", desc: "Clean production topology created for facial blendshapes and limbs.", software: ["Blender"], notes: "Maintained optimal edge flow around eyes, mouth, and shoulders.", gallery: [] },
      { id: "uv-mapping", number: "09", title: "UV Mapping", icon: "fa-solid fa-border-all", progress: 100, status: "Completed", desc: "UDIM UV layouts for idol costumes, hair, and stage assets.", software: ["Blender"], notes: "Organized UV shells for 4K fabric and metallic shader assignment.", gallery: [] },
      { id: "texturing", number: "10", title: "Texturing", icon: "fa-solid fa-spray-can", progress: 80, status: "In Progress", desc: "Hand-painted cell textures, metallic glitter maps, and skin subsurface shaders.", software: ["Substance 3D Painter"], notes: "Painting iridescence maps for holographic costume accents.", gallery: [] },
      { id: "rigging", number: "11", title: "Rigging", icon: "fa-solid fa-bone", progress: 60, status: "In Progress", desc: "Dance skeleton rigging, facial ARKit morphs, and hair dynamic physics.", software: ["Blender", "Maya"], notes: "Setting up bone physics chains for long flowing hair and skirts.", gallery: [] },
      { id: "animation", number: "12", title: "Animation", icon: "fa-solid fa-person-running", progress: 30, status: "In Progress", desc: "Dance choreography keyframing and camera layout pass.", software: ["Blender"], notes: "Animating main chorus dance sequences to original music track.", gallery: [] },
      { id: "lighting", number: "13", title: "Lighting", icon: "fa-solid fa-lightbulb", progress: 20, status: "In Progress", desc: "Volumetric god-rays, concert spotlight beams, and glow bloom setup.", software: ["Blender"], notes: "Creating dynamic concert light shows synced to audio beats.", gallery: [] },
      { id: "rendering", number: "14", title: "Rendering", icon: "fa-solid fa-sliders", progress: 0, status: "Not Started", desc: "Multi-pass Eevee/Cycles render setup.", software: ["Blender"], notes: "Pending animation completion.", gallery: [] },
      { id: "compositing", number: "15", title: "Compositing", icon: "fa-solid fa-wand-magic-sparkles", progress: 0, status: "Not Started", desc: "Glitch FX, light leaks, sound sync, and final color grade.", software: ["After Effects"], notes: "Pending render pass output.", gallery: [] },
      { id: "final-production", number: "16", title: "Final Production", icon: "fa-solid fa-trophy", progress: 0, status: "Not Started", desc: "Final music video release and promo artwork.", software: ["Premiere Pro"], notes: "In active development.", gallery: [] }
    ]
  },

  zoro: {
    title: "Roronoa Zoro",
    cover: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630847/zoro_green_poster_unzusa.webp",
    genres: ["Action", "Drama", "Fan-Animation"],
    watchUrl: "https://www.instagram.com/reel/Cvt4tO7h0eg/",
    synonyms: "Itachi / Zoro Tribute",
    aired: "Coming Soon",
    premiered: "TBA",
    duration: "—",
    studio: "SenpaiWorks",
    software: ["Blender", "ZBrush", "Substance 3D Painter", "Photoshop", "After Effects"],
    plot: `Dive into the tragic and powerful story of Zoro/Itachi-inspired tribute animation — filled with loyalty, love, and sacrifice. A cinematic sequence that brings together emotional storytelling with dynamic action.`,

    stats: {
      totalCharacters: 2,
      totalAssets: 24,
      completedStages: 7,
      productionProgress: 55,
      estimatedCompletion: "Coming Soon"
    },

    characters: [
      { name: "Roronoa Zoro", role: "Swordsman", description: "Three-sword style prop meshes, green aura VFX, demon aura sculpt." },
      { name: "Itachi (Tribute Crossover)", role: "Legend", description: "Sharingen eye FX, Akatsuki cloak cloth physics, crow particle simulation." }
    ],

    pipelineStages: [
      { id: "research", number: "01", title: "Research", icon: "fa-solid fa-magnifying-glass", progress: 100, status: "Completed", desc: "Gathered anime reference shots, sword slash timing, and emotional lighting studies.", software: ["Photoshop"], notes: "Analyzed Wano arc Zoro sword effects and Itachi crow motifs.", gallery: [{ url: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630847/zoro_green_poster_unzusa.webp", caption: "Zoro Cinematic Poster Art" }] },
      { id: "concept-art", number: "02", title: "Concept Art", icon: "fa-solid fa-palette", progress: 100, status: "Completed", desc: "Green demon slash effects, sword design concept key art.", software: ["Clip Studio Paint"], notes: "Designed green Haki energy aura and katana geometry.", gallery: [] },
      { id: "story-development", number: "03", title: "Story Development", icon: "fa-solid fa-book-bookmark", progress: 100, status: "Completed", desc: "Cinematic storyboard animatic completed.", software: ["Photoshop"], notes: "Drafted emotional climax and sword clash choreography.", gallery: [] },
      { id: "character-design", number: "04", title: "Character Design", icon: "fa-solid fa-user-gear", progress: 100, status: "Completed", desc: "Zoro kimono and 3-sword prop model sheets finalized.", software: ["Clip Studio Paint"], notes: "Modeled Wado Ichimonji, Sandai Kitetsu, and Enma katanas.", gallery: [] },
      { id: "environment-design", number: "05", title: "Environment Design", icon: "fa-solid fa-city", progress: 100, status: "Completed", desc: "Mist-shrouded bamboo forest and burning temple arena created.", software: ["Blender"], notes: "Modeled bamboo trees, stone lanterns, and fallen leaves.", gallery: [] },
      { id: "3d-modeling", number: "06", title: "3D Modeling", icon: "fa-solid fa-cube", progress: 100, status: "Completed", desc: "3D meshes for Zoro, katanas, and environment props built.", software: ["Blender"], notes: "Clean low-poly topology for high-speed sword swings.", gallery: [] },
      { id: "sculpting", number: "07", title: "Sculpting", icon: "fa-solid fa-paintbrush", progress: 85, status: "In Progress", desc: "Sculpting muscular anatomy and cloth folds.", software: ["ZBrush"], notes: "Refining scar details and kimono fabric folds.", gallery: [] },
      { id: "retopology", number: "08", title: "Retopology", icon: "fa-solid fa-vector-square", progress: 50, status: "In Progress", desc: "Production topology in progress.", software: ["Blender"], notes: "Optimizing arm and shoulder edge loops for sword swings.", gallery: [] },
      { id: "uv-mapping", number: "09", title: "UV Mapping", icon: "fa-solid fa-border-all", progress: 0, status: "Not Started", desc: "Pending retopology.", software: ["Blender"], notes: "Planned 4K UV UDIM tiles.", gallery: [] },
      { id: "texturing", number: "10", title: "Texturing", icon: "fa-solid fa-spray-can", progress: 0, status: "Not Started", desc: "Pending UV mapping.", software: ["Substance 3D Painter"], notes: "Planned anime cell-shading.", gallery: [] },
      { id: "rigging", number: "11", title: "Rigging", icon: "fa-solid fa-bone", progress: 0, status: "Not Started", desc: "Pending mesh completion.", software: ["Blender"], notes: "Planned 3-sword constraint rigging.", gallery: [] },
      { id: "animation", number: "12", title: "Animation", icon: "fa-solid fa-person-running", progress: 0, status: "Not Started", desc: "Pending rigging.", software: ["Blender"], notes: "Planned high-speed sword action.", gallery: [] },
      { id: "lighting", number: "13", title: "Lighting", icon: "fa-solid fa-lightbulb", progress: 0, status: "Not Started", desc: "Pending animation.", software: ["Blender"], notes: "Planned moody green rim lighting.", gallery: [] },
      { id: "rendering", number: "14", title: "Rendering", icon: "fa-solid fa-sliders", progress: 0, status: "Not Started", desc: "Pending lighting.", software: ["Blender"], notes: "Cycles render engine.", gallery: [] },
      { id: "compositing", number: "15", title: "Compositing", icon: "fa-solid fa-wand-magic-sparkles", progress: 0, status: "Not Started", desc: "Pending render passes.", software: ["After Effects"], notes: "Green aura VFX compositing.", gallery: [] },
      { id: "final-production", number: "16", title: "Final Production", icon: "fa-solid fa-trophy", progress: 0, status: "Not Started", desc: "Pending final edit.", software: ["Premiere Pro"], notes: "Teaser currently active on Instagram.", gallery: [] }
    ]
  }
};

// Fetch ID from URL
const urlParams = new URLSearchParams(window.location.search);
const animeId = urlParams.get("id") || "deadpool";
const data = animeData[animeId];

function renderPage() {
  if (!data) return;

  // Header Elements
  const titleEl = document.querySelector(".detail-anime-title");
  if (titleEl) titleEl.textContent = data.title;

  const breadcrumbTitle = document.getElementById("breadcrumb-title");
  if (breadcrumbTitle) breadcrumbTitle.textContent = data.title;

  const coverEl = document.querySelector(".detail-cover-image");
  if (coverEl) coverEl.src = data.cover;

  // Genres
  const genreList = document.querySelector(".detail-genre-list");
  if (genreList) {
    genreList.innerHTML = `<span class="detail-sidebar-title" style="margin-right: 2px;">Genres:</span>` +
      data.genres.map(g => `<span class="detail-genre-badge">${g}</span>`).join("");
  }

  // Watch button
  const watchBtn = document.querySelector(".hero-buttons .watch-now");
  if (watchBtn) {
    watchBtn.href = data.watchUrl;
    watchBtn.innerHTML = data.watchUrl === "#"
      ? '<i class="fa-solid fa-clock"></i> Coming Soon'
      : '<i class="fa-solid fa-play"></i> Watch Now';
  }

  // Story Synopsis
  const plotTextEl = document.getElementById("plot-text");
  if (plotTextEl) plotTextEl.textContent = data.plot;

  // Render Dashboard Statistics
  if (data.stats) {
    const totalCharsEl = document.getElementById("stat-total-characters");
    if (totalCharsEl) totalCharsEl.textContent = data.stats.totalCharacters;

    const totalAssetsEl = document.getElementById("stat-total-assets");
    if (totalAssetsEl) totalAssetsEl.textContent = data.stats.totalAssets;

    const completedStagesEl = document.getElementById("stat-completed-stages");
    if (completedStagesEl) completedStagesEl.textContent = `${data.stats.completedStages}/16`;

    const progressValEl = document.getElementById("stat-progress-val");
    if (progressValEl) progressValEl.textContent = `${data.stats.productionProgress}%`;

    const progressBarEl = document.getElementById("stat-progress-bar-inner");
    if (progressBarEl) progressBarEl.style.width = `${data.stats.productionProgress}%`;
  }

  // Render Characters Cast Breakdown
  const charsContainer = document.getElementById("characters-cast-grid");
  if (charsContainer && data.characters) {
    charsContainer.innerHTML = data.characters.map(c => `
      <div class="character-cast-card">
        <div class="char-role-badge">${c.role}</div>
        <h4 class="char-name">${c.name}</h4>
        <p class="char-desc">${c.description}</p>
      </div>
    `).join("");
  }

  // Render Horizontal Timeline
  const timelineTrack = document.getElementById("pipeline-timeline-track");
  if (timelineTrack && data.pipelineStages) {
    timelineTrack.innerHTML = data.pipelineStages.map((stage, idx) => {
      let statusIcon = '<i class="fa-solid fa-check"></i>';
      let statusClass = "complete";
      if (stage.progress < 100 && stage.progress > 0) {
        statusIcon = `<span class="pct">${stage.progress}%</span>`;
        statusClass = "in-progress";
      } else if (stage.progress === 0) {
        statusIcon = '<i class="fa-solid fa-minus"></i>';
        statusClass = "pending";
      }

      return `
        <button class="timeline-node ${statusClass} ${idx === 0 ? 'active' : ''}" data-target="${stage.id}">
          <div class="node-badge">${stage.number}</div>
          <div class="node-label">${stage.title}</div>
          <div class="node-status">${statusIcon}</div>
        </button>
      `;
    }).join("");

    // Timeline button click listener
    timelineTrack.querySelectorAll(".timeline-node").forEach(btn => {
      btn.addEventListener("click", () => {
        timelineTrack.querySelectorAll(".timeline-node").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const targetId = btn.getAttribute("data-target");
        const targetCard = document.getElementById(`stage-card-${targetId}`);
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  // Render 16 Pipeline Stage Cards
  const stagesContainer = document.getElementById("pipeline-stages-container");
  if (stagesContainer && data.pipelineStages) {
    stagesContainer.innerHTML = data.pipelineStages.map(stage => {
      let statusBadgeClass = "status-complete";
      let statusText = `<i class="fa-solid fa-check"></i> Completed`;
      if (stage.progress < 100 && stage.progress > 0) {
        statusBadgeClass = "status-in-progress";
        statusText = `<i class="fa-solid fa-spinner fa-spin"></i> ${stage.progress}% In Progress`;
      } else if (stage.progress === 0) {
        statusBadgeClass = "status-pending";
        statusText = `<i class="fa-solid fa-hourglass-start"></i> Not Started`;
      }

      const softwareBadges = stage.software.map(sw => `<span class="sw-pill">${sw}</span>`).join(" ");
      const galleryHtml = stage.gallery && stage.gallery.length > 0 ? `
        <div class="stage-gallery-grid">
          ${stage.gallery.map(img => `
            <div class="stage-gallery-item">
              <img src="${img.url}" alt="${img.caption}" />
              <div class="gallery-caption">${img.caption}</div>
            </div>
          `).join("")}
        </div>
      ` : '';

      return `
        <div class="detail-card pipeline-stage-card" id="stage-card-${stage.id}">
          <div class="stage-card-header">
            <div class="stage-num-title">
              <span class="stage-num-badge">STAGE ${stage.number}</span>
              <h3 class="stage-title"><i class="${stage.icon}"></i> ${stage.title}</h3>
            </div>
            <div class="phase-status-badge ${statusBadgeClass}">${statusText}</div>
          </div>

          <p class="stage-desc">${stage.desc}</p>

          <div class="stage-progress-wrapper">
            <div class="stage-progress-bar">
              <div class="stage-progress-fill" style="width: ${stage.progress}%;"></div>
            </div>
          </div>

          <div class="stage-notes-block">
            <strong><i class="fa-solid fa-lightbulb"></i> Production Notes & Breakdown:</strong>
            <p>${stage.notes}</p>
          </div>

          <div class="stage-software-row">
            <span class="sw-label"><i class="fa-solid fa-screwdriver-wrench"></i> Software Used:</span>
            <div class="sw-pills-list">${softwareBadges}</div>
          </div>

          ${galleryHtml}
        </div>
      `;
    }).join("");
  }

  // Render Progress Tracker Matrix in Sidebar
  const trackerMatrix = document.getElementById("sidebar-progress-tracker");
  if (trackerMatrix && data.pipelineStages) {
    trackerMatrix.innerHTML = data.pipelineStages.map(stage => {
      let icon = '<i class="fa-solid fa-check" style="color:#10b981;"></i>';
      if (stage.progress < 100 && stage.progress > 0) {
        icon = `<span style="color:#f59e0b; font-weight:700;">${stage.progress}%</span>`;
      } else if (stage.progress === 0) {
        icon = '<span style="color:#94a3b8;">—</span>';
      }

      return `
        <div class="tracker-row">
          <span class="tracker-name">${stage.number}. ${stage.title}</span>
          <span class="tracker-status">${icon}</span>
        </div>
      `;
    }).join("");
  }

  // Render Software Arsenal in Sidebar
  const softwareGrid = document.getElementById("sidebar-software-arsenal");
  if (softwareGrid && data.software) {
    softwareGrid.innerHTML = data.software.map(sw => `
      <div class="software-arsenal-chip">
        <i class="fa-solid fa-cube"></i> ${sw}
      </div>
    `).join("");
  }

  // Render Sidebar Info
  const sidebar = document.querySelector(".detail-sidebar");
  if (sidebar) {
    sidebar.innerHTML = `
      <div><div class="detail-sidebar-title"><i class="fa-solid fa-tag"></i> Synonyms</div><div class="detail-sidebar-item">${data.synonyms}</div></div>
      <div><div class="detail-sidebar-title"><i class="fa-solid fa-calendar-day"></i> Aired</div><div class="detail-sidebar-item">${data.aired}</div></div>
      <div><div class="detail-sidebar-title"><i class="fa-solid fa-star"></i> Premiered</div><div class="detail-sidebar-item">${data.premiered}</div></div>
      <div><div class="detail-sidebar-title"><i class="fa-solid fa-clock"></i> Duration</div><div class="detail-sidebar-item">${data.duration}</div></div>
      <div><div class="detail-sidebar-title"><i class="fa-solid fa-building"></i> Studio</div><div class="detail-sidebar-item">${data.studio}</div></div>
    `;
  }
}

// Like Button logic
async function initLikes() {
  const likeBtn = document.getElementById("like-btn");
  const likeIcon = document.getElementById("like-icon");
  const likeCount = document.getElementById("like-count");
  if (!likeBtn || !likeIcon || !likeCount) return;

  const votedKey = `liked_anime_${animeId}`;
  let isLiked = localStorage.getItem(votedKey) === 'true';

  if (isLiked) {
    likeBtn.classList.add("liked");
    likeIcon.className = "fa-solid fa-heart";
  } else {
    likeBtn.classList.remove("liked");
    likeIcon.className = "fa-regular fa-heart";
  }

  likeBtn.addEventListener("click", () => {
    isLiked = !isLiked;
    let currentVal = parseInt(likeCount.textContent || "0");
    if (isLiked) {
      likeBtn.classList.add("liked");
      likeIcon.className = "fa-solid fa-heart";
      likeCount.textContent = (currentVal + 1).toString();
      localStorage.setItem(votedKey, 'true');
    } else {
      likeBtn.classList.remove("liked");
      likeIcon.className = "fa-regular fa-heart";
      likeCount.textContent = Math.max(0, currentVal - 1).toString();
      localStorage.removeItem(votedKey);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderPage();
  initLikes();
});
