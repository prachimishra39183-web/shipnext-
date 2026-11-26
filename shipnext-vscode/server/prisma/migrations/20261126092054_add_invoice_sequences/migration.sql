-- CreateTable
CREATE TABLE "InvoiceSequence" (
    "id" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceSequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvoiceSequence_financialYear_idx" ON "InvoiceSequence"("financialYear");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceSequence_prefix_financialYear_key" ON "InvoiceSequence"("prefix", "financialYear");
