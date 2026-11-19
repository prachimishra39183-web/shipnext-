-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "childAccountId" TEXT;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_childAccountId_fkey" FOREIGN KEY ("childAccountId") REFERENCES "ChildAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
