-- CreateEnum
CREATE TYPE "CourierPartner" AS ENUM ('DELHIVERY', 'SKYKING', 'BLUEDART');

-- CreateTable
CREATE TABLE "CourierPincodeServiceability" (
    "id" TEXT NOT NULL,
    "courier" "CourierPartner" NOT NULL,
    "pincode" TEXT NOT NULL,
    "stateCode" TEXT,
    "district" TEXT,
    "prepaid" BOOLEAN NOT NULL DEFAULT false,
    "reversePickup" BOOLEAN NOT NULL DEFAULT false,
    "repl" BOOLEAN NOT NULL DEFAULT false,
    "cod" BOOLEAN NOT NULL DEFAULT false,
    "cash" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourierPincodeServiceability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourierPincodeServiceability_pincode_idx" ON "CourierPincodeServiceability"("pincode");

-- CreateIndex
CREATE INDEX "CourierPincodeServiceability_courier_pincode_idx" ON "CourierPincodeServiceability"("courier", "pincode");

-- CreateIndex
CREATE UNIQUE INDEX "CourierPincodeServiceability_courier_pincode_key" ON "CourierPincodeServiceability"("courier", "pincode");
