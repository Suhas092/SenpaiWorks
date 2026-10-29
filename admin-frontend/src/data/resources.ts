import { post, put, patch, del } from "@/api";
import type { AdminRecord, Field, FormValues, ResourceConfig } from "@/types";

type Raw = Record<string, unknown>;

const enc = encodeURIComponent;
const list = (v: unknown): Raw[] => (Array.isArray(v) ? (v as Raw[]) : []);
const obj = (v: unknown): Raw => (v && typeof v === "object" ? (v as Raw) : {});
const str = (v: unknown, fallback = ""): string => (v === null || v === undefined ? fallback : String(v));
const num = (v: unknown): number => Number(v) || 0;
const day = (v: unknown): string => str(v).slice(0, 10);

const text = (key: string, label: string, required = true): Field => ({
  key,
  label,
  type: "text",
  required,
});
const area = (key: string, label: string, required = false): Field => ({
  key,
  label,
  type: "textarea",
  required,
});
const numberField = (key: string, label: string): Field => ({
  key,
  label,
  type: "number",
  required: true,
});
const optionalNumber = (key: string, label: string): Field => ({
  key,
  label,
  type: "number",
  required: false,
});
const select = (key: string, label: string, options: string[]): Field => ({
  key,
  label,
  type: "select",
  options,
  required: true,
});

const checkbox = (key: string, label: string): Field => ({
  key,
  label,
  type: "checkbox",
  required: false,
});
const image = (key: string, label: string): Field => ({
  key,
  label,
  type: "image",
  required: true,
});

export const ORDER_STATUSES = ["Processing", "Shipped", "Delivered", "Cancelled"];
const REPLACEMENT_STATUSES = ["Requested", "Approved", "Rejected"];

/* ---------- Products ---------- */

const productBody = (v: FormValues) => ({
  name: String(v["name"]),
  category: String(v["category"]),
  subCategory: String(v["subCategory"] ?? ""),
  price: Number(v["price"]),
  originalPrice: Number(v["originalPrice"]) || null,
  stockQuantity: Number(v["stockQuantity"]),
  description: String(v["description"]),
  img: String(v["img"]),
  additionalImages: String(v["additionalImages"] ?? ""),
  badge: String(v["badge"] ?? ""),
  isNew: v["isNew"] !== "No",
  type: String(v["type"] ?? ""),
  creator: String(v["creator"] ?? ""),
  sizes: String(v["sizes"] ?? ""),
  colors: String(v["colors"] ?? ""),
  material: String(v["material"] ?? ""),
  fabricType: String(v["fabricType"] ?? ""),
  printingMethod: String(v["printingMethod"] ?? ""),
  washingInstructions: String(v["washingInstructions"] ?? ""),
  shippingWeight: String(v["shippingWeight"] ?? ""),
  software: String(v["software"] ?? ""),
  format: String(v["format"] ?? ""),
  downloadUrl: String(v["downloadUrl"] ?? "") || null,
  whatsIncluded: String(v["whatsIncluded"] ?? ""),
  aboutItem: String(v["aboutItem"] ?? ""),
  featureHighlights: String(v["featureHighlights"] ?? ""),
  variantsData: String(v["variantsData"] ?? ""),
  sku: String(v["sku"] ?? "").trim() || null,
  costPrice: String(v["costPrice"] ?? "").trim() === "" ? null : Number(v["costPrice"]),
  rating: Number(v["rating"]) || 5,
  ratingCount: Number(v["ratingCount"]) || 0,
  productStatus: String(v["productStatus"] ?? "Active"),
  available: v["availability"] !== "Unavailable",
});

const products: ResourceConfig = {
  title: "Products",
  description: "Catalogue, pricing and stock for the store.",
  singular: "product",
  listPath: "/products",
  visual: false,
  columns: [
    { key: "name", label: "Product" },
    { key: "category", label: "Category" },
    { key: "price", label: "Price" },
    { key: "stockQuantity", label: "Availability" },
    { key: "status", label: "Status" },
  ],
  fieldsFor: (row) => products.fields.filter((f) => f.key !== "id" || !row.id),
  fields: [
    text("id", "Product ID (unique slug)"),
    text("name", "Name"),
    text("category", "Category"),
    text("subCategory", "Sub-category", false),
    numberField("price", "Sale price"),
    numberField("originalPrice", "MRP"),
    numberField("stockQuantity", "Stock quantity"),
    text("sku", "SKU", false),
    optionalNumber("costPrice", "Cost price"),
    optionalNumber("rating", "Manual rating"),
    optionalNumber("ratingCount", "Rating count"),
    select("availability", "Availability", ["Available", "Unavailable"]),
    select("productStatus", "Product status", ["Active", "Draft"]),
    select("isNew", "New arrival", ["Yes", "No"]),
    text("badge", "Badge", false),
    image("img", "Primary image"),
    area("additionalImages", "Additional image URLs (one per line)"),
    area("description", "Description", true),
    text("sizes", "Sizes (comma separated)", false),
    text("colors", "Colors (comma separated)", false),
    text("material", "Material", false),
    text("fabricType", "Fabric type", false),
    text("printingMethod", "Printing method", false),
    text("washingInstructions", "Washing instructions", false),
    text("shippingWeight", "Shipping weight", false),
    select("type", "Product type", ["physical", "digital"]),
    text("creator", "Creator", false),
    area("software", "Software (digital products)", false),
    area("format", "File format (digital products)", false),
    text("downloadUrl", "Download URL (digital products)", false),
    area("aboutItem", "About this item", false),
    area("whatsIncluded", "What's included", false),
    area("featureHighlights", "Feature highlights (JSON)", false),
    area("variantsData", "Variants data (JSON)", false),
  ],
  toRows: (raw) =>
    list(raw).map((p) => {
      const stock = num(p["stockQuantity"]);
      const available = p["available"] !== false;
      return {
        id: str(p["id"]),
        name: str(p["name"]),
        sub: str(p["id"]),
        category: str(p["category"]),
        price: num(p["price"]),
        originalPrice: num(p["originalPrice"]),
        stockQuantity: stock,
        description: str(p["description"]),
        img: str(p["img"]),
        subCategory: str(p["subCategory"]),
        additionalImages: str(p["additionalImages"]),
        badge: str(p["badge"]),
        isNew: p["isNew"] === false ? "No" : "Yes",
        type: str(p["type"]),
        creator: str(p["creator"]),
        sizes: str(p["sizes"]),
        colors: str(p["colors"]),
        material: str(p["material"]),
        fabricType: str(p["fabricType"]),
        printingMethod: str(p["printingMethod"]),
        washingInstructions: str(p["washingInstructions"]),
        shippingWeight: str(p["shippingWeight"]),
        software: str(p["software"]),
        format: str(p["format"]),
        downloadUrl: str(p["downloadUrl"]),
        whatsIncluded: str(p["whatsIncluded"]),
        aboutItem: str(p["aboutItem"]),
        featureHighlights: str(p["featureHighlights"]),
        variantsData: str(p["variantsData"]),
        sku: str(p["sku"]),
        costPrice: str(p["costPrice"]),
        rating: num(p["rating"]),
        ratingCount: num(p["ratingCount"]),
        productStatus: str(p["productStatus"], "Active"),
        availability: available ? "Available" : "Unavailable",
        status: !available ? "Unavailable" : stock === 0 ? "Out of stock" : "Available",
      };
    }),
  create: (v) => {
    const slug = String(v["id"] ?? "").trim().toLowerCase().replace(/\s+/g, "-");
    return post("/products", { id: slug || `SW-${Date.now()}`, ...productBody(v) });
  },
  update: (row, v) => put(`/products/${enc(row.id)}`, productBody(v)),
  remove: (row) => del(`/products/${enc(row.id)}`),
  archive: (row) => put(`/products/${enc(row.id)}`, { available: false }),
};

/* ---------- Orders (no create or delete; status changes via detail panel) ---------- */

const isDonationOrder = (o: Raw): boolean =>
  str(o["orderNumber"]).startsWith("TXN-") ||
  list(o["items"]).some((i) => i["productId"] === "DONATION");

const shipTo = (v: unknown): string => {
  let a: Raw = {};
  try {
    a = obj(typeof v === "string" ? JSON.parse(v) : v);
  } catch {
    return str(v);
  }
  return [a["name"], a["address"] || a["line1"], a["apartment"], a["city"], a["state"], a["pincode"] || a["zip"]]
    .map((p) => str(p).trim())
    .filter(Boolean)
    .join(", ");
};

const orderLines = (o: Raw): string =>
  JSON.stringify(
    list(o["items"]).map((i) => ({
      name: str(i["productName"] || obj(i["product"])["name"], "Item"),
      variant: str(i["variant"]),
      quantity: num(i["quantity"]) || 1,
      price: num(i["price"]),
    })),
  );

const orders: ResourceConfig = {
  title: "Orders",
  description: "Track fulfilment and payment for customer orders.",
  singular: "order",
  listPath: "/admin/orders",
  refetchInterval: 15_000,
  columns: [
    { key: "name", label: "Order" },
    { key: "customer", label: "Customer" },
    { key: "items", label: "Items" },
    { key: "total", label: "Total" },
    { key: "paymentStatus", label: "Payment" },
    { key: "status", label: "Status" },
    { key: "date", label: "Date" },
  ],
  fields: [],
  toRows: (raw) =>
    list(raw).map((o) => {
      const c = obj(o["customer"]);
      return {
        id: str(o["id"]),
        name: str(o["orderNumber"], `#${str(o["id"])}`),
        customer: str(c["name"] || c["username"] || o["guestName"], "Guest"),
        email: str(c["email"] || o["guestEmail"] || o["email"]),
        items: list(o["items"]).length,
        total: num(o["total"]),
        paymentStatus: str(o["paymentStatus"]),
        status: str(o["status"]),
        date: day(o["createdAt"]),
        kind: isDonationOrder(o) ? "Donation" : "Store order",
        shipTo: isDonationOrder(o) ? "" : shipTo(o["shippingAddress"]),
        lines: orderLines(o),
      };
    }),
  openDetail: true,
};

/* ---------- Reviews & moderation ---------- */

const reviewRows = (raw: unknown): AdminRecord[] =>
  list(obj(raw)["reviews"]).map((r) => {
    const p = obj(r["product"]);
    const u = obj(r["user"]);
    return {
      id: str(r["id"]),
      name: str(p["name"], "Product"),
      category: str(p["category"]),
      sub: str(r["title"]),
      customer: str(u["name"] || u["username"], "Anonymous"),
      rating: num(r["rating"]),
      reportCount: num(r["reportCount"]),
      status: str(r["status"]),
      date: day(r["createdAt"]),
    };
  });

const reviewBase = {
  columns: [
    { key: "name", label: "Product" },
    { key: "customer", label: "Customer" },
    { key: "rating", label: "Rating" },
    { key: "reportCount", label: "Reports" },
    { key: "status", label: "Status" },
  ],
  fields: [select("status", "Visibility", ["Published", "Hidden"])],
  toRows: reviewRows,
  update: (row: AdminRecord, v: FormValues) =>
    patch(`/admin/reviews/${enc(row.id)}/status`, { status: String(v["status"]) }),
  remove: (row: AdminRecord) => del(`/admin/reviews/${enc(row.id)}`),
};

const reviews: ResourceConfig = {
  ...reviewBase,
  title: "All reviews",
  description: "Every product review, with visibility controls.",
  singular: "review",
  listPath: "/admin/reviews",
  statusOptions: ["Published", "Hidden"],
  extraFilter: {
    key: "category",
    label: "Product type",
    allLabel: "All product types",
    options: [],
  },
};

const productHealth: ResourceConfig = {
  title: "Product health",
  description: "Rating health across the catalogue.",
  singular: "product",
  listPath: "/admin/reviews/product-health",
  columns: [
    { key: "name", label: "Product" },
    { key: "category", label: "Category" },
    { key: "rating", label: "Rating" },
    { key: "ratingCount", label: "Reviews" },
    { key: "status", label: "Health" },
  ],
  fields: [],
  toRows: (raw) =>
    list(obj(raw)["products"]).map((p) => {
      const rating = num(p["rating"]);
      const count = num(p["ratingCount"]);
      return {
        id: str(p["id"]),
        name: str(p["name"]),
        category: str(p["category"]),
        rating,
        ratingCount: count,
        status: count === 0 ? "No reviews" : rating >= 4 ? "Healthy" : "Needs attention",
      };
    }),
  viewReviews: true,
};

/* ---------- Art library (artworks) ---------- */

const artBody = (v: FormValues) => ({
  charname: String(v["name"]),
  category: String(v["category"]),
  source: String(v["source"]),
  artist: String(v["artist"] ?? ""),
  img: String(v["img"]),
  description: String(v["description"] ?? ""),
  artstyle: String(v["artstyle"] ?? ""),
  aboutDesc: String(v["aboutDesc"] ?? ""),
});

const ART_CATEGORIES = ["Digital Portrait", "Color Pencil", "Charcoal & Pencil", "Insane Artwork", "Render", "Others"];
const slugOf = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const artCategoryLabel = (raw: unknown): string =>
  ART_CATEGORIES.find((label) => slugOf(label) === slugOf(str(raw))) ?? "Others";

const art: ResourceConfig = {
  title: "Art library",
  description: "Artwork shown in the community art library.",
  singular: "artwork",
  listPath: "/artworks",
  visual: false,
  refetchInterval: 15_000,
  statusOptions: ART_CATEGORIES,
  columns: [
    { key: "name", label: "Character" },
    { key: "category", label: "Category" },
    { key: "source", label: "Source" },
    { key: "artist", label: "Artist" },
  ],
  fields: [
    text("name", "Character / title"),
    text("category", "Category"),
    text("source", "Source"),
    text("artist", "Artist", false),
    text("img", "Image URL"),
    text("artstyle", "Art style", false),
    area("description", "Description"),
    area("aboutDesc", "About this artwork", false),
  ],
  toRows: (raw) =>
    list(raw).map((a) => ({
      id: str(a["id"]),
      name: str(a["charname"]),
      sub: str(a["artist"] || a["source"]),
      category: str(a["category"]),
      status: artCategoryLabel(a["category"]),
      source: str(a["source"]),
      artist: str(a["artist"]),
      img: str(a["img"]),
      description: str(a["description"]),
      artstyle: str(a["artstyle"]),
      aboutDesc: str(a["aboutDesc"]),
      likes: num(a["likeCount"]),
      comments: num(a["commentCount"]),
      interested: num(a["interestCount"]),
      downloads: num(a["downloadCount"]),
    })),
  create: (v) => post("/artworks", artBody(v)),
  update: (row, v) => put(`/artworks/${enc(row.id)}`, artBody(v)),
  remove: (row) => del(`/artworks/${enc(row.id)}`),
};

/* ---------- Motion & rigs ---------- */

const motionRigs = (type: "motion" | "rig"): ResourceConfig => {
  const body = (v: FormValues) => ({
    title: String(v["name"]),
    type,
    format: String(v["format"]),
    img: String(v["img"]),
    status: String(v["status"]),
    videoUrl: String(v["videoUrl"] ?? "").trim(),
    duration: String(v["duration"] ?? "").trim(),
    description: String(v["description"] ?? "").trim(),
  });
  return {
    title: type === "motion" ? "Motion library" : "Rig library",
    description:
      type === "motion"
        ? "Motion assets available to customers."
        : "Character rigs available to customers.",
    singular: type === "motion" ? "motion asset" : "rig",
    listPath: `/admin/motion-rigs?type=${type}`,
    visual: type === "rig",
    columns: [
      { key: "name", label: "Title" },
      { key: "format", label: "Format" },
      { key: "status", label: "Status" },
    ],
    fields: [
      text("name", "Title"),
      text("format", "Format"),
      text("img", "Image URL"),
      text("videoUrl", "YouTube link", false),
      text("duration", "Duration / meta tag", false),
      area("description", "Description", false),
      select("status", "Status", ["Active", "Draft", "Archived"]),
    ],
    toRows: (raw) =>
      list(raw).map((m) => ({
        id: str(m["id"]),
        name: str(m["title"]),
        sub: str(m["format"]),
        format: str(m["format"]),
        img: str(m["img"]),
        status: str(m["status"]),
        videoUrl: str(m["videoUrl"]),
        duration: str(m["duration"]),
        description: str(m["description"]),
      })),
    create: (v) => post("/admin/motion-rigs", body(v)),
    update: (row, v) => put(`/admin/motion-rigs/${enc(row.id)}`, body(v)),
    remove: (row) => del(`/admin/motion-rigs/${enc(row.id)}`),
  };
};

/* ---------- News ---------- */

const NEWS_CATEGORIES = [
  "Platform Core",
  "3D Animation",
  "Web Dev",
  "Art Library",
  "Design",
  "Merchandise",
  "Community",
];
export const NEWS_PLACEMENTS = [
  { value: "standard", label: "Standard story" },
  { value: "main_feature", label: "Main feature" },
  { value: "recommended", label: "Recommended card" },
  { value: "list", label: "List item" },
];
const placementLabel = (value: string): string =>
  NEWS_PLACEMENTS.find((p) => p.value === value)?.label ?? "Standard story";
const placementValue = (label: string): string =>
  NEWS_PLACEMENTS.find((p) => p.label === label)?.value ?? "standard";

const newsBody = (v: FormValues) => ({
  title: String(v["name"]),
  category: String(v["category"]),
  author: String(v["author"] || "Team SenpaiWorks"),
  date: String(v["date"] ?? ""),
  readTime: String(v["readTime"] || "5 mins read"),
  img: String(v["img"] ?? ""),
  summary: String(v["summary"] ?? ""),
  content: String(v["content"] ?? ""),
  placement: placementValue(String(v["placement"] ?? "")),
  isFeatured: v["isFeatured"] === true,
  hashtags: String(v["hashtags"] ?? ""),
});

const news: ResourceConfig = {
  title: "News & articles",
  description: "Articles published on the news page.",
  singular: "article",
  listPath: "/admin/news",
  liveUrl: (row) => `/article.html?id=${enc(row.id)}`,
  extraFilter: {
    key: "category",
    label: "Category",
    allLabel: "All categories",
    options: NEWS_CATEGORIES,
  },
  columns: [
    { key: "name", label: "Title" },
    { key: "category", label: "Category" },
    { key: "author", label: "Author" },
    { key: "placement", label: "Placement" },
    { key: "views", label: "Views" },
    { key: "status", label: "Status" },
  ],
  fields: [
    text("name", "Title"),
    select("category", "Category", NEWS_CATEGORIES),
    text("author", "Author", false),
    text("date", "Publish date", false),
    text("readTime", "Read time", false),
    select(
      "placement",
      "Homepage placement",
      NEWS_PLACEMENTS.map((p) => p.label),
    ),
    checkbox("isFeatured", "Highlight on homepage"),
    image("img", "Cover image"),
    text("hashtags", "Hashtags", false),
    area("summary", "Summary", true),
    area("content", "Content", true),
  ],
  toRows: (raw) =>
    list(raw).map((n) => {
      const featured = n["isFeatured"] === true;
      return {
        id: str(n["id"]),
        name: str(n["title"]),
        sub: str(n["summary"]),
        category: str(n["category"]),
        author: str(n["author"]),
        views: num(n["views"]),
        date: str(n["date"]),
        img: str(n["img"]),
        summary: str(n["summary"]),
        content: str(n["content"]),
        readTime: str(n["readTime"]),
        placement: placementLabel(str(n["placement"])),
        hashtags: str(n["hashtags"]),
        isFeatured: featured,
        status: featured ? "Featured" : "Standard",
      };
    }),
  create: (v) => post("/admin/news", newsBody(v)),
  update: (row, v) => put(`/admin/news/${enc(row.id)}`, newsBody(v)),
  remove: (row) => del(`/admin/news/${enc(row.id)}`),
  rowAction: {
    label: (row) => (row.status === "Featured" ? "Unfeature" : "Feature"),
    run: (row) => patch(`/admin/news/${enc(row.id)}/feature`, {}),
    success: "Featured state updated",
  },
};

/* ---------- Coupons ---------- */

const coupons: ResourceConfig = {
  title: "Coupons",
  description: "Discount codes for checkout.",
  singular: "coupon",
  listPath: "/admin/coupons",
  columns: [
    { key: "name", label: "Code" },
    { key: "discountType", label: "Type" },
    { key: "discountValue", label: "Value" },
    { key: "usageCount", label: "Used" },
    { key: "maxUses", label: "Max uses" },
    { key: "expiryDate", label: "Expires" },
    { key: "status", label: "Status" },
  ],
  fields: [
    text("name", "Code"),
    select("discountType", "Discount type", ["percentage", "flat"]),
    numberField("discountValue", "Discount value"),
    numberField("maxUses", "Max uses (0 = unlimited)"),
    text("expiryDate", "Expiry date (YYYY-MM-DD)", false),
  ],
  toRows: (raw) =>
    list(raw).map((c) => ({
      id: str(c["code"]),
      name: str(c["code"]),
      sub: str(c["discountType"]),
      discountType: str(c["discountType"]),
      discountValue: num(c["discountValue"]),
      usageCount: num(c["usageCount"]),
      maxUses: num(c["maxUses"]),
      expiryDate: day(c["expiryDate"]) || "Never",
      status: str(c["status"], "Active"),
    })),
  create: (v) =>
    post("/admin/coupons", {
      code: String(v["name"]),
      discountType: String(v["discountType"]),
      discountValue: Number(v["discountValue"]),
      maxUses: Number(v["maxUses"]) || null,
      expiryDate: v["expiryDate"] ? String(v["expiryDate"]) : null,
    }),
  remove: (row) => del(`/admin/coupons/${enc(row.id)}`),
  rowAction: {
    label: (row) => (row.status === "Active" ? "Deactivate" : "Activate"),
    run: (row) => patch(`/admin/coupons/${enc(row.id)}/toggle`, {}),
    success: "Coupon status updated",
  },
};

/* ---------- Donations (read-only) ---------- */

const donations: ResourceConfig = {
  title: "Donations & patrons",
  description: "Donations received through the site. Read-only.",
  singular: "donation",
  listPath: "/admin/donations",
  columns: [
    { key: "name", label: "Donor" },
    { key: "email", label: "Email" },
    { key: "amount", label: "Amount" },
    { key: "date", label: "Date" },
    { key: "status", label: "Payment" },
  ],
  fields: [],
  toRows: (raw) =>
    list(raw).map((d) => ({
      id: str(d["id"]),
      name: str(d["donorName"], "Anonymous"),
      sub: str(d["donorEmail"]),
      email: str(d["donorEmail"]),
      amount: `${str(d["currency"], "INR")} ${num(d["amount"]).toLocaleString("en-IN")}`,
      date: day(d["createdAt"]),
      status: str(d["paymentStatus"]),
    })),
};

/* ---------- Replacements ---------- */

export const replacements: ResourceConfig = {
  title: "Replacements",
  description: "Review replacement requests. Approved requests move to the replacement queue.",
  singular: "replacement",
  listPath: "/admin/replacements",
  refetchInterval: 30_000,
  columns: [
    { key: "name", label: "Request" },
    { key: "orderNumber", label: "Order" },
    { key: "product", label: "Product" },
    { key: "reason", label: "Reason" },
    { key: "status", label: "Status" },
    { key: "date", label: "Date" },
  ],
  fields: [select("status", "Status", REPLACEMENT_STATUSES)],
  toRows: (raw) =>
    list(raw).map((r) => {
      const order = obj(r["order"]);
      const customer = obj(order["customer"]);
      const item = obj(r["orderItem"]);
      const newOrder = obj(r["newOrder"]);
      const hasItem = Object.keys(item).length > 0;
      const lines = hasItem ? [item] : list(order["items"]);
      return {
        id: str(r["id"]),
        name: `REP-${str(r["id"])}`,
        orderId: str(r["orderId"]),
        orderNumber: str(order["orderNumber"], `#${str(r["orderId"])}`),
        orderTotal: num(order["total"]),
        deliveredAt: str(order["deliveredAt"]),
        customer: str(customer["name"] || customer["username"] || order["guestName"], "Guest"),
        email: str(customer["email"] || order["guestEmail"] || order["email"]),
        phone: str(order["guestPhone"], "Not provided"),
        shipTo: shipTo(order["shippingAddress"]),
        product: hasItem ? str(item["productName"], "Item") : "Entire order",
        itemsJson: JSON.stringify(
          lines.map((i) => ({
            name: str(i["productName"], "Item"),
            variant: str(i["variant"]),
            quantity: num(i["quantity"]) || 1,
            price: num(i["price"]),
            img: str(i["img"]),
          })),
        ),
        reason: str(r["reason"], "Defective/Damaged"),
        status: str(r["status"]),
        date: day(r["createdAt"]),
        createdAt: str(r["createdAt"]),
        newOrderId: str(r["newOrderId"]),
        newOrderNumber: str(newOrder["orderNumber"]),
        newOrderStatus: str(newOrder["status"]),
      };
    }),
  update: (row, v) =>
    patch(`/admin/replacements/${enc(row.id)}`, { status: String(v["status"]) }),
};

/* ---------- Users (read-only) ---------- */

const users: ResourceConfig = {
  title: "Users",
  description: "Registered customer accounts. Read-only.",
  singular: "user",
  listPath: "/users",
  columns: [
    { key: "name", label: "Name" },
    { key: "username", label: "Username" },
    { key: "email", label: "Email" },
    { key: "provider", label: "Sign-in" },
    { key: "date", label: "Joined" },
  ],
  fields: [],
  toRows: (raw) =>
    list(raw).map((u) => ({
      id: str(u["id"]),
      name: str(u["name"] || u["username"], "—"),
      sub: str(u["email"]),
      username: str(u["username"]),
      email: str(u["email"]),
      provider: str(u["provider"]),
      date: day(u["createdAt"]),
    })),
};

/* ---------- Customer feedback (profile queries) and community feedback ---------- */

const FEEDBACK_STATUSES = ["Pending", "Reviewed", "Resolved", "Flagged"];
const COMMUNITY_VISIBILITY = ["Public", "Hidden"];

type FeedbackSource = "profile" | "community";

/** The admin feedback list mixes both sources; each page keeps only its own. */
const feedbackRows =
  (source: FeedbackSource) =>
  (raw: unknown): AdminRecord[] =>
    list(obj(raw)["feedback"])
      .filter((f) => (str(f["source"]) === "community" ? "community" : "profile") === source)
      .map((f) => {
        const message = str(f["message"]);
        const title = str(f["title"]);
        return {
          id: str(f["id"]),
          name: str(f["customerName"], "Customer"),
          sub: title ? `${title}: ${message}` : message,
          customer: str(f["customerEmail"]),
          category: str(f["category"], "General"),
          rating: num(f["rating"]),
          status: str(f["status"], "Pending"),
          adminReply: str(f["adminReply"]),
          date: day(f["createdAt"]),
        };
      });

const communityFeedback: ResourceConfig = {
  title: "Community feedback",
  description: "Community reviews shown on the storefront. Hide a review to take it off the site.",
  singular: "community review",
  listPath: "/admin/feedback",
  columns: [
    { key: "name", label: "Author" },
    { key: "category", label: "Category" },
    { key: "rating", label: "Rating" },
    { key: "status", label: "Visibility" },
    { key: "date", label: "Date" },
  ],
  fields: [select("status", "Visibility", COMMUNITY_VISIBILITY)],
  toRows: feedbackRows("community"),
  update: (row: AdminRecord, v: FormValues) =>
    patch(`/admin/feedback/community/${enc(row.id)}`, {
      isPublic: String(v["status"]) === "Public",
    }),
  remove: (row: AdminRecord) => del(`/admin/feedback/community/${enc(row.id)}`),
};

const profileFeedback: ResourceConfig = {
  title: "Customer feedback",
  description:
    "Feedback sent from customer profiles. Set the status and reply; the reply appears on the customer's profile.",
  singular: "feedback",
  listPath: "/admin/feedback",
  columns: [
    { key: "name", label: "Customer" },
    { key: "category", label: "Category" },
    { key: "rating", label: "Rating" },
    { key: "status", label: "Status" },
    { key: "date", label: "Date" },
  ],
  fields: [
    select("status", "Status", FEEDBACK_STATUSES),
    area("adminReply", "Reply to customer (shown on their profile)"),
  ],
  toRows: feedbackRows("profile"),
  update: (row: AdminRecord, v: FormValues) =>
    patch(`/admin/feedback/${enc(row.id)}`, {
      status: String(v["status"]),
      adminReply: String(v["adminReply"] ?? "").trim(),
    }),
  remove: (row: AdminRecord) => del(`/admin/feedback/${enc(row.id)}`),
};

export const resources: Record<string, ResourceConfig> = {
  products,
  orders,
  reviews,
  feedback: communityFeedback,
  "profile-feedback": profileFeedback,
  "product-health": productHealth,
  art,
  motion: motionRigs("motion"),
  rigs: motionRigs("rig"),
  news,
  coupons,
  donations,
  replacements,
  users,
};
