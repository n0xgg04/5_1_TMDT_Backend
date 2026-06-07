-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('PENDING', 'PAID', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TxnMatchStatus" AS ENUM ('MATCHED', 'MISMATCH', 'UNMATCHED', 'LATE_PAYMENT');

-- CreateTable
CREATE TABLE "bills" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "paymentCode" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "BillStatus" NOT NULL DEFAULT 'PENDING',
    "paymentDeadline" TIMESTAMP(3),
    "accountNumber" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountHolder" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_transactions" (
    "id" TEXT NOT NULL,
    "gatewayTransactionId" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "subAccount" TEXT,
    "code" TEXT,
    "content" TEXT NOT NULL,
    "transferType" TEXT NOT NULL,
    "description" TEXT,
    "transferAmount" INTEGER NOT NULL,
    "accumulated" INTEGER NOT NULL DEFAULT 0,
    "referenceCode" TEXT,
    "rawPayload" JSONB NOT NULL,
    "matchStatus" "TxnMatchStatus" NOT NULL DEFAULT 'UNMATCHED',
    "matchedBillId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bills_bookingId_key" ON "bills"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "bills_paymentCode_key" ON "bills"("paymentCode");

-- CreateIndex
CREATE UNIQUE INDEX "bank_transactions_gatewayTransactionId_key" ON "bank_transactions"("gatewayTransactionId");

-- CreateIndex
CREATE INDEX "bank_transactions_matchStatus_createdAt_idx" ON "bank_transactions"("matchStatus", "createdAt");

-- CreateIndex
CREATE INDEX "bank_transactions_matchedBillId_idx" ON "bank_transactions"("matchedBillId");

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_matchedBillId_fkey" FOREIGN KEY ("matchedBillId") REFERENCES "bills"("id") ON DELETE SET NULL ON UPDATE CASCADE;
