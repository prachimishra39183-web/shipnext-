-- CreateTable
CREATE TABLE "CustomerInvoiceSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "invoiceTitle" TEXT,
    "templateStyle" TEXT NOT NULL DEFAULT 'STANDARD',
    "showLogo" BOOLEAN NOT NULL DEFAULT true,
    "showGst" BOOLEAN NOT NULL DEFAULT true,
    "showPan" BOOLEAN NOT NULL DEFAULT false,
    "footerNote" TEXT,
    "termsAndConditions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerInvoiceSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerInvoiceSettings_userId_key" ON "CustomerInvoiceSettings"("userId");

-- AddForeignKey
ALTER TABLE "CustomerInvoiceSettings" ADD CONSTRAINT "CustomerInvoiceSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
