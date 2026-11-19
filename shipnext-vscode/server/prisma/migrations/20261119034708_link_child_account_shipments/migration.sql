-- AlterTable
ALTER TABLE "ShipmentDraft" ADD COLUMN     "childAccountId" TEXT;

-- AddForeignKey
ALTER TABLE "ShipmentDraft" ADD CONSTRAINT "ShipmentDraft_childAccountId_fkey" FOREIGN KEY ("childAccountId") REFERENCES "ChildAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
