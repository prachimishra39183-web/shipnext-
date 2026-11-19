-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "recipientPaymentMode" TEXT NOT NULL DEFAULT 'PREPAID',
ALTER COLUMN "paymentMode" SET DEFAULT 'WALLET';
