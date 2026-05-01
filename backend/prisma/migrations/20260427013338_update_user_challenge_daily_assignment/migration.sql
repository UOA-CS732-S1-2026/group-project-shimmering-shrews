/*
  Warnings:

  - The primary key for the `user_challenge` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[user_id,challenge_id,assigned_date]` on the table `user_challenge` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "user_challenge" DROP CONSTRAINT "user_challenge_pkey",
ADD COLUMN     "assigned_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "user_challenge_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "user_challenge_user_id_challenge_id_assigned_date_key" ON "user_challenge"("user_id", "challenge_id", "assigned_date");
