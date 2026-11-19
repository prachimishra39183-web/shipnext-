-- AlterTable
ALTER TABLE "WalletRechargeRequest" ADD COLUMN     "proofAuthTag" TEXT,
ADD COLUMN     "proofEncryptedData" BYTEA,
ADD COLUMN     "proofEncryptionIv" TEXT,
ADD COLUMN     "proofFileSize" INTEGER,
ADD COLUMN     "proofMimeType" TEXT,
ADD COLUMN     "proofOriginalName" TEXT;
