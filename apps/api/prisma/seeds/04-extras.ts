import { PrismaClient, BillStatus, TxnMatchStatus, type User, type RoomType } from "@prisma/client";

export async function seedExtras(
  prisma: PrismaClient,
  customers: User[],
  receptionists: User[],
  roomTypes: { standard: RoomType; deluxe: RoomType; suite: RoomType },
  bookingIds: string[],
) {
  // ── Coupons (3+ percentage, 3+ fixed) ──
  const now = new Date();
  const nextQuarter = new Date(now); nextQuarter.setMonth(nextQuarter.getMonth() + 3);
  const nextMonth = new Date(now); nextMonth.setMonth(nextMonth.getMonth() + 1);

  const coupons = [
    { code: "SUMMER2026", type: "percentage", value: 15, minAmount: 1000000, maxDiscount: 300000, usageLimit: 100, startDate: now, endDate: nextQuarter },
    { code: "WELCOME100", type: "fixed", value: 100000, minAmount: 500000, maxDiscount: null as any, usageLimit: 50, startDate: now, endDate: nextQuarter },
    { code: "FLASH50", type: "percentage", value: 50, minAmount: 2000000, maxDiscount: 500000, usageLimit: 20, startDate: now, endDate: nextMonth },
    { code: "WEEKEND20", type: "percentage", value: 20, minAmount: 1500000, maxDiscount: 400000, usageLimit: 200, startDate: now, endDate: nextQuarter },
    { code: "VIP30", type: "percentage", value: 30, minAmount: 2000000, maxDiscount: 600000, usageLimit: 30, startDate: now, endDate: nextQuarter },
    { code: "SAVE200K", type: "fixed", value: 200000, minAmount: 1000000, maxDiscount: null as any, usageLimit: 40, startDate: now, endDate: nextQuarter },
    { code: "NEWYEAR25", type: "percentage", value: 25, minAmount: 3000000, maxDiscount: 750000, usageLimit: 25, startDate: now, endDate: nextQuarter },
    { code: "FIXED150", type: "fixed", value: 150000, minAmount: 800000, maxDiscount: null as any, usageLimit: 60, startDate: now, endDate: nextMonth },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: { code: c.code, type: c.type, value: c.value, minAmount: c.minAmount, maxDiscount: c.maxDiscount, usageLimit: c.usageLimit, startDate: c.startDate, endDate: c.endDate, isActive: true },
    });
  }

  // ── UserCoupons (at least 3, assign coupons to customers) ──
  const allCoupons = await prisma.coupon.findMany();
  for (let i = 0; i < Math.min(customers.length * 2, allCoupons.length * 2); i++) {
    const uid = customers[i % customers.length].id;
    const cid = allCoupons[i % allCoupons.length].id;
    await prisma.userCoupon.upsert({
      where: { userId_couponId: { userId: uid, couponId: cid } },
      update: {},
      create: { userId: uid, couponId: cid, isUsed: i % 3 === 0, usedAt: i % 3 === 0 ? new Date() : null },
    });
  }

  // ── FlashSales (at least 3) ──
  const std = roomTypes.standard.id;
  const dlx = roomTypes.deluxe.id;
  const ste = roomTypes.suite.id;
  const flashSales = [
    { roomTypeId: std, discount: 30, startDate: now, endDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), quantity: 10 },
    { roomTypeId: dlx, discount: 25, startDate: now, endDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), quantity: 8 },
    { roomTypeId: ste, discount: 20, startDate: now, endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), quantity: 5 },
    { roomTypeId: null, discount: 15, startDate: now, endDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), quantity: 15 },
    { roomTypeId: std, discount: 40, startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), endDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), quantity: 12 },
    { roomTypeId: dlx, discount: 35, startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), endDate: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000), quantity: 6 },
  ];

  for (const fs of flashSales) {
    await prisma.flashSale.create({ data: fs });
  }

  // ── Wishlist (at least 3 per variant) ──
  for (let i = 0; i < customers.length; i++) {
    for (let j = 0; j < 3; j++) {
      const rt = j === 0 ? roomTypes.standard.id : j === 1 ? roomTypes.deluxe.id : roomTypes.suite.id;
      await prisma.wishlist.upsert({
        where: { userId_roomTypeId: { userId: customers[i].id, roomTypeId: rt } },
        update: {},
        create: { userId: customers[i].id, roomTypeId: rt },
      });
    }
  }
  // Also anonymous wishlists
  for (let j = 0; j < 3; j++) {
    const rt = j === 0 ? roomTypes.standard.id : j === 1 ? roomTypes.deluxe.id : roomTypes.suite.id;
    await prisma.wishlist.upsert({
      where: { sessionId_roomTypeId: { sessionId: `anon-session-${j + 1}`, roomTypeId: rt } },
      update: {},
      create: { sessionId: `anon-session-${j + 1}`, roomTypeId: rt },
    });
  }

  // ── PaymentMethodInfo (at least 3) ──
  const pmInfos = [
    { id: "payment-method-1", bankName: "Vietcombank", accountNumber: "1234567890123", accountHolder: "Sapphire Stay Hotel", branch: "Hà Nội", isActive: true },
    { id: "payment-method-2", bankName: "Techcombank", accountNumber: "9876543210987", accountHolder: "Sapphire Stay Hotel", branch: "TP. Hồ Chí Minh", isActive: true },
    { id: "payment-method-3", bankName: "BIDV", accountNumber: "5678901234567", accountHolder: "Sapphire Stay Hotel", branch: "Đà Nẵng", isActive: true },
    { id: "payment-method-4", bankName: "Agribank", accountNumber: "3456789012345", accountHolder: "Sapphire Stay Hotel", branch: "Nha Trang", isActive: true },
  ];
  for (const pi of pmInfos) {
    await prisma.paymentMethodInfo.upsert({ where: { id: pi.id }, update: {}, create: pi });
  }

  // ── UserPaymentMethod (at least 3 per type - VISA, card, bank) ──
  const upmTypes = [
    { type: "visa", labelPrefix: "Thẻ Visa", detailsTemplate: (i: number) => ({ cardLast4: `42${44 + i}`, expiry: "12/28" }) },
    { type: "bank_transfer", labelPrefix: "Tài khoản ngân hàng", detailsTemplate: (i: number) => ({ bankName: "Vietcombank", accountLast4: `78${90 + i}` }) },
    { type: "shopeepay", labelPrefix: "ShopeePay", detailsTemplate: (i: number) => ({ accountId: `sp${1000 + i}` }) },
    { type: "momo", labelPrefix: "Ví MoMo", detailsTemplate: (i: number) => ({ phoneLast4: `09${100 + i}` }) },
  ];
  for (let i = 0; i < customers.length; i++) {
    const t = upmTypes[i % upmTypes.length];
    await prisma.userPaymentMethod.create({
      data: { userId: customers[i].id, type: t.type, label: `${t.labelPrefix} ${i + 1}`, details: t.detailsTemplate(i), isDefault: i === 0, isActive: true },
    });
  }
  // Extra to have 3+ per type
  for (let t = 0; t < upmTypes.length; t++) {
    for (let j = 0; j < 2; j++) {
      await prisma.userPaymentMethod.create({
        data: { userId: customers[(t + j) % customers.length].id, type: upmTypes[t].type, label: `${upmTypes[t].labelPrefix} Extra ${j + 1}`, details: upmTypes[t].detailsTemplate(j + 10), isDefault: false, isActive: true },
      });
    }
  }

  // ── Bills (at least 3 per status) ──
  const billData: { bookingIdx: number; status: BillStatus; amount: number; bankName: string; accountNumber: string; accountHolder: string }[] = [
    { bookingIdx: 0, status: BillStatus.PENDING, amount: 1600000, bankName: "Vietcombank", accountNumber: "1234567890123", accountHolder: "Sapphire Stay Hotel" },
    { bookingIdx: 1, status: BillStatus.PENDING, amount: 3000000, bankName: "Techcombank", accountNumber: "9876543210987", accountHolder: "Sapphire Stay Hotel" },
    { bookingIdx: 2, status: BillStatus.PENDING, amount: 800000, bankName: "BIDV", accountNumber: "5678901234567", accountHolder: "Sapphire Stay Hotel" },
    { bookingIdx: 10, status: BillStatus.PAID, amount: 1600000, bankName: "Vietcombank", accountNumber: "1234567890123", accountHolder: "Sapphire Stay Hotel" },
    { bookingIdx: 11, status: BillStatus.PAID, amount: 3000000, bankName: "Techcombank", accountNumber: "9876543210987", accountHolder: "Sapphire Stay Hotel" },
    { bookingIdx: 12, status: BillStatus.PAID, amount: 1500000, bankName: "BIDV", accountNumber: "5678901234567", accountHolder: "Sapphire Stay Hotel" },
    { bookingIdx: 13, status: BillStatus.CANCELLED, amount: 3200000, bankName: "Vietcombank", accountNumber: "1234567890123", accountHolder: "Sapphire Stay Hotel" },
    { bookingIdx: 14, status: BillStatus.CANCELLED, amount: 800000, bankName: "Agribank", accountNumber: "3456789012345", accountHolder: "Sapphire Stay Hotel" },
    { bookingIdx: 15, status: BillStatus.CANCELLED, amount: 1800000, bankName: "Techcombank", accountNumber: "9876543210987", accountHolder: "Sapphire Stay Hotel" },
    { bookingIdx: 20, status: BillStatus.EXPIRED, amount: 5000000, bankName: "Vietcombank", accountNumber: "1234567890123", accountHolder: "Sapphire Stay Hotel" },
    { bookingIdx: 21, status: BillStatus.EXPIRED, amount: 1600000, bankName: "BIDV", accountNumber: "5678901234567", accountHolder: "Sapphire Stay Hotel" },
    { bookingIdx: 22, status: BillStatus.EXPIRED, amount: 3000000, bankName: "Agribank", accountNumber: "3456789012345", accountHolder: "Sapphire Stay Hotel" },
  ];

  const billRecords: { id: string; status: BillStatus }[] = [];
  for (const b of billData) {
    const bkId = bookingIds[b.bookingIdx % bookingIds.length];
    try {
      const bill = await prisma.bill.create({
        data: {
          bookingId: bkId,
          paymentCode: `BILL-${bkId.slice(0, 8).toUpperCase()}`,
          amount: b.amount,
          status: b.status,
          paymentDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
          accountNumber: b.accountNumber,
          bankName: b.bankName,
          accountHolder: b.accountHolder,
          paidAt: b.status === BillStatus.PAID ? new Date() : null,
        },
      });
      billRecords.push({ id: bill.id, status: b.status });
    } catch {
      // Skip if unique constraint fails (booking already has a bill)
    }
  }

  // ── BankTransactions (at least 3 per match status) ──
  const matchedBills = billRecords.filter(b => b.status === BillStatus.PAID);
  const txnStatuses = [
    { matchStatus: TxnMatchStatus.MATCHED, billIdx: 0 },
    { matchStatus: TxnMatchStatus.MATCHED, billIdx: 1 },
    { matchStatus: TxnMatchStatus.MATCHED, billIdx: 2 },
    { matchStatus: TxnMatchStatus.MISMATCH, billIdx: null as any },
    { matchStatus: TxnMatchStatus.MISMATCH, billIdx: null as any },
    { matchStatus: TxnMatchStatus.MISMATCH, billIdx: null as any },
    { matchStatus: TxnMatchStatus.MISMATCH, billIdx: null as any },
    { matchStatus: TxnMatchStatus.UNMATCHED, billIdx: null as any },
    { matchStatus: TxnMatchStatus.UNMATCHED, billIdx: null as any },
    { matchStatus: TxnMatchStatus.UNMATCHED, billIdx: null as any },
    { matchStatus: TxnMatchStatus.UNMATCHED, billIdx: null as any },
    { matchStatus: TxnMatchStatus.LATE_PAYMENT, billIdx: null as any },
    { matchStatus: TxnMatchStatus.LATE_PAYMENT, billIdx: null as any },
    { matchStatus: TxnMatchStatus.LATE_PAYMENT, billIdx: null as any },
    { matchStatus: TxnMatchStatus.LATE_PAYMENT, billIdx: null as any },
  ];

  for (let i = 0; i < txnStatuses.length; i++) {
    const ts = txnStatuses[i];
    const matchedBillId = ts.matchStatus === TxnMatchStatus.MATCHED ? matchedBills[ts.billIdx]?.id : null;
    await prisma.bankTransaction.create({
      data: {
        gatewayTransactionId: `GTXN-${Date.now()}-${i}`,
        gateway: "SEPAY",
        transactionDate: new Date(Date.now() - i * 3600000),
        accountNumber: "1234567890123",
        content: `Thanh toan booking ${i + 1}`,
        transferType: i % 2 === 0 ? "in" : "out",
        transferAmount: 1000000 + i * 500000,
        rawPayload: { bank: "Vietcombank", ref: `REF-${i}` },
        matchStatus: ts.matchStatus as TxnMatchStatus,
        matchedBillId,
      },
    });
  }

  // ── RefundRequests (at least 3) ──
  // Find some CANCELLED bookings for refunds
  const cancelledBookings = await prisma.booking.findMany({
    where: { status: "CANCELLED" as any },
    take: 4,
  });
  const refundStatuses = ["pending", "pending", "approved", "rejected"];
  for (let i = 0; i < cancelledBookings.length; i++) {
    try {
      await prisma.refundRequest.create({
        data: {
          bookingId: cancelledBookings[i].id,
          customerId: cancelledBookings[i].customerId,
          accountHolder: `Nguyen Van ${String.fromCharCode(65 + i)}`,
          accountNumber: `98765${4000 + i}`,
          bankName: ["Vietcombank", "Techcombank", "BIDV", "Agribank"][i],
          bankBranch: i === 0 ? "Hà Nội" : i === 1 ? "TP.HCM" : null,
          refundAmount: cancelledBookings[i].totalAmount as any,
          refundPercent: 100,
          notes: i === 3 ? "Không đủ điều kiện hoàn tiền" : "Yêu cầu hoàn tiền đặt phòng",
          status: refundStatuses[i],
          processedAt: i >= 2 ? new Date() : null,
        },
      });
    } catch {
      // Skip if booking already has refund
    }
  }

  // ── Conversations & Messages (at least 3 open, 3 closed) ──
  const convConfigs = [
    { status: "open", subject: "Hỏi về phòng Deluxe" },
    { status: "open", subject: "Yêu cầu đổi phòng" },
    { status: "open", subject: "Hỏi về dịch vụ đưa đón" },
    { status: "open", subject: "Thắc mắc về giá phòng" },
    { status: "closed", subject: "Khiếu nại về phòng Standard" },
    { status: "closed", subject: "Xác nhận thanh toán" },
    { status: "closed", subject: "Yêu cầu hóa đơn đỏ" },
    { status: "pending", subject: "Hỏi về tiện nghi suite" },
    { status: "pending", subject: "Gia hạn thời gian lưu trú" },
  ];

  const messageTemplates: Record<string, string[]> = {
    open: ["Xin chào, tôi muốn biết thêm chi tiết về phòng này.", "Phòng có ban công không ạ?", "Cảm ơn, tôi sẽ đặt phòng."],
    closed: ["Tôi không hài lòng về chất lượng phòng.", "Cảm ơn đã xử lý, vấn đề đã được giải quyết.", "Tạm biệt!"],
    pending: ["Xin hỏi phòng suite có bồn tắm jacuzzi không?", "Cảm ơn thông tin.", "Tôi muốn gia hạn thêm 1 đêm."],
  };

  for (let i = 0; i < convConfigs.length; i++) {
    const cfg = convConfigs[i];
    const conv = await prisma.conversation.create({
      data: {
        customerId: customers[i % customers.length].id,
        staffId: i % 2 === 0 ? receptionists[i % receptionists.length].id : null,
        bookingId: bookingIds[i % bookingIds.length],
        subject: cfg.subject,
        status: cfg.status,
      },
    });

    const msgs = messageTemplates[cfg.status] || messageTemplates["open"];
    for (let m = 0; m < msgs.length; m++) {
      await prisma.message.create({
        data: {
          conversationId: conv.id,
          senderId: m % 2 === 0 ? customers[i % customers.length].id : (receptionists[i % receptionists.length]?.id || customers[0].id),
          content: msgs[m],
          isRead: m < msgs.length - 1,
          createdAt: new Date(Date.now() - (msgs.length - m) * 3600000),
        },
      });
    }
  }

  // ── Notifications (at least 3 per type) ──
  const notifTypes = [
    "booking_confirmation", "booking_confirmation", "booking_confirmation", "booking_confirmation",
    "payment_reminder", "payment_reminder", "payment_reminder",
    "payment_success", "payment_success", "payment_success", "payment_success",
    "checkin_reminder", "checkin_reminder", "checkin_reminder",
    "checkout_reminder", "checkout_reminder", "checkout_reminder",
    "booking_cancelled", "booking_cancelled", "booking_cancelled",
    "review_request", "review_request", "review_request",
    "promotion", "promotion", "promotion",
  ];

  for (let i = 0; i < notifTypes.length; i++) {
    const c = customers[i % customers.length];
    await prisma.notification.create({
      data: {
        recipientId: c.id,
        email: c.email,
        type: notifTypes[i],
        templateData: { bookingCode: `BK-${i}`, hotelName: "Sapphire Stay" },
        sentAt: new Date(Date.now() - i * 3600000),
        readAt: i % 2 === 0 ? new Date() : null,
        failed: false,
        retries: 0,
      },
    });
  }
  // Failed notifications
  for (let i = 0; i < 3; i++) {
    const c = customers[i % customers.length];
    await prisma.notification.create({
      data: {
        recipientId: c.id,
        email: c.email,
        type: "payment_reminder",
        templateData: { bookingCode: `BK-FAIL-${i}` },
        failed: true,
        failReason: "SMTP connection timeout",
        retries: 3,
      },
    });
  }

  console.log(`Seeded: ${coupons.length} coupons, ${flashSales.length} flashsales, wishlists, ${pmInfos.length} payment methods, user payment methods`);
  console.log(`Seeded: ${billData.length} bills, ${txnStatuses.length} bank transactions, refunds, ${convConfigs.length} conversations with messages, ${notifTypes.length + 3} notifications`);
}
