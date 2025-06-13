/*
  Warnings:

  - You are about to drop the column `slug` on the `Studio` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slugId]` on the table `Studio` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slugId` to the `Studio` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Studio_slug_key";

-- AlterTable
ALTER TABLE "Studio" DROP COLUMN "slug",
ADD COLUMN     "slugId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Studio_slugId_key" ON "Studio"("slugId");
