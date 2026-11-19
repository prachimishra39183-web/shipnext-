-- AlterTable
ALTER TABLE "User" ADD COLUMN     "aadhaarNumberEncrypted" TEXT,
ADD COLUMN     "accountHolderName" TEXT,
ADD COLUMN     "accountNumberEncrypted" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "branchName" TEXT,
ADD COLUMN     "gstNumberEncrypted" TEXT,
ADD COLUMN     "ifscCode" TEXT,
ADD COLUMN     "panNumberEncrypted" TEXT;
