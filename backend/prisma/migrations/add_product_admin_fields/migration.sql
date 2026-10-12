-- Product fields used by the admin product form (SKU, cost price, product status).
ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "sku" TEXT,
  ADD COLUMN IF NOT EXISTS "costPrice" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "productStatus" TEXT NOT NULL DEFAULT 'Active';
