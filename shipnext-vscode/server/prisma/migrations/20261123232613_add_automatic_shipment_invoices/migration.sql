-- CreateTable
CREATE TABLE "ShipmentInvoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "docketNumber" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "billingName" TEXT,
    "billingGst" TEXT,
    "billingAddress" TEXT,
    "billingState" TEXT,
    "billingPincode" TEXT,
    "shippingCharge" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "codCharge" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxableAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "gstRate" DECIMAL(5,2) NOT NULL DEFAULT 18,
    "cgstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sgstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "igstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalTax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShipmentInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShipmentInvoice_invoiceNumber_key" ON "ShipmentInvoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ShipmentInvoice_shipmentId_key" ON "ShipmentInvoice"("shipmentId");

-- CreateIndex
CREATE INDEX "ShipmentInvoice_customerId_idx" ON "ShipmentInvoice"("customerId");

-- CreateIndex
CREATE INDEX "ShipmentInvoice_docketNumber_idx" ON "ShipmentInvoice"("docketNumber");

-- CreateIndex
CREATE INDEX "ShipmentInvoice_invoiceDate_idx" ON "ShipmentInvoice"("invoiceDate");

-- AddForeignKey
ALTER TABLE "ShipmentInvoice" ADD CONSTRAINT "ShipmentInvoice_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentInvoice" ADD CONSTRAINT "ShipmentInvoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
