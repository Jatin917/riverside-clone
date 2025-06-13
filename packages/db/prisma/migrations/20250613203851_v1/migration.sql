/*
  Warnings:

  - You are about to drop the column `hostId` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `participants` on the `Session` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_hostId_fkey";

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "hostId",
DROP COLUMN "participants";
