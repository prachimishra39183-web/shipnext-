-- CreateEnum
CREATE TYPE "ChildAccountStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateTable
CREATE TABLE "ChildAccount" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "branchName" TEXT NOT NULL,
    "branchCode" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "status" "ChildAccountStatus" NOT NULL DEFAULT 'INACTIVE',
    "dailyShipmentLimit" INTEGER,
    "dailyWalletLimit" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChildAccount_parentId_idx" ON "ChildAccount"("parentId");

-- CreateIndex
CREATE INDEX "ChildAccount_status_idx" ON "ChildAccount"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ChildAccount_parentId_branchCode_key" ON "ChildAccount"("parentId", "branchCode");

-- AddForeignKey
ALTER TABLE "ChildAccount" ADD CONSTRAINT "ChildAccount_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
