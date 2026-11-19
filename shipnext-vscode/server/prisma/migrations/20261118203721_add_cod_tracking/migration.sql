-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "codAmount" DECIMAL(12,2),
ADD COLUMN     "codCollectedAt" TIMESTAMP(3),
ADD COLUMN     "codCollectionStatus" TEXT,
ADD COLUMN     "codRemittanceReference" TEXT,
ADD COLUMN     "codRemittanceStatus" TEXT;

-- CreateIndex
CREATE INDEX "Shipment_codCollectionStatus_idx" ON "Shipment"("codCollectionStatus");

-- CreateIndex
CREATE INDEX "Shipment_codRemittanceStatus_idx" ON "Shipment"("codRemittanceStatus");
