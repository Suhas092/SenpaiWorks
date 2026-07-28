"use strict";

const PRODUCTS = [
  {
    id: "itachi-colored-tshirt",
    name: "Itachi Uchiha Duo Graphic Colored T-Shirt",
    category: "Merchandise",
    subCategory: "T-Shirts",
    price: 34.99,
    rating: 5.0,
    ratingCount: 48,
    description: "Heavyweight 100% organic cotton Itachi Uchiha duo graphic T-shirt with vibrant full-color artwork.",
    img: "assets/Store/Tshirts/Colored itachi tshirts/itachi_black_tshirt_colored.jpg",
    additionalImages: [
      "assets/Store/Tshirts/Colored itachi tshirts/itachi_black_tshirt_colored.jpg",
      "assets/Store/Tshirts/Colored itachi tshirts/itachi_white_tshirt_colored.jpg",
      "assets/Store/Tshirts/Colored itachi tshirts/itachi_purple_tshirt_colored.jpg",
      "assets/Store/Tshirts/Colored itachi tshirts/itachi_red_tshirt_colored.jpg"
    ],
    colorVariants: [
      { name: "Black", colorCode: "#111111", img: "assets/Store/Tshirts/Colored itachi tshirts/itachi_black_tshirt_colored.jpg" },
      { name: "White", colorCode: "#ffffff", img: "assets/Store/Tshirts/Colored itachi tshirts/itachi_white_tshirt_colored.jpg" },
      { name: "Purple", colorCode: "#7e22ce", img: "assets/Store/Tshirts/Colored itachi tshirts/itachi_purple_tshirt_colored.jpg" },
      { name: "Red", colorCode: "#dc2626", img: "assets/Store/Tshirts/Colored itachi tshirts/itachi_red_tshirt_colored.jpg" }
    ],
    badge: "Pre-Order",
    software: [],
    format: [],
    isNew: true,
    type: "physical",
    creator: "SenpaiWorks"
  },
  {
    id: "itachi-bw-tshirt",
    name: "Itachi Uchiha Monochrome Edition T-Shirt",
    category: "Merchandise",
    subCategory: "T-Shirts",
    price: 34.99,
    rating: 4.9,
    ratingCount: 32,
    description: "Heavyweight 100% organic cotton Itachi Uchiha graphic T-shirt in crisp monochrome black & white contrast prints.",
    img: "assets/Store/Tshirts/black and white itachi tshirts/itachi_black_tshirt_bw.jpg",
    additionalImages: [
      "assets/Store/Tshirts/black and white itachi tshirts/itachi_black_tshirt_bw.jpg",
      "assets/Store/Tshirts/black and white itachi tshirts/itachi_red_tshirt_bw.jpg",
      "assets/Store/Tshirts/black and white itachi tshirts/itachi_white_tshirt_bw.jpg"
    ],
    colorVariants: [
      { name: "Black", colorCode: "#111111", img: "assets/Store/Tshirts/black and white itachi tshirts/itachi_black_tshirt_bw.jpg" },
      { name: "Red", colorCode: "#dc2626", img: "assets/Store/Tshirts/black and white itachi tshirts/itachi_red_tshirt_bw.jpg" },
      { name: "White", colorCode: "#ffffff", img: "assets/Store/Tshirts/black and white itachi tshirts/itachi_white_tshirt_bw.jpg" }
    ],
    badge: "New Arrival",
    software: [],
    format: [],
    isNew: true,
    type: "physical",
    creator: "SenpaiWorks"
  },
  {
    id: "zoro-colored-tshirt",
    name: "Roronoa Zoro Three-Sword Colored T-Shirt",
    category: "Merchandise",
    subCategory: "T-Shirts",
    price: 34.99,
    rating: 4.9,
    ratingCount: 42,
    description: "Ultra-soft organic cotton graphic tee featuring high-fidelity colored artwork of Roronoa Zoro.",
    img: "assets/Store/Tshirts/colored Zoro tshirts/zoro_colored_black_tshirt.jpg",
    additionalImages: [
      "assets/Store/Tshirts/colored Zoro tshirts/zoro_colored_black_tshirt.jpg",
      "assets/Store/Tshirts/colored Zoro tshirts/zoro_colored_green_tshirt.jpg",
      "assets/Store/Tshirts/colored Zoro tshirts/zoro_colored_white_tshirt.jpg"
    ],
    colorVariants: [
      { name: "Black", colorCode: "#111111", img: "assets/Store/Tshirts/colored Zoro tshirts/zoro_colored_black_tshirt.jpg" },
      { name: "Green", colorCode: "#15803d", img: "assets/Store/Tshirts/colored Zoro tshirts/zoro_colored_green_tshirt.jpg" },
      { name: "White", colorCode: "#ffffff", img: "assets/Store/Tshirts/colored Zoro tshirts/zoro_colored_white_tshirt.jpg" }
    ],
    badge: "Best Seller",
    software: [],
    format: [],
    isNew: true,
    type: "physical",
    creator: "SenpaiWorks"
  },
  {
    id: "zoro-bw-tshirt",
    name: "Roronoa Zoro Monochrome Edition T-Shirt",
    category: "Merchandise",
    subCategory: "T-Shirts",
    price: 34.99,
    rating: 4.8,
    ratingCount: 27,
    description: "High-contrast black & white graphic print featuring Roronoa Zoro on heavyweight organic cotton.",
    img: "assets/Store/Tshirts/Black and White Zoro tshirts/zoro_bw_black_tshirt.jpg",
    additionalImages: [
      "assets/Store/Tshirts/Black and White Zoro tshirts/zoro_bw_black_tshirt.jpg",
      "assets/Store/Tshirts/Black and White Zoro tshirts/zoro_bw_green_tshirt.jpg",
      "assets/Store/Tshirts/Black and White Zoro tshirts/zoro_bw_white_tshirt.jpg"
    ],
    colorVariants: [
      { name: "Black", colorCode: "#111111", img: "assets/Store/Tshirts/Black and White Zoro tshirts/zoro_bw_black_tshirt.jpg" },
      { name: "Green", colorCode: "#15803d", img: "assets/Store/Tshirts/Black and White Zoro tshirts/zoro_bw_green_tshirt.jpg" },
      { name: "White", colorCode: "#ffffff", img: "assets/Store/Tshirts/Black and White Zoro tshirts/zoro_bw_white_tshirt.jpg" }
    ],
    badge: "Limited Edition",
    software: [],
    format: [],
    isNew: false,
    type: "physical",
    creator: "SenpaiWorks"
  },
  {
    id: "kaneki-bw-tshirt",
    name: "Ken Kaneki Tokyo Ghoul B&W Edition T-Shirt",
    category: "Merchandise",
    subCategory: "T-Shirts",
    price: 34.99,
    rating: 4.9,
    ratingCount: 38,
    description: "Embrace the dark aesthetic with our high-fidelity Kaneki awakened state streetwear graphic T-shirt.",
    img: "assets/Store/Tshirts/Black and whirte kaneki tshirts/kaneki_black_tshirt_bw.jpg",
    additionalImages: [
      "assets/Store/Tshirts/Black and whirte kaneki tshirts/kaneki_black_tshirt_bw.jpg",
      "assets/Store/Tshirts/Black and whirte kaneki tshirts/kaneki_maroon_tshirt_bw.jpg",
      "assets/Store/Tshirts/Black and whirte kaneki tshirts/kaneki_white_tshirt_bw.jpg"
    ],
    colorVariants: [
      { name: "Black", colorCode: "#111111", img: "assets/Store/Tshirts/Black and whirte kaneki tshirts/kaneki_black_tshirt_bw.jpg" },
      { name: "Maroon", colorCode: "#881337", img: "assets/Store/Tshirts/Black and whirte kaneki tshirts/kaneki_maroon_tshirt_bw.jpg" },
      { name: "White", colorCode: "#ffffff", img: "assets/Store/Tshirts/Black and whirte kaneki tshirts/kaneki_white_tshirt_bw.jpg" }
    ],
    badge: "New Arrival",
    software: [],
    format: [],
    isNew: true,
    type: "physical",
    creator: "SenpaiWorks"
  },
  {
    id: "kaneki-colored-tshirt",
    name: "Ken Kaneki Tokyo Ghoul Full Color T-Shirt",
    category: "Merchandise",
    subCategory: "T-Shirts",
    price: 34.99,
    rating: 5.0,
    ratingCount: 45,
    description: "Vibrant full-color illustration of Kaneki Ken on heavyweight 240gsm combed organic cotton.",
    img: "assets/Store/Tshirts/Colored kaneki tshirts/kaneki_black_tshirt_colored.jpg",
    additionalImages: [
      "assets/Store/Tshirts/Colored kaneki tshirts/kaneki_black_tshirt_colored.jpg",
      "assets/Store/Tshirts/Colored kaneki tshirts/kaneki_white_tshirt_colored.jpg",
      "assets/Store/Tshirts/Colored kaneki tshirts/kaneki_darkgrey_tshirt_colored.jpg"
    ],
    colorVariants: [
      { name: "Black", colorCode: "#111111", img: "assets/Store/Tshirts/Colored kaneki tshirts/kaneki_black_tshirt_colored.jpg" },
      { name: "White", colorCode: "#ffffff", img: "assets/Store/Tshirts/Colored kaneki tshirts/kaneki_white_tshirt_colored.jpg" },
      { name: "Dark Grey", colorCode: "#334155", img: "assets/Store/Tshirts/Colored kaneki tshirts/kaneki_darkgrey_tshirt_colored.jpg" }
    ],
    badge: "Best Seller",
    software: [],
    format: [],
    isNew: true,
    type: "physical",
    creator: "SenpaiWorks"
  },
  {
    id: "deadpool-rig",
    name: "Deadpool 3D Stylized Animation Model Rig",
    category: "3D Assets",
    subCategory: "Characters",
    price: 45.00,
    rating: 5.0,
    ratingCount: 18,
    description: "Production-ready, highly stylized 3D model. Fully rigged with IK/FK controls, custom expression shape keys, and high-res textures. Ready for action and high-quality game/cinematic animations.",
    img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630827/deadpool_poster_krntp0.webp",
    additionalImages: [
      "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630827/deadpool_poster_krntp0.webp",
      "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_auto/v1757630827/all_characters_yvk9ik.webp",
      "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/chronos_plays_fl47xm.webp"
    ],
    badge: "Best Seller",
    software: ["Blender", "Maya"],
    format: [".blend", ".fbx"],
    isNew: false,
    type: "digital",
    creator: "SenpaiWorks",
    whatsIncluded: [
      "1x Master Blender Scene (.blend file) with rigged model",
      "1x FBX exported rigged model (Game engine compatible)",
      "4x 4K PBR Texture Maps (BaseColor, Roughness, Normal, Metallic)",
      "1x Animation Pose Library presets (.json/Blender asset library)"
    ],
    aboutItem: [
      "Rigged for Animators: Features an advanced IK/FK body rig with custom switches, foot-roll, and auto-clamping knees.",
      "Expressive Face Rig: Features over 50 custom shape keys for hilarious facial expressions, winking, and lip sync.",
      "Optimized Topology: Clean quad-dominant layout designed for smooth deformation during extreme animation movements."
    ],
    specs: {
      compatibility: "Blender 3.0+, Maya 2022+",
      blenderVersion: "3.0, 3.6, 4.0+",
      mayaCompatibility: "2022, 2023, 2024+",
      zbrushCompatibility: "N/A",
      unrealCompatibility: "4.27, 5.0, 5.3+",
      unityCompatibility: "2021.3, 2022.3+",
      formats: ".blend, .fbx, .obj",
      polyCount: "45,210 Quads",
      vertexCount: "46,800 Vertices",
      texResolution: "4K (4096 x 4096)",
      pbr: "Yes (Metallic/Roughness)",
      rigged: "Yes (Body & Face)",
      animated: "No (T-Pose included)",
      shapeKeys: "Yes (50+ Expressions)",
      uvMapped: "Yes (Non-overlapping)",
      fileSize: "124 MB",
      version: "1.2",
      lastUpdated: "2026-05-15"
    },
    reviews: [
      { id: "r5", author: "AnimDude", rating: 5, date: "May 2, 2026", title: "Best Deadpool rig available!", text: "The IK/FK controls are super smooth and intuitive. The face shape keys are absolutely perfect for Deadpool's expressions.", helpfulCount: 15 },
      { id: "r6", author: "UnityDev", rating: 5, date: "June 11, 2026", title: "Flawless game engine import", text: "Imported the FBX into Unity without issues. Skeletons and bone mappings align perfectly with Mecanim avatar.", helpfulCount: 8 }
    ],
    freqBoughtWith: ["anime-hair-pack", "environment-hdr-pack"],
    faqs: [
      { q: "Is this rig compatible with Unreal Engine 5?", a: "Yes, the included FBX file uses the standard Epic skeleton naming conventions, making it easy to retarget to standard mannequin animations." },
      { q: "Can I use this model in commercial animations?", a: "You can use this model in animations, educational projects, or portfolio renders. However, because Deadpool is a copyrighted Marvel character, you cannot use him in commercial products, games, or monetized releases." }
    ]
  },
  {
    id: "anime-hair-pack",
    name: "3D Anime Hair Cards Mega Pack",
    category: "Hair Assets",
    subCategory: "Anime Hair",
    price: 12.00,
    rating: 4.7,
    ratingCount: 8,
    description: "Collection of 12 distinct game-ready anime hairstyles optimized with low-poly hair cards. Ready for integration into Unity, Unreal Engine, and custom shaders.",
    img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp",
    additionalImages: [
      "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp",
      "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_auto/v1757630820/to_love_ru_copy_sthzsw.webp",
      "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/know_why_fp0q72.webp"
    ],
    badge: "",
    software: ["Blender", "Unreal Engine", "Unity"],
    format: [".blend", ".fbx", ".obj"],
    isNew: false,
    type: "digital",
    creator: "SenpaiWorks",
    whatsIncluded: [
      "12x Unique 3D Anime Hairstyles (FBX & OBJ formats)",
      "1x Blender Scene (.blend file) containing all styles organized as assets",
      "3x Hair Texture Maps (Diffuse, Normal, Alpha/Opacity)",
      "1x Custom Anime Hair Shader node setup for Blender EEVEE/Cycles"
    ],
    aboutItem: [
      "Game Optimized: Low-poly counts (ranging from 3k to 8k polys per style) optimized for real-time mobile and console game performance.",
      "Customizable Color: Diffuse textures include grayscale variations to allow easy color tints and gradients in engine shaders.",
      "Modular Fit: Designed on a standard head volume so you can easily scale and snap them onto your character models."
    ],
    specs: {
      compatibility: "Blender, Unity, Unreal Engine, Maya",
      blenderVersion: "2.93, 3.0+",
      mayaCompatibility: "2020+",
      zbrushCompatibility: "N/A",
      unrealCompatibility: "4.26, 5.0+",
      unityCompatibility: "2020.3, 2021.3+",
      formats: ".blend, .fbx, .obj",
      polyCount: "4,500 - 8,200 Triangles per style",
      vertexCount: "5,000 - 9,000 per style",
      texResolution: "2K (2048 x 2048)",
      pbr: "Yes (Spec/Gloss & PBR Setup)",
      rigged: "No (Static Hair Meshes)",
      animated: "No",
      shapeKeys: "No",
      uvMapped: "Yes (Unwrapped & Clean)",
      fileSize: "68 MB",
      version: "1.0",
      lastUpdated: "2026-03-20"
    },
    reviews: [
      { id: "r7", author: "Gamer3D", rating: 5, date: "May 15, 2026", title: "Looks amazing in game!", text: "Textures are super clean and the alpha opacity map works flawlessly in Unreal Engine's hair shader.", helpfulCount: 6 },
      { id: "r8", author: "IndieGamer", rating: 4.4, date: "June 25, 2026", title: "Very modular and clean", text: "Saved me so much time modeling hair. Fits standard anime head assets easily. Highly recommend.", helpfulCount: 2 }
    ],
    freqBoughtWith: ["deadpool-rig", "skin-pbr-material"],
    faqs: [
      { q: "Can I customize the hair colors?", a: "Yes! The diffuse map is provided in both pre-colored versions and a grayscale template, allowing you to multiply it with any color gradient or tint in your shader." },
      { q: "Are the models rigged for physics?", a: "No, they are static meshes. However, the polygon topology is aligned in neat strips, making it easy to add custom bones or joint chains for wind/movement physics." }
    ]
  },
  {
    id: "blender-sculpt-course",
    name: "Blender 3D Character Sculpting & Modeling Masterclass",
    category: "Digital Courses",
    subCategory: "Blender Courses",
    price: 89.99,
    rating: 4.9,
    ratingCount: 64,
    description: "Go from beginner to pro in Blender sculpting. Learn blocking out, anatomy sculpting, retopology, UV mapping, detail texturing, and high-quality character rendering pipelines.",
    img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_auto/v1757630827/all_characters_yvk9ik.webp",
    additionalImages: [
      "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_auto/v1757630827/all_characters_yvk9ik.webp",
      "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/know_why_fp0q72.webp",
      "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp"
    ],
    badge: "New",
    software: ["Blender"],
    format: [".blend"],
    isNew: true,
    type: "digital",
    creator: "SenpaiWorks",
    whatsIncluded: [
      "42x Video Lectures in 1080p (Total 18.5 hours)",
      "12x Blender Project Startup/Finish Scenes (.blend format)",
      "5x Anatomy Reference Sheets (PDF Format)",
      "Access to Private Discord Community channel for reviews",
      "Verifiable Course Completion Certificate"
    ],
    aboutItem: [
      "Comprehensive Guide: Covering dynotopo blocking, voxel remeshing, multires detailing, retopology, and texture painting.",
      "Anatomy Explanations: Focuses heavily on understanding skeletal shapes, muscle insertions, and facial proportions.",
      "Lifetime Access: Stream video files online or download lessons for offline reading anytime."
    ],
    specs: {
      instructor: "Suhas H (SenpaiWorks)",
      courseLevel: "Beginner to Intermediate",
      duration: "18.5 Hours",
      lessons: "42 Lectures",
      language: "English",
      subtitleAvailability: "English (Auto-generated CC)",
      softwareRequired: "Blender 3.6 or 4.0+",
      downloadableFiles: "Yes (Blender Scenes, PDFs)",
      certificateIncluded: "Yes (Digital Certificate)"
    },
    reviews: [
      { id: "r9", author: "ArtStudent9", rating: 5, date: "May 20, 2026", title: "A masterclass indeed!", text: "The anatomy chapters are worth the price alone. Explanations are crystal clear. My sculpting has improved tenfold.", helpfulCount: 45 },
      { id: "r10", author: "SculpterJoe", rating: 4.8, date: "June 14, 2026", title: "Fantastic retopology breakdown", text: "Learned how to make clean quad topology for animation. Blender file exercises are well structured.", helpfulCount: 12 }
    ],
    freqBoughtWith: ["zbrush-sculpt-course", "custom-pencil-brushes"],
    faqs: [
      { q: "Do I need a drawing tablet for this course?", a: "While you can sculpt with a mouse, we highly recommend using a drawing tablet (wacom, huion, etc.) as pressure sensitivity is vital for organic sculpting." },
      { q: "Is the software required free?", a: "Yes, Blender is completely free and open-source. You can download it directly from blender.org." }
    ]
  },
  {
    id: "zbrush-sculpt-course",
    name: "ZBrush Anatomy & Character Sculpting Masterclass",
    category: "Digital Courses",
    subCategory: "ZBrush Courses",
    price: 120.00,
    rating: 4.8,
    ratingCount: 38,
    description: "Learn advanced digital sculpting techniques in ZBrush. Covers facial features, anatomy landmarks, muscle flow, dynamics, details, and rendering in Keyshot.",
    img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/know_why_fp0q72.webp",
    additionalImages: [
      "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/know_why_fp0q72.webp",
      "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_auto/v1757630827/all_characters_yvk9ik.webp",
      "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/chronos_plays_fl47xm.webp"
    ],
    badge: "",
    software: ["ZBrush"],
    format: [".ztl"],
    isNew: false,
    type: "digital",
    creator: "SenpaiWorks",
    whatsIncluded: [
      "35x Video Lectures in 1080p (Total 15 Hours)",
      "4x ZBrush Tool Files (.ztl character meshes)",
      "30x Custom Sculpting Alpha Brushes",
      "Verifiable Course Completion Certificate",
      "Access to Private Discord review channels"
    ],
    aboutItem: [
      "Professional Pipeline: Covers Dynamesh, ZRemesher, Subtool management, and HD Geometry sculpting.",
      "Anatomy Precision: Deep dive into facial structures, skull proportions, torso, arms, and legs.",
      "High Frequency Detail: Sculpting skin pores, scars, wrinkles, and folds using custom alpha maps."
    ],
    specs: {
      instructor: "Suhas H (SenpaiWorks)",
      courseLevel: "Intermediate to Advanced",
      duration: "15 Hours",
      lessons: "35 Lectures",
      language: "English",
      subtitleAvailability: "English CC",
      softwareRequired: "ZBrush 2022 or higher",
      downloadableFiles: "Yes (.ztl models, Alphas)",
      certificateIncluded: "Yes"
    },
    reviews: [
      { id: "r11", author: "ZBrushArtist", rating: 5, date: "April 10, 2026", title: "Exactly what I needed!", text: "Amazing explanation of muscular forms. The ZTool files are super helpful for reference checks.", helpfulCount: 19 },
      { id: "r12", author: "GameArtPro", rating: 4.6, date: "May 25, 2026", title: "Excellent advanced tips", text: "Great lessons on skin pore texturing and micro-detailing. Very high production value.", helpfulCount: 7 }
    ],
    freqBoughtWith: ["blender-sculpt-course", "imm-mech-brushes"],
    faqs: [
      { q: "Is this course suitable for beginners?", a: "This course assumes a basic familiarity with ZBrush's interface. If you are a complete beginner, we suggest taking an intro course first." },
      { q: "Are custom brushes and alphas free to use?", a: "Yes, the 30 sculpting alphas included in the course are yours to use in both personal and commercial projects without royalty." }
    ]
  },
  {
    id: "skin-pbr-material",
    name: "Ultimate Realistic Skin Material & PBR Textures",
    category: "Materials & Textures",
    subCategory: "Skin Materials",
    price: 15.00,
    rating: 4.6,
    ratingCount: 11,
    description: "Procedural smart material and 4K PBR texture maps for highly realistic human skin. Includes micro-pores, veins, blemishes, and subsurface scattering setup.",
    img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630820/jungkook_copy_ntfb24.webp",
    additionalImages: [
      "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630820/jungkook_copy_ntfb24.webp",
      "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_auto/v1757630820/to_love_ru_copy_sthzsw.webp",
      "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp"
    ],
    badge: "",
    software: ["Substance Painter", "Blender", "Unreal Engine"],
    format: [".spp", ".png"],
    isNew: false,
    type: "digital",
    creator: "SenpaiWorks",
    whatsIncluded: [
      "1x Substance Painter Smart Material (.spsm file)",
      "1x Set of 4K PBR Textures (BaseColor, Roughness, Normal, Height, Cavity)",
      "1x Blender shader nodes setup configuration guide (PDF)",
      "1x Demo head mesh model (.obj format)"
    ],
    aboutItem: [
      "Micro-Detail Control: Multi-level skin pore detailing with adjustable scales and roughness modifiers.",
      "Blemish & Skin Tone: Dial in pigment variations, redness, age spots, freckles, and micro-vein density.",
      "SSS Integration: Pre-calibrated scattering profiles optimized for Blender Cycles, Cycles-X, and Unreal Engine 5."
    ],
    specs: {
      compatibility: "Substance Painter 7.4+, Blender, UE5, Unity",
      blenderVersion: "N/A",
      mayaCompatibility: "N/A",
      zbrushCompatibility: "N/A",
      unrealCompatibility: "5.0+",
      unityCompatibility: "2021.3+",
      formats: ".spp, .spsm, .png",
      polyCount: "N/A",
      vertexCount: "N/A",
      texResolution: "4K (4096 x 4096)",
      pbr: "Yes (Metallic/Roughness PBR)",
      rigged: "No",
      animated: "No",
      shapeKeys: "No",
      uvMapped: "No (Requires UV mapped meshes)",
      fileSize: "85 MB",
      version: "1.1",
      lastUpdated: "2026-02-10"
    },
    reviews: [
      { id: "r13", author: "CGI_Gamer", rating: 5, date: "May 1, 2026", title: "Unbelievable pore detail", text: "Saves hours of texture painting. The skin pores deformation and SSS maps render beautifully under directional lights.", helpfulCount: 7 },
      { id: "r14", author: "MaterialArtist", rating: 4.2, date: "May 19, 2026", title: "Very good smart material", text: "Works great in Substance Painter. Easy to customize pigment and redness layers. Highly recommended.", helpfulCount: 2 }
    ],
    freqBoughtWith: ["anime-hair-pack", "custom-pencil-brushes"],
    faqs: [
      { q: "Does this require Substance Painter?", a: "The smart material (.spsm) requires Substance Painter. However, the pre-exported 4K PBR texture maps (.png format) can be loaded into any 3D software (Maya, Blender, Max) to create a shader." },
      { q: "Is SSS map included?", a: "Yes, we include ambient occlusion and curvature mask textures which are ideal for building realistic Subsurface Scattering textures." }
    ]
  },
  {
    id: "custom-pencil-brushes",
    name: "Premium Charcoal & Pencil Digital Brush Pack",
    category: "Brushes & Resources",
    subCategory: "Blender Brushes",
    price: 0.00,
    rating: 4.9,
    ratingCount: 42,
    description: "Achieve authentic paper texture and hand-drawn shading styles digitally in Clip Studio Paint and Photoshop. Contains 12 custom textured brushes. Ideal for sketching, linework, and charcoal rendering.",
    img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630820/jungkook_copy_ntfb24.webp",
    additionalImages: [
      "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630820/jungkook_copy_ntfb24.webp",
      "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_auto/v1757630820/to_love_ru_copy_sthzsw.webp",
      "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp"
    ],
    badge: "Free",
    software: ["Photoshop"],
    format: [".psd"],
    isNew: false,
    type: "digital",
    creator: "SenpaiWorks",
    whatsIncluded: [
      "12x Custom Digital Brushes (.abr format)",
      "2x Seamless Paper Texture Templates (4K resolution)",
      "1x Brush Installation Guide (PDF)"
    ],
    aboutItem: [
      "Organic Feeling: Custom pressure curves mapping tilt and flow settings to replicate graphite pencils and natural charcoal.",
      "High Resolution: Texture tip dynamics scanned from actual high-grain artist paper sketchbooks.",
      "Versatile Use: Includes HB pencil, 4B charcoal, blending stumps, and messy chalk brushes."
    ],
    specs: {
      compatibility: "Photoshop CC, Clip Studio Paint, Procreate",
      blenderVersion: "N/A",
      mayaCompatibility: "N/A",
      zbrushCompatibility: "N/A",
      unrealCompatibility: "N/A",
      unityCompatibility: "N/A",
      formats: ".abr, .psd, .png",
      polyCount: "N/A",
      vertexCount: "N/A",
      texResolution: "4K textures",
      pbr: "No",
      rigged: "No",
      animated: "No",
      shapeKeys: "No",
      uvMapped: "No",
      fileSize: "14 MB",
      version: "1.0",
      lastUpdated: "2026-01-15"
    },
    reviews: [
      { id: "r15", author: "SketchQueen", rating: 5, date: "February 22, 2026", title: "Feels like real paper!", text: "Amazing brushes, especially for free. The blending brush replicates actual fingers blending charcoal beautifully.", helpfulCount: 31 },
      { id: "r16", author: "ProcreatePanda", rating: 4.8, date: "March 10, 2026", title: "Imported perfectly into Procreate", text: "Works great. Pencils have excellent grain flow on drawing lines. Thank you so much!", helpfulCount: 11 }
    ],
    freqBoughtWith: ["zoro-print", "skin-pbr-material"],
    faqs: [
      { q: "Can I use these brushes in Procreate?", a: "Yes! Procreate supports the industry-standard .abr format, so you can import the brush library directly." },
      { q: "Is this free for commercial work?", a: "Yes, this free brush pack is released under a CC0 / commercial license. Feel free to use them in your paid projects." }
    ]
  },
  {
    id: "imm-mech-brushes",
    name: "Sci-Fi Hard Surface IMM Brushes Pack",
    category: "Brushes & Resources",
    subCategory: "IMM Brushes",
    price: 18.00,
    rating: 4.7,
    ratingCount: 15,
    description: "ZBrush Insert Multi Mesh brushes collection for detailing robots, cybernetics, weapons, and mechanical environments. Over 50 modular components included. Speed up your workflow today.",
    img: "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/chronos_plays_fl47xm.webp",
    additionalImages: [
      "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/chronos_plays_fl47xm.webp",
      "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_600/v1757630848/rem_happy_evhesz.webp",
      "https://res.cloudinary.com/dmzchsqms/image/upload/f_auto,q_auto/w_auto/v1757630847/zoro_green_poster_unzusa.webp"
    ],
    badge: "",
    software: ["ZBrush"],
    format: [".ztl", ".fbx"],
    isNew: false,
    type: "digital",
    creator: "SenpaiWorks",
    whatsIncluded: [
      "1x ZBrush Insert Multi Mesh Brush (.zbp file)",
      "54x High poly mesh components (FBX format for kitbashing)",
      "1x Blender Scene file containing all modules grouped as assets",
      "1x Detail Placement Reference guide (PDF)"
    ],
    aboutItem: [
      "Detailing Speed: Insert rivets, bolts, pistons, exhaust vents, hinges, and custom mechanical panels with one click.",
      "Perfect Welds: Brush shapes feature optimized flat base projections to blend seamlessly into organic sculpt surfaces.",
      "Clean Geometry: Sub-D friendly topology allows easy subdivision levels without polygon pinching."
    ],
    specs: {
      compatibility: "ZBrush 2021.5+, Blender, Maya",
      blenderVersion: "N/A",
      mayaCompatibility: "N/A",
      zbrushCompatibility: "2021.5, 2022, 2023+",
      unrealCompatibility: "N/A",
      unityCompatibility: "N/A",
      formats: ".zbp, .ztl, .fbx",
      polyCount: "500 - 15,000 per component",
      vertexCount: "600 - 16,000 per component",
      texResolution: "N/A (Geometric Detail)",
      pbr: "No",
      rigged: "No",
      animated: "No",
      shapeKeys: "No",
      uvMapped: "Yes (Unwrapped)",
      fileSize: "92 MB",
      version: "1.0",
      lastUpdated: "2026-04-05"
    },
    reviews: [
      { id: "r17", author: "MechBuilder", rating: 5, date: "May 8, 2026", title: "Essential for hard surface", text: "Fabulous set of mechanical bolts and vents. Saves an immense amount of time when detailing robot plating.", helpfulCount: 9 },
      { id: "r18", author: "ConceptGuy", rating: 4.4, date: "June 1, 2026", title: "Great shapes, clean mesh", text: "Topology is great, imports into Blender perfectly. Ideal for kitbashing space models.", helpfulCount: 4 }
    ],
    freqBoughtWith: ["zbrush-sculpt-course", "deadpool-rig"],
    faqs: [
      { q: "Can I use these inside Blender?", a: "Yes! While the primary brush file is for ZBrush (.zbp), we also include a folder with all 54 components in FBX format, which can be easily kitbashed inside Blender, Maya, or Max." },
      { q: "Are they UV mapped?", a: "Yes, all 54 components are completely unwrapped, so they are ready for texturing in Substance Painter or other PBR texturing packages." }
    ]
  }
];

// Fetch database products and prepend them to PRODUCTS array
(function() {
  const API_URL = "http://localhost:5000/api/products";
  
  window.dbProductsPromise = fetch(API_URL)
    .then(res => {
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    })
    .then(dbProducts => {
      const formatted = dbProducts.map(p => {
        return {
          id: p.id,
          name: p.name,
          category: p.category,
          subCategory: p.subCategory,
          price: p.price,
          rating: p.rating,
          ratingCount: p.ratingCount,
          description: p.description,
          img: p.img,
          additionalImages: p.additionalImages ? p.additionalImages.split("\n").map(s => s.trim()).filter(Boolean) : [p.img],
          badge: p.badge,
          software: p.software ? p.software.split(",").map(s => s.trim()).filter(Boolean) : [],
          format: p.format ? p.format.split(",").map(s => s.trim()).filter(Boolean) : [],
          isNew: p.isNew,
          type: p.type,
          creator: p.creator,
          whatsIncluded: p.whatsIncluded ? p.whatsIncluded.split("\n").map(s => s.trim()).filter(Boolean) : [],
          aboutItem: p.aboutItem ? p.aboutItem.split("\n").map(s => s.trim()).filter(Boolean) : [],
          specs: {
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
      
      // Safely append non-duplicate database products to PRODUCTS
      const newItems = formatted.filter(dbP => !PRODUCTS.some(staticP => staticP.id === dbP.id));
      PRODUCTS.push(...newItems);
      return PRODUCTS;
    })
    .catch(err => {
      console.warn("Could not fetch database products:", err);
      return PRODUCTS; // fallback to static only
    });
})();
