-- CreateEnum
CREATE TYPE "NDRStatus" AS ENUM ('OPEN', 'ACTION_REQUIRED', 'REATTEMPT_SCHEDULED', 'RESOLVED', 'RTO_INITIATED');

-- CreateTable
CREATE TABLE "NDRRecord" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "reason" TEXT NOT NULL,
    "status" "NDRStatus" NOT NULL DEFAULT 'OPEN',
    "actionRequired" TEXT,
    "remarks" TEXT,
    "nextAttemptDate" TIMESTAMP(3),
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NDRRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NDRRecord_shipmentId_idx" ON "NDRRecord"("shipmentId");

-- CreateIndex
CREATE INDEX "NDRRecord_reportedAt_idx" ON "NDRRecord"("reportedAt");

-- CreateIndex
CREATE INDEX "NDRRecord_status_idx" ON "NDRRecord"("status");

-- AddForeignKey
ALTER TABLE "NDRRecord" ADD CONSTRAINT "NDRRecord_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
