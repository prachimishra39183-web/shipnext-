-- CreateTable
CREATE TABLE "ShipmentDraft" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "pickupName" TEXT NOT NULL,
    "pickupPhone" TEXT NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "pickupPincode" TEXT NOT NULL,
    "deliveryName" TEXT NOT NULL,
    "deliveryPhone" TEXT NOT NULL,
    "deliveryAddress" TEXT NOT NULL,
    "deliveryPincode" TEXT NOT NULL,
    "weightGrams" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShipmentDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShipmentDraft_customerId_idx" ON "ShipmentDraft"("customerId");

-- AddForeignKey
ALTER TABLE "ShipmentDraft" ADD CONSTRAINT "ShipmentDraft_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
