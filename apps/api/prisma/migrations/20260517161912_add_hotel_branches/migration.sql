-- CreateTable
CREATE TABLE "hotel_branches" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hotel_branches_pkey" PRIMARY KEY ("id")
);

-- Insert default branch for existing rooms
INSERT INTO "hotel_branches" ("id", "name", "province", "city", "address", "phone", "updatedAt")
VALUES ('branch-default', 'Sapphire Stay Hà Nội', 'Hà Nội', 'Hà Nội', '123 Phố Huế, Hai Bà Trưng', '0241234567', CURRENT_TIMESTAMP);

-- AlterTable
ALTER TABLE "rooms" ADD COLUMN "branchId" TEXT NOT NULL DEFAULT 'branch-default';

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "hotel_branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
