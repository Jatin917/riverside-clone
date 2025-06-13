/*
  Warnings:

  - A unique constraint covering the columns `[ownerId]` on the table `Studio` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Studio_ownerId_key" ON "Studio"("ownerId");
