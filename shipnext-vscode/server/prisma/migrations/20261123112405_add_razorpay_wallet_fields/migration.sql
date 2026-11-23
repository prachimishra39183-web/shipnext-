/*
  Warnings:

  - A unique constraint covering the columns `[razorpayOrderId]` on the table `WalletRechargeRequest` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[razorpayPaymentId]` on the table `WalletRechargeRequest` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "WalletRechargeRequest" ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "upiReference" DROP NOT NULL,
ALTER COLUMN "paymentMethod" SET DEFAULT 'RAZORPAY';

-- CreateIndex
CREATE UNIQUE INDEX "WalletRechargeRequest_razorpayOrderId_key" ON "WalletRechargeRequest"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletRechargeRequest_razorpayPaymentId_key" ON "WalletRechargeRequest"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "WalletRechargeRequest_status_idx" ON "WalletRechargeRequest"("status");
