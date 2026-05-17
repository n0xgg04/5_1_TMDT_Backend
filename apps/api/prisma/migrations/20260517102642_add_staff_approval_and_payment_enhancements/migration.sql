-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('FULL', 'DEPOSIT', 'BALANCE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BookingStatus" ADD VALUE 'PENDING_APPROVAL';
ALTER TYPE "BookingStatus" ADD VALUE 'REJECTED';

-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'BANK_TRANSFER';

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "adults" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "checkInTime" TEXT DEFAULT '14:00',
ADD COLUMN     "checkOutTime" TEXT DEFAULT '12:00',
ADD COLUMN     "children" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rejectedReason" TEXT,
ADD COLUMN     "specialRequests" TEXT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "paymentType" "PaymentType" NOT NULL DEFAULT 'FULL',
ADD COLUMN     "receiptImageUrl" TEXT;

-- CreateTable
CREATE TABLE "payment_method_infos" (
    "id" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountHolder" TEXT NOT NULL,
    "branch" TEXT,
    "qrImageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_method_infos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_attachments" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'receipt',
    "fileUrl" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bookings_status_approvedAt_idx" ON "bookings"("status", "approvedAt");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_attachments" ADD CONSTRAINT "booking_attachments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
