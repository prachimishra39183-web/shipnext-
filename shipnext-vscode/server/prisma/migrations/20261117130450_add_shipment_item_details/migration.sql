-- CreateEnum
CREATE TYPE "ShipmentType" AS ENUM ('DOCUMENT', 'NON_DOCUMENT');

-- AlterTable
ALTER TABLE "ShipmentDraft" ADD COLUMN     "itemCategory" TEXT,
ADD COLUMN     "itemDescription" TEXT,
ADD COLUMN     "itemName" TEXT,
ADD COLUMN     "shipmentType" "ShipmentType" NOT NULL DEFAULT 'DOCUMENT';
