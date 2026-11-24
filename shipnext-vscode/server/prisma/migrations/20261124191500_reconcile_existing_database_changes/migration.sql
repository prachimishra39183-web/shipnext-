CREATE TABLE "playing_with_neon" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "value" REAL,
    CONSTRAINT "playing_with_neon_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CourierPincodeServiceability"
ADD COLUMN "firstMile" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "lastMile" BOOLEAN NOT NULL DEFAULT false;