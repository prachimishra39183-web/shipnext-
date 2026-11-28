-- CreateEnum
CREATE TYPE "RTOStatus" AS ENUM ('INITIATED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED_TO_SELLER', 'CANCELLED');

-- CreateTable
CREATE TABLE "RTORecord" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RTOStatus" NOT NULL DEFAULT 'INITIATED',
    "returnAwb" TEXT,
    "remarks" TEXT,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RTORecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RTORecord_shipmentId_idx" ON "RTORecord"("shipmentId");

-- CreateIndex
CREATE INDEX "RTORecord_status_idx" ON "RTORecord"("status");

-- CreateIndex
CREATE INDEX "RTORecord_initiatedAt_idx" ON "RTORecord"("initiatedAt");

-- AddForeignKey
ALTER TABLE "RTORecord" ADD CONSTRAINT "RTORecord_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
