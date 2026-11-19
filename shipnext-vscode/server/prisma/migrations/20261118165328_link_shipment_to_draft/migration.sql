/*
  Warnings:

  - A unique constraint covering the columns `[draftId]` on the table `Shipment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `draftId` to the `Shipment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "draftId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_draftId_key" ON "Shipment"("draftId");

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "ShipmentDraft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
