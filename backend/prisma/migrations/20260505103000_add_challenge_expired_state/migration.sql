ALTER TYPE "challenge_status" ADD VALUE IF NOT EXISTS 'expired';

ALTER TABLE "user_challenge"
ADD COLUMN IF NOT EXISTS "expired_at" TIMESTAMP(6);
