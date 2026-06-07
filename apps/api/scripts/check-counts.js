const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function run() {
  const counts = {
    users: await p.user.count(),
    hotels: await p.hotelBranch.count(),
    roomTypes: await p.roomType.count(),
    rooms: await p.room.count(),
    pricingRules: await p.pricingRule.count(),
    bookings: await p.booking.count(),
    payments: await p.payment.count(),
    reviews: await p.review.count(),
    bookingAddons: await p.bookingAddon.count(),
    bookingAttachments: await p.bookingAttachment.count(),
    coupons: await p.coupon.count(),
    userCoupons: await p.userCoupon.count(),
    flashSales: await p.flashSale.count(),
    wishlists: await p.wishlist.count(),
    paymentMethodInfos: await p.paymentMethodInfo.count(),
    userPaymentMethods: await p.userPaymentMethod.count(),
    bills: await p.bill.count(),
    bankTransactions: await p.bankTransaction.count(),
    refundRequests: await p.refundRequest.count(),
    conversations: await p.conversation.count(),
    messages: await p.message.count(),
    notifications: await p.notification.count(),
  };
  console.log("=== Database counts ===");
  for (const [key, val] of Object.entries(counts)) {
    console.log(`  ${key}: ${val}`);
  }
  await p.$disconnect();
}

run();
