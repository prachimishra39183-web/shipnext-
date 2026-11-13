-- CreateEnum
CREATE TYPE "ShippingMode" AS ENUM ('EXPRESS_AIR', 'NORMAL_AIR', 'EXPRESS_SURFACE', 'NORMAL_SURFACE');

-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "shippingMode" "ShippingMode";

-- AlterTable
ALTER TABLE "ShipmentDraft" ADD COLUMN     "shippingMode" "ShippingMode";

-- CreateTable
CREATE TABLE "ServiceabilityMode" (
    "id" TEXT NOT NULL,
    "pickupPincode" TEXT NOT NULL,
    "deliveryPincode" TEXT NOT NULL,
    "mode" "ShippingMode" NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceabilityMode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceabilityMode_pickupPincode_deliveryPincode_isActive_idx" ON "ServiceabilityMode"("pickupPincode", "deliveryPincode", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceabilityMode_pickupPincode_deliveryPincode_mode_key" ON "ServiceabilityMode"("pickupPincode", "deliveryPincode", "mode");
