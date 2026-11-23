-- CreateTable
CREATE TABLE "BlockedPincode" (
    "id" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "reason" TEXT,
    "blockedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlockedPincode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlockedPincode_pincode_key" ON "BlockedPincode"("pincode");

-- CreateIndex
CREATE INDEX "BlockedPincode_pincode_idx" ON "BlockedPincode"("pincode");
