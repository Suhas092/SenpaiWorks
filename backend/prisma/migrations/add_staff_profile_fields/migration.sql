-- Staff self-service profile: phone number and profile photo (R2 URL).
ALTER TABLE "StaffMember" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "StaffMember" ADD COLUMN IF NOT EXISTS "avatar" TEXT;
