/*
  Warnings:

  - You are about to drop the column `adminNote` on the `WalletRechargeRequest` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `WalletRechargeRequest` table. All the data in the column will be lost.
  - You are about to drop the column `verifiedAt` on the `WalletRechargeRequest` table. All the data in the column will be lost.
  - You are about to drop the column `verifiedBy` on the `WalletRechargeRequest` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "WalletRechargeRequest_status_createdAt_idx";

-- AlterTable
ALTER TABLE "WalletRechargeRequest" DROP COLUMN "adminNote",
DROP COLUMN "status",
DROP COLUMN "verifiedAt",
DROP COLUMN "verifiedBy";

-- DropEnum
DROP TYPE "RechargeStatus";
