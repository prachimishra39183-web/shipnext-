-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "codCharge" DECIMAL(12,2),
ADD COLUMN     "codNetAmount" DECIMAL(12,2),
ADD COLUMN     "codRemittedAt" TIMESTAMP(3),
ADD COLUMN     "codSettledAt" TIMESTAMP(3),
ADD COLUMN     "codSettlementReference" TEXT,
ADD COLUMN     "codSettlementStatus" TEXT DEFAULT 'PENDING',
ALTER COLUMN "codCollectionStatus" SET DEFAULT 'PENDING',
ALTER COLUMN "codRemittanceStatus" SET DEFAULT 'PENDING';
