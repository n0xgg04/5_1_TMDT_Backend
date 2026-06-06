-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "images" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "room_types" ADD COLUMN     "distanceToCenter" TEXT,
ADD COLUMN     "faqs" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "nearbyPoints" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "numFloors" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "policies" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "popularFacilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "starRating" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "totalRooms" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "wishlists" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "roomTypeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wishlists_sessionId_idx" ON "wishlists"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "wishlists_userId_roomTypeId_key" ON "wishlists"("userId", "roomTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "wishlists_sessionId_roomTypeId_key" ON "wishlists"("sessionId", "roomTypeId");

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
