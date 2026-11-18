-- CreateEnum
CREATE TYPE "RechargeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "WalletRechargeRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "upiReference" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'UPI',
    "status" "RechargeStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletRechargeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WalletRechargeRequest_upiReference_key" ON "WalletRechargeRequest"("upiReference");

-- CreateIndex
CREATE INDEX "WalletRechargeRequest_userId_createdAt_idx" ON "WalletRechargeRequest"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "WalletRechargeRequest_status_createdAt_idx" ON "WalletRechargeRequest"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "WalletRechargeRequest" ADD CONSTRAINT "WalletRechargeRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
