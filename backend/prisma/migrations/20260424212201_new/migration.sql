-- CreateEnum
CREATE TYPE "challenge_status" AS ENUM ('in_progress', 'skipped', 'completed');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('user', 'admin');

-- CreateTable
CREATE TABLE "awarded_badge" (
    "user_id" INTEGER NOT NULL,
    "badge_id" INTEGER NOT NULL,
    "earned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT (now() AT TIME ZONE 'nzt'::text),

    CONSTRAINT "awarded_badge_pkey" PRIMARY KEY ("user_id","badge_id")
);

-- CreateTable
CREATE TABLE "badge" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "achievement_criteria" JSONB NOT NULL,
    "target_value" INTEGER NOT NULL,
    "description" VARCHAR(100),
    "active_url" VARCHAR(500),
    "inactive_url" VARCHAR(500),

    CONSTRAINT "badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(500) NOT NULL,
    "location_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "xp_worth" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" VARCHAR(1000),

    CONSTRAINT "challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_category" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "icon" VARCHAR(500),

    CONSTRAINT "challenge_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(500) NOT NULL,
    "category" VARCHAR(250),
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,

    CONSTRAINT "location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badge_progress" (
    "user_id" INTEGER NOT NULL,
    "badge_id" INTEGER NOT NULL,
    "current_value" INTEGER NOT NULL,

    CONSTRAINT "user_badge_progress_pkey" PRIMARY KEY ("user_id","badge_id")
);

-- CreateTable
CREATE TABLE "user_challenge" (
    "user_id" INTEGER NOT NULL,
    "challenge_id" INTEGER NOT NULL,
    "status" "challenge_status" NOT NULL,
    "xp_worth" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(6),
    "skipped_at" TIMESTAMP(6),

    CONSTRAINT "user_challenge_pkey" PRIMARY KEY ("user_id","challenge_id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "email" VARCHAR(250) NOT NULL,
    "user_role" "user_role" NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_completed_challenge" TIMESTAMP(6),
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp_earned" INTEGER NOT NULL DEFAULT 0,
    "streak_count" INTEGER NOT NULL DEFAULT 0,
    "auth_id" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_id_key" ON "users"("auth_id");

-- AddForeignKey
ALTER TABLE "awarded_badge" ADD CONSTRAINT "fk_ab_badge" FOREIGN KEY ("badge_id") REFERENCES "badge"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "awarded_badge" ADD CONSTRAINT "fk_ab_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "challenge" ADD CONSTRAINT "fk_challenge_category" FOREIGN KEY ("category_id") REFERENCES "challenge_category"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "challenge" ADD CONSTRAINT "fk_challenge_location" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_badge_progress" ADD CONSTRAINT "fk_ubp_badge" FOREIGN KEY ("badge_id") REFERENCES "badge"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_badge_progress" ADD CONSTRAINT "fk_ubp_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_challenge" ADD CONSTRAINT "fk_uc_challenge" FOREIGN KEY ("challenge_id") REFERENCES "challenge"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_challenge" ADD CONSTRAINT "fk_uc_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
