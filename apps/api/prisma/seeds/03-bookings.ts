import { PrismaClient, BookingStatus, PaymentMethod, PaymentType, PaymentStatus, type User, type Room, type RoomType } from "@prisma/client";

interface BookingsResult {
  bookingIds: string[];
}

interface BookingConfig {
  checkInDaysOffset: number;
  nights: number;
  status: BookingStatus;
  price: number;
  payMethod: PaymentMethod | null;
  payType: PaymentType;
  payStatus: PaymentStatus;
  reviewRating?: number;
  reviewComment?: string;
}

const reviewTexts: Record<number, string[]> = {
  1: ["Thất vọng! Phòng bẩn, khăn tắm có mùi.", "Nhân viên thái độ kém. Không quay lại.", "Máy lạnh hỏng, không được hỗ trợ. Rất tệ."],
  2: ["Điều hòa kém, cách âm không tốt.", "Nước nóng yếu, tắm không thoải mái.", "Ồn ào từ đường phố, khó ngủ."],
  3: ["Phòng tạm ổn, giá hợp lý.", "Vị trí thuận tiện, nhưng phòng hơi cũ.", "Dịch vụ bình thường, không có gì nổi bật."],
  4: ["Phòng sạch sẽ, nhân viên thân thiện.", "Tổng thể tốt, tiện nghi đầy đủ.", "Vị trí đẹp, view tuyệt vời. Giá hợp lý."],
  5: ["Tuyệt vời! Mọi thứ hoàn hảo từ A-Z.", "Kỳ nghỉ tuyệt vời, sẽ quay lại nhiều lần!", "Phòng Suite xuất sắc, butler service chu đáo."],
};

export async function seedBookings(
  prisma: PrismaClient,
  customers: User[],
  rooms: Room[],
  admins: User[],
  roomTypes: { standard: RoomType; deluxe: RoomType; suite: RoomType },
): Promise<BookingsResult> {
  const now = new Date();
  const d = (offset: number) => { const dt = new Date(now); dt.setDate(dt.getDate() + offset); return dt; };
  const roomForIdx = (i: number) => rooms[i % rooms.length];
  const customerForIdx = (i: number) => customers[i % customers.length];

  const bookingConfigs: BookingConfig[] = [
    // --- PENDING_HOST_APPROVAL (3) ---
    { checkInDaysOffset: 30, nights: 2, status: BookingStatus.PENDING_HOST_APPROVAL, price: 1600000, payMethod: PaymentMethod.BANK_TRANSFER, payType: PaymentType.FULL, payStatus: PaymentStatus.PENDING },
    { checkInDaysOffset: 31, nights: 3, status: BookingStatus.PENDING_HOST_APPROVAL, price: 3000000, payMethod: PaymentMethod.BANK_TRANSFER, payType: PaymentType.DEPOSIT, payStatus: PaymentStatus.PENDING },
    { checkInDaysOffset: 32, nights: 2, status: BookingStatus.PENDING_HOST_APPROVAL, price: 800000, payMethod: PaymentMethod.CASH, payType: PaymentType.FULL, payStatus: PaymentStatus.PENDING },

    // --- PENDING_PAYMENT (3) ---
    { checkInDaysOffset: 14, nights: 2, status: BookingStatus.PENDING_PAYMENT, price: 1600000, payMethod: PaymentMethod.VNPAY, payType: PaymentType.FULL, payStatus: PaymentStatus.PENDING },
    { checkInDaysOffset: 15, nights: 3, status: BookingStatus.PENDING_PAYMENT, price: 3000000, payMethod: PaymentMethod.MOMO, payType: PaymentType.FULL, payStatus: PaymentStatus.PENDING },
    { checkInDaysOffset: 16, nights: 1, status: BookingStatus.PENDING_PAYMENT, price: 800000, payMethod: PaymentMethod.VISA, payType: PaymentType.FULL, payStatus: PaymentStatus.PENDING },

    // --- PAYING (3) ---
    { checkInDaysOffset: 18, nights: 2, status: BookingStatus.PAYING, price: 1600000, payMethod: PaymentMethod.VNPAY, payType: PaymentType.FULL, payStatus: PaymentStatus.PROCESSING },
    { checkInDaysOffset: 19, nights: 3, status: BookingStatus.PAYING, price: 3000000, payMethod: PaymentMethod.MOMO, payType: PaymentType.DEPOSIT, payStatus: PaymentStatus.PROCESSING },
    { checkInDaysOffset: 20, nights: 2, status: BookingStatus.PAYING, price: 800000, payMethod: PaymentMethod.SHOPEEPAY, payType: PaymentType.FULL, payStatus: PaymentStatus.PROCESSING },

    // --- PENDING_APPROVAL (3) ---
    { checkInDaysOffset: 22, nights: 3, status: BookingStatus.PENDING_APPROVAL, price: 4500000, payMethod: PaymentMethod.BANK_TRANSFER, payType: PaymentType.FULL, payStatus: PaymentStatus.PENDING },
    { checkInDaysOffset: 23, nights: 2, status: BookingStatus.PENDING_APPROVAL, price: 1500000, payMethod: PaymentMethod.BANK_TRANSFER, payType: PaymentType.DEPOSIT, payStatus: PaymentStatus.PENDING },
    { checkInDaysOffset: 24, nights: 1, status: BookingStatus.PENDING_APPROVAL, price: 3000000, payMethod: PaymentMethod.CASH, payType: PaymentType.FULL, payStatus: PaymentStatus.PENDING },

    // --- CONFIRMED (4) ---
    { checkInDaysOffset: 3, nights: 3, status: BookingStatus.CONFIRMED, price: 4500000, payMethod: PaymentMethod.VNPAY, payType: PaymentType.FULL, payStatus: PaymentStatus.COMPLETED },
    { checkInDaysOffset: 4, nights: 2, status: BookingStatus.CONFIRMED, price: 1600000, payMethod: PaymentMethod.MOMO, payType: PaymentType.FULL, payStatus: PaymentStatus.COMPLETED },
    { checkInDaysOffset: 5, nights: 2, status: BookingStatus.CONFIRMED, price: 1500000, payMethod: PaymentMethod.VISA, payType: PaymentType.DEPOSIT, payStatus: PaymentStatus.COMPLETED },
    { checkInDaysOffset: 6, nights: 4, status: BookingStatus.CONFIRMED, price: 6000000, payMethod: PaymentMethod.VNPAY, payType: PaymentType.BALANCE, payStatus: PaymentStatus.COMPLETED },

    // --- CHECKED_IN (4) ---
    { checkInDaysOffset: -2, nights: 5, status: BookingStatus.CHECKED_IN, price: 4000000, payMethod: PaymentMethod.VNPAY, payType: PaymentType.FULL, payStatus: PaymentStatus.COMPLETED },
    { checkInDaysOffset: -1, nights: 4, status: BookingStatus.CHECKED_IN, price: 4500000, payMethod: PaymentMethod.MOMO, payType: PaymentType.DEPOSIT, payStatus: PaymentStatus.COMPLETED },
    { checkInDaysOffset: -3, nights: 3, status: BookingStatus.CHECKED_IN, price: 2400000, payMethod: PaymentMethod.VISA, payType: PaymentType.FULL, payStatus: PaymentStatus.COMPLETED },
    { checkInDaysOffset: -4, nights: 6, status: BookingStatus.CHECKED_IN, price: 5400000, payMethod: PaymentMethod.SHOPEEPAY, payType: PaymentType.BALANCE, payStatus: PaymentStatus.COMPLETED },

    // --- CHECKED_OUT (15) --- covering all payment methods and statuses, plus all review ratings
    { checkInDaysOffset: -10, nights: 2, status: BookingStatus.CHECKED_OUT, price: 1600000, payMethod: PaymentMethod.VNPAY, payType: PaymentType.FULL, payStatus: PaymentStatus.COMPLETED, reviewRating: 5, reviewComment: reviewTexts[5][0] },
    { checkInDaysOffset: -11, nights: 3, status: BookingStatus.CHECKED_OUT, price: 3000000, payMethod: PaymentMethod.MOMO, payType: PaymentType.FULL, payStatus: PaymentStatus.COMPLETED, reviewRating: 5, reviewComment: reviewTexts[5][1] },
    { checkInDaysOffset: -12, nights: 2, status: BookingStatus.CHECKED_OUT, price: 1500000, payMethod: PaymentMethod.CASH, payType: PaymentType.FULL, payStatus: PaymentStatus.COMPLETED, reviewRating: 5, reviewComment: reviewTexts[5][2] },
    { checkInDaysOffset: -13, nights: 4, status: BookingStatus.CHECKED_OUT, price: 3200000, payMethod: PaymentMethod.BANK_TRANSFER, payType: PaymentType.FULL, payStatus: PaymentStatus.COMPLETED, reviewRating: 4, reviewComment: reviewTexts[4][0] },
    { checkInDaysOffset: -14, nights: 1, status: BookingStatus.CHECKED_OUT, price: 800000, payMethod: PaymentMethod.VISA, payType: PaymentType.FULL, payStatus: PaymentStatus.COMPLETED, reviewRating: 4, reviewComment: reviewTexts[4][1] },
    { checkInDaysOffset: -15, nights: 3, status: BookingStatus.CHECKED_OUT, price: 1800000, payMethod: PaymentMethod.SHOPEEPAY, payType: PaymentType.FULL, payStatus: PaymentStatus.COMPLETED, reviewRating: 4, reviewComment: reviewTexts[4][2] },
    { checkInDaysOffset: -16, nights: 5, status: BookingStatus.CHECKED_OUT, price: 5000000, payMethod: PaymentMethod.VNPAY, payType: PaymentType.DEPOSIT, payStatus: PaymentStatus.COMPLETED, reviewRating: 3, reviewComment: reviewTexts[3][0] },
    { checkInDaysOffset: -17, nights: 2, status: BookingStatus.CHECKED_OUT, price: 1600000, payMethod: PaymentMethod.MOMO, payType: PaymentType.DEPOSIT, payStatus: PaymentStatus.COMPLETED, reviewRating: 3, reviewComment: reviewTexts[3][1] },
    { checkInDaysOffset: -18, nights: 3, status: BookingStatus.CHECKED_OUT, price: 3000000, payMethod: PaymentMethod.BANK_TRANSFER, payType: PaymentType.DEPOSIT, payStatus: PaymentStatus.COMPLETED, reviewRating: 3, reviewComment: reviewTexts[3][2] },
    { checkInDaysOffset: -20, nights: 2, status: BookingStatus.CHECKED_OUT, price: 1500000, payMethod: PaymentMethod.VNPAY, payType: PaymentType.BALANCE, payStatus: PaymentStatus.COMPLETED, reviewRating: 2, reviewComment: reviewTexts[2][0] },
    { checkInDaysOffset: -21, nights: 3, status: BookingStatus.CHECKED_OUT, price: 2200000, payMethod: PaymentMethod.CASH, payType: PaymentType.BALANCE, payStatus: PaymentStatus.COMPLETED, reviewRating: 2, reviewComment: reviewTexts[2][1] },
    { checkInDaysOffset: -22, nights: 4, status: BookingStatus.CHECKED_OUT, price: 3600000, payMethod: PaymentMethod.VISA, payType: PaymentType.BALANCE, payStatus: PaymentStatus.REFUNDED, reviewRating: 2, reviewComment: reviewTexts[2][2] },
    { checkInDaysOffset: -25, nights: 2, status: BookingStatus.CHECKED_OUT, price: 800000, payMethod: PaymentMethod.VNPAY, payType: PaymentType.FULL, payStatus: PaymentStatus.REFUNDED, reviewRating: 1, reviewComment: reviewTexts[1][0] },
    { checkInDaysOffset: -26, nights: 3, status: BookingStatus.CHECKED_OUT, price: 4500000, payMethod: PaymentMethod.MOMO, payType: PaymentType.FULL, payStatus: PaymentStatus.REFUNDED, reviewRating: 1, reviewComment: reviewTexts[1][1] },
    { checkInDaysOffset: -27, nights: 2, status: BookingStatus.CHECKED_OUT, price: 1500000, payMethod: PaymentMethod.SHOPEEPAY, payType: PaymentType.FULL, payStatus: PaymentStatus.FAILED, reviewRating: 1, reviewComment: reviewTexts[1][2] },

    // --- CANCELLED (4) ---
    { checkInDaysOffset: -60, nights: 3, status: BookingStatus.CANCELLED, price: 3000000, payMethod: PaymentMethod.VNPAY, payType: PaymentType.FULL, payStatus: PaymentStatus.REFUNDED },
    { checkInDaysOffset: -61, nights: 2, status: BookingStatus.CANCELLED, price: 800000, payMethod: PaymentMethod.MOMO, payType: PaymentType.FULL, payStatus: PaymentStatus.REFUNDED },
    { checkInDaysOffset: -62, nights: 1, status: BookingStatus.CANCELLED, price: 3000000, payMethod: PaymentMethod.VNPAY, payType: PaymentType.FULL, payStatus: PaymentStatus.REFUNDED },
    { checkInDaysOffset: -63, nights: 2, status: BookingStatus.CANCELLED, price: 1500000, payMethod: null as any, payType: PaymentType.FULL, payStatus: PaymentStatus.FAILED },

    // --- REJECTED (3) ---
    { checkInDaysOffset: 25, nights: 2, status: BookingStatus.REJECTED, price: 800000, payMethod: PaymentMethod.BANK_TRANSFER, payType: PaymentType.FULL, payStatus: PaymentStatus.FAILED },
    { checkInDaysOffset: 26, nights: 3, status: BookingStatus.REJECTED, price: 2200000, payMethod: PaymentMethod.CASH, payType: PaymentType.FULL, payStatus: PaymentStatus.FAILED },
    { checkInDaysOffset: 27, nights: 2, status: BookingStatus.REJECTED, price: 1600000, payMethod: null as any, payType: PaymentType.FULL, payStatus: PaymentStatus.FAILED },

    // --- EXPIRED (3) ---
    { checkInDaysOffset: -80, nights: 2, status: BookingStatus.EXPIRED, price: 1600000, payMethod: PaymentMethod.VNPAY, payType: PaymentType.FULL, payStatus: PaymentStatus.FAILED },
    { checkInDaysOffset: -81, nights: 3, status: BookingStatus.EXPIRED, price: 3000000, payMethod: PaymentMethod.MOMO, payType: PaymentType.FULL, payStatus: PaymentStatus.FAILED },
    { checkInDaysOffset: -82, nights: 1, status: BookingStatus.EXPIRED, price: 800000, payMethod: null as any, payType: PaymentType.FULL, payStatus: PaymentStatus.FAILED },
  ];

  // Insert additional bookings to fill out variant coverage (e.g., more PAYING with different methods)
  bookingConfigs.push(
    // Additional PAYING for processing status coverage
    { checkInDaysOffset: 33, nights: 2, status: BookingStatus.PAYING, price: 1500000, payMethod: PaymentMethod.VISA, payType: PaymentType.FULL, payStatus: PaymentStatus.PROCESSING },
    { checkInDaysOffset: 34, nights: 3, status: BookingStatus.PAYING, price: 2200000, payMethod: PaymentMethod.BANK_TRANSFER, payType: PaymentType.FULL, payStatus: PaymentStatus.PROCESSING },
    { checkInDaysOffset: 35, nights: 1, status: BookingStatus.PAYING, price: 3000000, payMethod: PaymentMethod.CASH, payType: PaymentType.FULL, payStatus: PaymentStatus.PROCESSING },
  );

  const bookingIds: string[] = [];
  let idx = 0;

  for (const cfg of bookingConfigs) {
    const room = roomForIdx(idx);
    const customer = customerForIdx(idx);
    const checkIn = d(cfg.checkInDaysOffset);
    const checkOut = d(cfg.checkInDaysOffset + cfg.nights);
    const paymentDeadline = new Date(checkIn);
    paymentDeadline.setHours(paymentDeadline.getHours() + 1);
    const createdAt = new Date(checkIn);
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 5) - 1);

    const isCheckIn = cfg.status === BookingStatus.CHECKED_IN || cfg.status === BookingStatus.CHECKED_OUT;
    const isCheckOut = cfg.status === BookingStatus.CHECKED_OUT;

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        roomId: room.id,
        checkIn,
        checkOut,
        totalAmount: cfg.price,
        status: cfg.status as BookingStatus,
        paymentDeadline,
        checkInActual: isCheckIn ? checkIn : null,
        checkOutActual: isCheckOut ? checkOut : null,
        approvedById: cfg.status === BookingStatus.CONFIRMED ? admins[idx % admins.length].id : null,
        approvedAt: cfg.status === BookingStatus.CONFIRMED ? createdAt : null,
        rejectedReason: cfg.status === BookingStatus.REJECTED ? "Không đáp ứng yêu cầu của khách sạn" : null,
        createdAt,
        adults: 1 + (idx % 3),
        children: idx % 2,
        guestNotes: idx % 3 === 0 ? "Yêu cầu phòng yên tĩnh, không gần thang máy" : null,
        specialRequests: idx % 4 === 0 ? "Chuẩn bị hoa chào mừng" : null,
      },
    });

    bookingIds.push(booking.id);

    if (cfg.payMethod !== null) {
      const paidAt = cfg.payStatus === PaymentStatus.COMPLETED ? new Date(createdAt.getTime() + 30 * 60 * 1000) : null;
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          customerId: customer.id,
          method: cfg.payMethod as PaymentMethod,
          paymentType: cfg.payType as PaymentType,
          amount: cfg.price,
          status: cfg.payStatus as PaymentStatus,
          paidAt,
          refundedAt: cfg.payStatus === PaymentStatus.REFUNDED ? new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000) : null,
          refundAmount: cfg.payStatus === PaymentStatus.REFUNDED ? cfg.price : null,
          failureReason: cfg.payStatus === PaymentStatus.FAILED ? "Giao dịch không thành công" : null,
          gatewayTransactionId: cfg.payStatus === PaymentStatus.COMPLETED || cfg.payStatus === PaymentStatus.REFUNDED ? `TXN-${booking.bookingCode}` : null,
        },
      });
    }

    if (cfg.reviewRating && cfg.reviewComment) {
      const roomTypeId = roomForIdx(idx).roomTypeId || roomTypes.standard.id;
      await prisma.review.create({
        data: {
          bookingId: booking.id,
          customerId: customer.id,
          roomTypeId,
          rating: cfg.reviewRating,
          comment: cfg.reviewComment,
          images: [],
        },
      });
    }

    idx++;
  }

  // --- BookingAddons (at least 3 per variant) ---
  const addonServiceTypes = [
    { name: "Minibar", unitPrice: 150000 },
    { name: "Giặt ủi", unitPrice: 80000 },
    { name: "Ăn uống tại phòng", unitPrice: 200000 },
    { name: "Spa massage", unitPrice: 500000 },
    { name: "Thuê xe đạp", unitPrice: 100000 },
    { name: "Đón sân bay", unitPrice: 350000 },
  ];

  // Attach addons to CHECKED_IN and CHECKED_OUT bookings
  const activeBookings = await prisma.booking.findMany({
    where: { status: { in: [BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT] } },
    take: 18,
  });

  for (let i = 0; i < activeBookings.length; i++) {
    const svc = addonServiceTypes[i % addonServiceTypes.length];
    const qty = 1 + (i % 3);
    await prisma.bookingAddon.create({
      data: {
        bookingId: activeBookings[i].id,
        serviceName: svc.name,
        quantity: qty,
        unitPrice: svc.unitPrice,
        totalPrice: svc.unitPrice * qty,
        staffNote: i % 2 === 0 ? "Đã xác nhận bởi lễ tân" : null,
        addedBy: "receptionist1@hotel.com",
      },
    });
  }

  // --- BookingAttachments (at least 3) ---
  const attachmentTypes = ["receipt", "identity", "receipt", "other", "receipt", "receipt"];
  for (let i = 0; i < 6; i++) {
    const bk = bookingIds[i % bookingIds.length];
    await prisma.bookingAttachment.create({
      data: {
        bookingId: bk,
        type: attachmentTypes[i % attachmentTypes.length],
        fileUrl: `https://storage.example.com/attachments/${bk}/${attachmentTypes[i]}-${i + 1}.jpg`,
        uploadedAt: new Date(),
      },
    });
  }

  console.log(`Seeded: ${bookingIds.length} bookings with payments, ${activeBookings.length} addons, 6 attachments, reviews`);
  return { bookingIds };
}
