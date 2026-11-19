-- AlterTable
ALTER TABLE "ShipmentDraft" ADD COLUMN     "codAmount" DECIMAL(12,2),
ADD COLUMN     "paymentMode" TEXT NOT NULL DEFAULT 'PREPAID';
