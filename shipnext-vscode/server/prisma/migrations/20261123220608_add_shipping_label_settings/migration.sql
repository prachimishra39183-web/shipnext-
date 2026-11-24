-- CreateTable
CREATE TABLE "ShippingLabelSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "labelSize" TEXT NOT NULL DEFAULT '4X6',
    "orientation" TEXT NOT NULL DEFAULT 'PORTRAIT',
    "showLogo" BOOLEAN NOT NULL DEFAULT true,
    "showCompanyName" BOOLEAN NOT NULL DEFAULT true,
    "showSenderPhone" BOOLEAN NOT NULL DEFAULT true,
    "showReceiverPhone" BOOLEAN NOT NULL DEFAULT true,
    "showOrderId" BOOLEAN NOT NULL DEFAULT true,
    "showPaymentMode" BOOLEAN NOT NULL DEFAULT true,
    "barcodeFormat" TEXT NOT NULL DEFAULT 'CODE128',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingLabelSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShippingLabelSettings_userId_key" ON "ShippingLabelSettings"("userId");

-- AddForeignKey
ALTER TABLE "ShippingLabelSettings" ADD CONSTRAINT "ShippingLabelSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
