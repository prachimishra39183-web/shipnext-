-- CreateTable
CREATE TABLE "CustomerTaxSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "defaultGstRate" DECIMAL(5,2) NOT NULL DEFAULT 18,
    "taxInclusive" BOOLEAN NOT NULL DEFAULT false,
    "reverseCharge" BOOLEAN NOT NULL DEFAULT false,
    "placeOfSupply" TEXT,
    "enableGstInvoice" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerTaxSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerTaxSettings_userId_key" ON "CustomerTaxSettings"("userId");

-- AddForeignKey
ALTER TABLE "CustomerTaxSettings" ADD CONSTRAINT "CustomerTaxSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
