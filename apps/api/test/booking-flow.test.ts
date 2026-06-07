import "reflect-metadata";
import test from "node:test";
import assert from "node:assert/strict";
import {
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
  Role,
  RoomStatus,
} from "@prisma/client";
import { BookingsService } from "../src/bookings/bookings.service";
import { AvailabilityService } from "../src/availability/availability.service";
import { StaffController } from "../src/staff/staff.controller";
import { ROLES_KEY } from "../src/common/decorators/roles.decorator";
import { PaymentsService } from "../src/payments/payments.service";
import { CouponsService } from "../src/coupons/coupons.service";
import { NotificationsService } from "../src/notifications/notifications.service";

const HOUR = 60 * 60 * 1000;

function dateOnly(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function makeBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: "booking-1",
    bookingCode: "B001",
    customerId: "customer-1",
    roomId: "room-1",
    checkIn: new Date("2026-07-01"),
    checkOut: new Date("2026-07-03"),
    totalAmount: 1_000_000,
    discountAmount: null,
    couponCode: null,
    status: BookingStatus.PENDING_HOST_APPROVAL,
    approvalDeadline: new Date(Date.now() + 24 * HOUR),
    paymentDeadline: null,
    approvedAt: null,
    payment: null,
    ...overrides,
  };
}

function makeBookingsService({
  prisma,
  redis = {},
  events = {},
  pricing = {},
  coupons = {},
  flashSales = {},
  availability = {},
}: {
  prisma: Record<string, unknown>;
  redis?: Record<string, unknown>;
  events?: Record<string, unknown>;
  pricing?: Record<string, unknown>;
  coupons?: Record<string, unknown>;
  flashSales?: Record<string, unknown>;
  availability?: Record<string, unknown>;
}) {
  return new BookingsService(
    prisma as any,
    {
      setNx: async () => true,
      del: async () => undefined,
      ...redis,
    } as any,
    {
      emit: async () => undefined,
      ...events,
    } as any,
    {
      calculateTotalPrice: async () => 1_000_000,
      ...pricing,
    } as any,
    {
      releaseReservationForBooking: async () => undefined,
      ...coupons,
    } as any,
    {
      calculateFlashSalePrice: async (_roomTypeId: string, price: number) => ({
        flashSaleId: null,
        price,
      }),
      ...flashSales,
    } as any,
    {
      findActiveOverlap: async () => null,
      getBookedRoomIds: async () => [],
      ...availability,
    } as any,
  );
}

test("createBooking creates a host approval request with a 24h approval deadline", async () => {
  const createdBookings: any[] = [];
  const outboxEvents: any[] = [];
  const emitted: any[] = [];

  const prisma = {
    room: {
      findUnique: async () => ({
        id: "room-1",
        roomTypeId: "room-type-1",
        roomType: { id: "room-type-1", isActive: true },
      }),
    },
    booking: {
      findFirst: async () => null,
      create: async (args: any) => {
        createdBookings.push(args.data);
        return makeBooking({ ...args.data, id: "booking-1" });
      },
    },
    outboxEvent: {
      create: async (args: any) => {
        outboxEvents.push(args.data);
        return args.data;
      },
    },
  };

  const service = makeBookingsService({
    prisma,
    events: {
      emit: async (event: string, payload: object) =>
        emitted.push({ event, payload }),
    },
  });

  const before = Date.now();
  const booking = await service.createBooking("customer-1", {
    roomId: "room-1",
    checkIn: "2026-07-01",
    checkOut: "2026-07-03",
    adults: 2,
    children: 0,
    couponCode: "IGNORED_AT_REQUEST_TIME",
  });

  assert.equal(booking.status, BookingStatus.PENDING_HOST_APPROVAL);
  assert.equal(createdBookings[0].paymentDeadline, null);
  assert.equal(createdBookings[0].couponCode, undefined);
  assert.ok(createdBookings[0].approvalDeadline instanceof Date);
  assert.ok(createdBookings[0].approvalDeadline.getTime() - before > 23 * HOUR);
  assert.ok(createdBookings[0].approvalDeadline.getTime() - before <= 25 * HOUR);
  assert.equal(outboxEvents[0].eventType, "booking.request.created");
  assert.equal(emitted[0].event, "booking.request.created");
});

test("approveRequest moves a valid request to PENDING_PAYMENT with a payment deadline", async () => {
  const updates: any[] = [];
  const emitted: any[] = [];
  const booking = makeBooking({
    approvalDeadline: new Date(Date.now() + HOUR),
  });
  const prisma = {
    booking: {
      findUnique: async () => booking,
      findFirst: async () => null,
      update: async (args: any) => {
        updates.push(args.data);
        return { ...booking, ...args.data };
      },
    },
  };
  const service = makeBookingsService({
    prisma,
    events: {
      emit: async (event: string, payload: object) =>
        emitted.push({ event, payload }),
    },
  });

  await service.approveRequest("booking-1", "staff-1");

  assert.equal(updates[0].status, BookingStatus.PENDING_PAYMENT);
  assert.equal(updates[0].approvedById, "staff-1");
  assert.ok(updates[0].approvedAt instanceof Date);
  assert.ok(updates[0].paymentDeadline instanceof Date);
  assert.ok(
    updates[0].paymentDeadline.getTime() - updates[0].approvedAt.getTime() <=
      30 * 60 * 1000,
  );
  assert.equal(emitted[0].event, "booking.request.approved");
});

test("availability detects overlap for 1/6-4/6 against an active 3/6-6/6 booking", async () => {
  const findManyCalls: any[] = [];
  const service = new AvailabilityService({
    booking: {
      findMany: async (args: any) => {
        findManyCalls.push(args);
        return [
          {
            id: "booking-conflict",
            roomId: "room-1",
            checkIn: new Date("2026-06-03"),
            checkOut: new Date("2026-06-06"),
            status: BookingStatus.CONFIRMED,
            bookingCode: "PRIVATE-CODE",
            customer: { firstName: "Private" },
          },
        ];
      },
    },
  } as any);

  const result = await service.checkRoomRange(
    "room-1",
    "2026-06-01",
    "2026-06-04",
  );

  assert.equal(result.available, false);
  assert.deepEqual(result.conflicts, [
    { checkIn: "2026-06-03", checkOut: "2026-06-06", status: "booked" },
  ]);
  assert.equal(
    dateOnly(findManyCalls[0].where.AND[0].checkIn.lt),
    "2026-06-04",
  );
  assert.equal(
    dateOnly(findManyCalls[0].where.AND[1].checkOut.gt),
    "2026-06-01",
  );
});

test("availability active holds require live approval or payment deadlines", async () => {
  const findManyCalls: any[] = [];
  const service = new AvailabilityService({
    booking: {
      findMany: async (args: any) => {
        findManyCalls.push(args);
        return [];
      },
    },
  } as any);

  const bookedRoomIds = await service.getBookedRoomIds(
    new Date("2026-06-01"),
    new Date("2026-06-04"),
  );

  assert.deepEqual(bookedRoomIds, []);
  const rules = findManyCalls[0].where.OR;
  const approvalRule = rules.find(
    (rule: any) => rule.status === BookingStatus.PENDING_HOST_APPROVAL,
  );
  const paymentRule = rules.find(
    (rule: any) =>
      Array.isArray(rule.status?.in) &&
      rule.status.in.includes(BookingStatus.PENDING_PAYMENT),
  );
  assert.ok(approvalRule.approvalDeadline.gt instanceof Date);
  assert.ok(paymentRule.paymentDeadline.gt instanceof Date);
});

test("public room availability does not expose customer, booking code or payment data", async () => {
  const findManyCalls: any[] = [];
  const service = new AvailabilityService({
    room: {
      findUnique: async () => ({ id: "room-1", status: RoomStatus.AVAILABLE }),
    },
    booking: {
      findMany: async (args: any) => {
        findManyCalls.push(args);
        return [
          {
            id: "booking-private",
            roomId: "room-1",
            checkIn: new Date("2026-06-03"),
            checkOut: new Date("2026-06-06"),
            status: BookingStatus.PENDING_PAYMENT,
            bookingCode: "PRIVATE-CODE",
            customer: { firstName: "Private" },
            payment: { status: PaymentStatus.PROCESSING },
          },
        ];
      },
    },
  } as any);

  const result = await service.getRoomCalendar(
    "room-1",
    "2026-06-01",
    "2026-06-07",
  );
  const serialized = JSON.stringify(result);

  assert.equal(findManyCalls[0].select.bookingCode, undefined);
  assert.equal(findManyCalls[0].select.customer, undefined);
  assert.equal(findManyCalls[0].select.payment, undefined);
  assert.equal(serialized.includes("PRIVATE-CODE"), false);
  assert.equal(serialized.includes("Private"), false);
});

test("staff booking calendar role guard and booking block metadata are present", async () => {
  const roles = Reflect.getMetadata(
    ROLES_KEY,
    StaffController.prototype.getBookingCalendar,
  );
  assert.deepEqual(roles, [Role.RECEPTIONIST, Role.ADMIN]);

  const service = new AvailabilityService({
    room: {
      findMany: async () => [
        {
          id: "room-1",
          roomNumber: "101",
          floor: 1,
          status: RoomStatus.AVAILABLE,
          roomType: { id: "rt-1", name: "Deluxe", maxGuests: 2 },
          branch: { id: "branch-1", name: "Main", city: "Da Nang" },
        },
      ],
    },
    booking: {
      findMany: async () => [
        {
          id: "booking-1",
          bookingCode: "B001",
          roomId: "room-1",
          status: BookingStatus.PENDING_HOST_APPROVAL,
          checkIn: new Date("2026-06-03"),
          checkOut: new Date("2026-06-06"),
          createdAt: new Date("2026-05-30"),
          customer: {
            id: "customer-1",
            firstName: "An",
            lastName: "Nguyen",
            email: "an@example.com",
            phone: "0900000000",
          },
          room: {
            id: "room-1",
            roomNumber: "101",
            floor: 1,
            roomType: { id: "rt-1", name: "Deluxe" },
          },
        },
      ],
    },
  } as any);

  const result = await service.getStaffCalendar({
    from: "2026-06-01",
    to: "2026-06-07",
  });
  const block = result.rooms[0].bookings[0];

  assert.equal(block.bookingCode, "B001");
  assert.equal(block.status, BookingStatus.PENDING_HOST_APPROVAL);
  assert.equal(block.action.type, "approval-request");
  assert.equal(block.action.href, "/staff/pending-bookings");
  assert.equal(block.customer.email, "an@example.com");
});

test("rejectRequest persists rejection reason and emits a request rejected event", async () => {
  const updates: any[] = [];
  const emitted: any[] = [];
  const booking = makeBooking();
  const prisma = {
    booking: {
      findUnique: async () => booking,
      update: async (args: any) => {
        updates.push(args.data);
        return { ...booking, ...args.data };
      },
    },
  };
  const service = makeBookingsService({
    prisma,
    events: {
      emit: async (event: string, payload: object) =>
        emitted.push({ event, payload }),
    },
  });

  await service.rejectRequest("booking-1", "staff-1", {
    reason: "Room unavailable",
  });

  assert.equal(updates[0].status, BookingStatus.REJECTED);
  assert.equal(updates[0].approvedById, "staff-1");
  assert.equal(updates[0].rejectedReason, "Room unavailable");
  assert.equal(emitted[0].event, "booking.request.rejected");
});

test("expireBooking handles approval expiry and payment expiry separately", async () => {
  const updates: any[] = [];
  const emitted: any[] = [];
  const releases: string[] = [];
  let currentBooking = makeBooking({
    status: BookingStatus.PENDING_HOST_APPROVAL,
  });

  const prisma = {
    booking: {
      findUnique: async () => currentBooking,
      update: async (args: any) => {
        updates.push(args.data);
        currentBooking = { ...currentBooking, ...args.data };
        return currentBooking;
      },
    },
  };
  const service = makeBookingsService({
    prisma,
    coupons: {
      releaseReservationForBooking: async (booking: any) =>
        releases.push(booking.id),
    },
    events: {
      emit: async (event: string, payload: object) =>
        emitted.push({ event, payload }),
    },
  });

  await service.expireBooking("booking-1");

  currentBooking = makeBooking({
    status: BookingStatus.PENDING_PAYMENT,
    paymentDeadline: new Date(Date.now() - HOUR),
    couponCode: "SAVE10",
    payment: { status: PaymentStatus.PROCESSING },
  });

  await service.expireBooking("booking-1");

  assert.deepEqual(
    updates.map((u) => u.status),
    [BookingStatus.EXPIRED, BookingStatus.EXPIRED],
  );
  assert.deepEqual(releases, ["booking-1"]);
  assert.deepEqual(
    emitted.map((e) => e.event),
    ["booking.approval.expired", "booking.payment.expired"],
  );
});

test("initiatePayment rejects pre-approval bookings", async () => {
  const service = new PaymentsService(
    {
      booking: {
        findUnique: async () =>
          makeBooking({ status: BookingStatus.PENDING_HOST_APPROVAL }),
      },
    } as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );

  await assert.rejects(
    () =>
      service.initiatePayment(
        "booking-1",
        "customer-1",
        PaymentMethod.VNPAY,
        "127.0.0.1",
      ),
    /chưa được duyệt/,
  );
});

test("initiatePayment starts payment after approval and reserves coupon amount", async () => {
  const bookingUpdates: any[] = [];
  const paymentCreates: any[] = [];
  const booking = makeBooking({
    status: BookingStatus.PENDING_PAYMENT,
    approvedAt: new Date(),
    paymentDeadline: new Date(Date.now() + HOUR),
    totalAmount: 1_000_000,
  });
  const prisma = {
    booking: {
      findUnique: async () => booking,
      update: async (args: any) => {
        bookingUpdates.push(args.data);
        return { ...booking, ...args.data };
      },
    },
    payment: {
      findUnique: async () => null,
      create: async (args: any) => {
        paymentCreates.push(args.data);
        return { id: "payment-1", ...args.data };
      },
    },
  };
  const service = new PaymentsService(
    prisma as any,
    {} as any,
    {} as any,
    {
      createPaymentUrl: ({ amount }: { amount: number }) =>
        `https://gateway.example/pay/${amount}`,
    } as any,
    {
      reserveCouponForUser: async (
        userId: string,
        code: string,
        amount: number,
      ) => {
        assert.equal(userId, "customer-1");
        assert.equal(code, "SAVE10");
        assert.equal(amount, 1_000_000);
        return { discount: 100_000, finalAmount: 900_000 };
      },
    } as any,
  );

  const result = await service.initiatePayment(
    "booking-1",
    "customer-1",
    PaymentMethod.VNPAY,
    "127.0.0.1",
    PaymentType.FULL,
    "save10",
  );

  assert.equal(result.amount, 900_000);
  assert.equal(paymentCreates[0].amount, 900_000);
  assert.equal(paymentCreates[0].gatewayUrl, "https://gateway.example/pay/900000");
  assert.equal(bookingUpdates[0].couponCode, "SAVE10");
  assert.equal(bookingUpdates[0].discountAmount, 100_000);
  assert.equal(bookingUpdates.at(-1).status, BookingStatus.PAYING);
});

test("initiatePayment allows PAYING bookings to re-initiate payment", async () => {
  const bookingUpdates: any[] = [];
  const paymentUpdates: any[] = [];
  const booking = makeBooking({
    status: BookingStatus.PAYING,
    approvedAt: new Date(),
    paymentDeadline: new Date(Date.now() + HOUR),
    totalAmount: 1_000_000,
  });
  const prisma = {
    booking: {
      findUnique: async () => booking,
      update: async (args: any) => {
        bookingUpdates.push(args.data);
        return { ...booking, ...args.data };
      },
    },
    payment: {
      findUnique: async () => ({
        id: "payment-1",
        status: PaymentStatus.PROCESSING,
        amount: 1_000_000,
      }),
      update: async (args: any) => {
        paymentUpdates.push(args.data);
        return { id: "payment-1", ...args.data };
      },
    },
  };
  const service = new PaymentsService(
    prisma as any,
    {} as any,
    {} as any,
    {
      createPaymentUrl: ({ amount }: { amount: number }) =>
        `https://gateway.example/pay/${amount}`,
    } as any,
    {
      reserveCouponForUser: async () => {
        return { discount: 0, finalAmount: 1_000_000 };
      },
    } as any,
  );

  const result = await service.initiatePayment(
    "booking-1",
    "customer-1",
    PaymentMethod.VNPAY,
    "127.0.0.1",
    PaymentType.FULL,
  );

  assert.equal(result.amount, 1_000_000);
  assert.equal(paymentUpdates[0].status, PaymentStatus.PROCESSING);
  assert.equal(paymentUpdates[0].gatewayUrl, "https://gateway.example/pay/1000000");
  assert.equal(bookingUpdates.at(-1).status, BookingStatus.PAYING);
});

test("initiatePayment bypasses VNPay for localhost requests", async () => {
  const bookingUpdates: any[] = [];
  const paymentCreates: any[] = [];
  const paymentUpdates: any[] = [];
  const emitted: any[] = [];
  const booking = makeBooking({
    status: BookingStatus.PENDING_PAYMENT,
    approvedAt: new Date(),
    paymentDeadline: new Date(Date.now() + HOUR),
    totalAmount: 1_000_000,
  });
  const prisma = {
    booking: {
      findUnique: async () => booking,
      update: async (args: any) => {
        bookingUpdates.push(args.data);
        return { ...booking, ...args.data };
      },
    },
    payment: {
      findUnique: async () => null,
      create: async (args: any) => {
        paymentCreates.push(args.data);
        return { id: "payment-1", ...args.data };
      },
      update: async (args: any) => {
        paymentUpdates.push(args.data);
        return {
          id: "payment-1",
          bookingId: "booking-1",
          customerId: "customer-1",
          ...args.data,
        };
      },
    },
  };
  const service = new PaymentsService(
    prisma as any,
    {
      emit: async (event: string, payload: object) =>
        emitted.push({ event, payload }),
    } as any,
    {} as any,
    {
      createPaymentUrl: () => {
        throw new Error("VNPay gateway should not be called");
      },
    } as any,
    {
      reserveCouponForUser: async () => ({ discount: 0, finalAmount: 1_000_000 }),
    } as any,
  );

  const result = await service.initiatePayment(
    "booking-1",
    "customer-1",
    PaymentMethod.VNPAY,
    "127.0.0.1",
    PaymentType.FULL,
    undefined,
    true,
  );

  assert.equal(result.gatewayUrl, undefined);
  assert.equal(result.bypassed, true);
  assert.equal(paymentCreates[0].status, PaymentStatus.PROCESSING);
  assert.equal(paymentUpdates[0].status, PaymentStatus.COMPLETED);
  assert.match(paymentUpdates[0].gatewayTransactionId, /^LOCAL-/);
  assert.equal(bookingUpdates[0].status, BookingStatus.PAYING);
  assert.equal(emitted[0].event, "payment.success");
});

test("coupon release restores booking amount and user coupon state", async () => {
  const couponUpdates: any[] = [];
  const bookingUpdates: any[] = [];
  const userCouponUpdates: any[] = [];
  const service = new CouponsService({
    coupon: {
      findUnique: async () => ({
        id: "coupon-1",
        code: "SAVE10",
        usageCount: 1,
      }),
      update: async (args: any) => {
        couponUpdates.push(args.data);
        return args.data;
      },
    },
    booking: {
      update: async (args: any) => {
        bookingUpdates.push(args.data);
        return args.data;
      },
      count: async () => 0,
    },
    userCoupon: {
      updateMany: async (args: any) => {
        userCouponUpdates.push(args.data);
        return args.data;
      },
    },
  } as any);

  await service.releaseReservationForBooking({
    id: "booking-1",
    customerId: "customer-1",
    couponCode: "SAVE10",
    totalAmount: 900_000,
    discountAmount: 100_000,
    payment: { status: PaymentStatus.FAILED },
  });

  assert.deepEqual(couponUpdates[0], { usageCount: { decrement: 1 } });
  assert.equal(bookingUpdates[0].couponCode, null);
  assert.equal(bookingUpdates[0].discountAmount, null);
  assert.equal(bookingUpdates[0].totalAmount, 1_000_000);
  assert.deepEqual(userCouponUpdates[0], { isUsed: false, usedAt: null });
});

test("payment failure reopens payment while deadline remains valid", async () => {
  const releases: string[] = [];
  const updates: any[] = [];
  const booking = makeBooking({
    status: BookingStatus.PAYING,
    paymentDeadline: new Date(Date.now() + HOUR),
    couponCode: "SAVE10",
    payment: { status: PaymentStatus.FAILED },
  });
  const service = makeBookingsService({
    prisma: {
      booking: {
        findUnique: async () => booking,
        update: async (args: any) => {
          updates.push(args.data);
          return { ...booking, ...args.data };
        },
      },
    },
    coupons: {
      releaseReservationForBooking: async (releasedBooking: any) =>
        releases.push(releasedBooking.id),
    },
  });

  await service.handlePaymentFailed("booking-1");

  assert.deepEqual(releases, ["booking-1"]);
  assert.equal(updates[0].status, BookingStatus.PENDING_PAYMENT);
});

test("customer cancellation releases coupon reservation", async () => {
  const releases: string[] = [];
  const updates: any[] = [];
  const emitted: any[] = [];
  const booking = makeBooking({
    status: BookingStatus.PENDING_PAYMENT,
    couponCode: "SAVE10",
    payment: { status: PaymentStatus.PROCESSING },
  });
  const service = makeBookingsService({
    prisma: {
      booking: {
        findUnique: async () => booking,
        update: async (args: any) => {
          updates.push(args.data);
          return { ...booking, ...args.data };
        },
      },
    },
    coupons: {
      releaseReservationForBooking: async (releasedBooking: any) =>
        releases.push(releasedBooking.id),
    },
    events: {
      emit: async (event: string, payload: object) =>
        emitted.push({ event, payload }),
    },
  });

  await service.cancelBooking("booking-1", "customer-1");

  assert.deepEqual(releases, ["booking-1"]);
  assert.equal(updates[0].status, BookingStatus.CANCELLED);
  assert.equal(emitted[0].event, "booking.cancelled");
});

test("notifications enforce ownership and publish persisted realtime events", async () => {
  const findManyArgs: any[] = [];
  const createdNotifications: any[] = [];
  const notificationUpdates: any[] = [];
  const now = new Date("2026-07-01T12:00:00.000Z");
  const service = new NotificationsService(
    {
      get: (key: string, fallback?: string) =>
        key === "RESEND_API_KEY" ? undefined : fallback,
    } as any,
    {
      notification: {
        findMany: async (args: any) => {
          findManyArgs.push(args);
          return [];
        },
        findFirst: async (args: any) =>
          args.where.id === "missing"
            ? null
            : { id: args.where.id, recipientId: args.where.recipientId, readAt: null },
        update: async (args: any) => {
          notificationUpdates.push(args);
          return { id: args.where.id, ...args.data };
        },
        create: async (args: any) => {
          createdNotifications.push(args.data);
          return { id: "notification-1", readAt: null, ...args.data };
        },
      },
      booking: {
        findUnique: async () => ({
          id: "booking-1",
          bookingCode: "B001",
          customerId: "customer-1",
          checkIn: now,
          checkOut: new Date("2026-07-03T12:00:00.000Z"),
          totalAmount: 1_000_000,
          paymentDeadline: now,
          customer: {
            firstName: "Test",
            lastName: "User",
            email: "customer@example.com",
          },
        }),
      },
    } as any,
  );

  await service.listMine("customer-1", 2, 5);
  assert.equal(findManyArgs[0].where.recipientId, "customer-1");
  assert.equal(findManyArgs[0].skip, 5);
  assert.equal(findManyArgs[0].take, 5);

  assert.equal(await service.markRead("missing", "customer-1"), null);
  await service.markRead("notification-1", "customer-1");
  assert.equal(notificationUpdates[0].where.id, "notification-1");
  assert.ok(notificationUpdates[0].data.readAt instanceof Date);

  const eventPromise = new Promise<any>((resolve) => {
    const subscription = service.streamForUser("customer-1").subscribe((event) => {
      subscription.unsubscribe();
      resolve(event);
    });
  });

  await service.send({
    type: "booking.request.approved",
    bookingId: "booking-1",
    paymentDeadline: now,
  });

  const event = await eventPromise;
  assert.equal(createdNotifications[0].recipientId, "customer-1");
  assert.equal(createdNotifications[0].type, "booking.request.approved");
  assert.equal(event.type, "notification");
  assert.equal(event.data.id, "notification-1");
});
