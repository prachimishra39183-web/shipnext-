-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "selectedRateOption" TEXT;

-- AlterTable
ALTER TABLE "ShipmentDraft" ADD COLUMN     "approvedShippingCharge" DECIMAL(12,2),
ADD COLUMN     "delhiveryExpressRate" DECIMAL(12,2),
ADD COLUMN     "delhiveryStandardRate" DECIMAL(12,2),
ADD COLUMN     "rateApprovalStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "rateApprovedAt" TIMESTAMP(3),
ADD COLUMN     "rateApprovedById" TEXT,
ADD COLUMN     "selectedRateOption" TEXT,
ADD COLUMN     "shipNextRate" DECIMAL(12,2);
