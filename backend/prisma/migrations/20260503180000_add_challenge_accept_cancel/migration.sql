-- Add lifecycle states for accepted/cancelled challenge flow.
ALTER TYPE "challenge_status" ADD VALUE IF NOT EXISTS 'accepted';
ALTER TYPE "challenge_status" ADD VALUE IF NOT EXISTS 'cancelled';

ALTER TABLE "user_challenge"
ADD COLUMN "accepted_at" TIMESTAMP(6),
ADD COLUMN "accepted_from_lat" DECIMAL(9, 6),
ADD COLUMN "accepted_from_lng" DECIMAL(9, 6),
ADD COLUMN "cancelled_at" TIMESTAMP(6);

CREATE INDEX IF NOT EXISTS "user_challenge_user_status_assigned_idx"
ON "user_challenge"("user_id", "status", "assigned_at");
