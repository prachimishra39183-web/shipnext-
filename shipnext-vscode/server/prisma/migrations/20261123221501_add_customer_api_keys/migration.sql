-- CreateTable
CREATE TABLE "CustomerApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "lastFour" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "CustomerApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerApiKey_keyHash_key" ON "CustomerApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "CustomerApiKey_userId_idx" ON "CustomerApiKey"("userId");

-- CreateIndex
CREATE INDEX "CustomerApiKey_keyPrefix_idx" ON "CustomerApiKey"("keyPrefix");

-- AddForeignKey
ALTER TABLE "CustomerApiKey" ADD CONSTRAINT "CustomerApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
