/*
  Warnings:

  - You are about to drop the column `assigned_date` on the `user_challenge` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,challenge_id,assigned_at]` on the table `user_challenge` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "user_challenge_user_id_challenge_id_assigned_date_key";

-- DropIndex
DROP INDEX "user_challenge_user_status_assigned_idx";

-- AlterTable
ALTER TABLE "user_challenge" DROP COLUMN "assigned_date";

-- CreateIndex
CREATE UNIQUE INDEX "user_challenge_user_id_challenge_id_assigned_at_key" ON "user_challenge"("user_id", "challenge_id", "assigned_at");
