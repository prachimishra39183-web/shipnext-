-- AlterTable
ALTER TABLE "WalletTransaction" ADD COLUMN     "balanceAfter" DECIMAL(12,2),
ADD COLUMN     "balanceBefore" DECIMAL(12,2),
ADD COLUMN     "performedByAdminId" TEXT,
ADD COLUMN     "reason" TEXT;

-- CreateIndex
CREATE INDEX "WalletTransaction_userId_createdAt_idx" ON "WalletTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "WalletTransaction_performedByAdminId_createdAt_idx" ON "WalletTransaction"("performedByAdminId", "createdAt");

-- CreateIndex
CREATE INDEX "WalletTransaction_type_createdAt_idx" ON "WalletTransaction"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_performedByAdminId_fkey" FOREIGN KEY ("performedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
