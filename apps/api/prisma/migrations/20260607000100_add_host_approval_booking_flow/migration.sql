-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'PENDING_HOST_APPROVAL';

-- AlterTable
ALTER TABLE "bookings"
ADD COLUMN "approvalDeadline" TIMESTAMP(3),
ALTER COLUMN "paymentDeadline" DROP NOT NULL;

-- AlterTable
ALTER TABLE "notifications"
ADD COLUMN "readAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "bookings_approvalDeadline_status_idx" ON "bookings"("approvalDeadline", "status");

-- CreateIndex
CREATE INDEX "notifications_recipientId_readAt_createdAt_idx" ON "notifications"("recipientId", "readAt", "createdAt");
