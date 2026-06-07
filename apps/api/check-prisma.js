const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const hasRefund = typeof p.refundRequest !== "undefined";
console.log("RefundRequest exists on Prisma client:", hasRefund);

if (hasRefund) {
  console.log("Available methods:", Object.keys(p.refundRequest));
} else {
  console.log("Client DOES NOT have RefundRequest yet - DLL was not replaced!");
  console.log("You MUST: 1) STOP the backend  2) run db:generate  3) START the backend");
}

p.$disconnect();
