/*
  Warnings:

  - A unique constraint covering the columns `[courierAwb]` on the table `Shipment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "awbAssignedAt" TIMESTAMP(3),
ADD COLUMN     "courierAwb" TEXT,
ADD COLUMN     "courierPartner" TEXT,
ADD COLUMN     "labelUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_courierAwb_key" ON "Shipment"("courierAwb");
