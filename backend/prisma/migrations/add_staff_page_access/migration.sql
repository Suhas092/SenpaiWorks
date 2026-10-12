-- Staff roles become "admin" (edit on every page) and "junior_admin" (per-page grants).
-- Per-page grants are stored as JSON: { "<pageKey>": "view" | "edit" }.
ALTER TABLE "StaffMember" ADD COLUMN IF NOT EXISTS "pageAccess" JSONB NOT NULL DEFAULT '{}';

-- Existing members keep the reach they had before, with edit rights on the pages their old role covered.
UPDATE "StaffMember"
SET role = 'junior_admin',
    "pageAccess" = '{"dashboard":"edit","products":"edit","orders":"edit","replacements":"edit","reviews":"edit","community":"edit","polls":"edit","home":"edit","art":"edit","motion":"edit","news":"edit","customers":"edit","coupons":"edit","donations":"edit"}'::jsonb
WHERE role = 'manager';

UPDATE "StaffMember"
SET role = 'junior_admin',
    "pageAccess" = '{"dashboard":"edit","products":"edit","home":"edit","art":"edit","motion":"edit","news":"edit"}'::jsonb
WHERE role = 'editor';

UPDATE "StaffMember"
SET role = 'junior_admin',
    "pageAccess" = '{"dashboard":"edit","orders":"edit","replacements":"edit","reviews":"edit","community":"edit","polls":"edit","customers":"edit"}'::jsonb
WHERE role = 'support';
