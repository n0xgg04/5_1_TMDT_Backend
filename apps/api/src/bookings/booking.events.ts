import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { EventsService } from "../common/events/events.service";
import { NotificationsService } from "../notifications/notifications.service";
import { BookingsService } from "./bookings.service";

/**
 * Wires domain event handlers once the Nest container is ready.
 * Replaces the previous RabbitMQ-based BookingSaga and NotificationsConsumer.
 *
 * Handlers:
 *  - payment.success → confirm booking + fire booking.confirmed
 *  - payment.failed  → release coupon and return to payment window if valid
 *  - booking lifecycle events / checkout.completed
 *    → send notification email via Resend
 */
@Injectable()
export class BookingEventHandlers implements OnModuleInit {
  private readonly logger = new Logger(BookingEventHandlers.name);

  constructor(
    private readonly events: EventsService,
    private readonly notifications: NotificationsService,
    private readonly bookings: BookingsService,
  ) {}

  onModuleInit(): void {
    this.events.on("payment.success", async (p) => {
      const bookingId = p.bookingId as string;
      this.logger.log(`Saga: payment.success → confirm booking ${bookingId}`);
      await this.bookings.confirmBooking(bookingId);
    });

    this.events.on("payment.failed", async (p) => {
      const bookingId = p.bookingId as string;
      this.logger.log(`Saga: payment.failed → reopen payment ${bookingId}`);
      await this.bookings.handlePaymentFailed(bookingId);
    });

    this.events.on("booking.confirmed", (p) =>
      this.notifications.send({
        type: "booking.confirmed",
        bookingId: p.bookingId as string,
      }),
    );

    this.events.on("booking.request.approved", (p) =>
      this.notifications.send({
        type: "booking.request.approved",
        bookingId: p.bookingId as string,
        paymentDeadline: p.paymentDeadline as Date | string | undefined,
      }),
    );

    this.events.on("booking.request.rejected", (p) =>
      this.notifications.send({
        type: "booking.request.rejected",
        bookingId: p.bookingId as string,
        reason: p.reason as string | undefined,
      }),
    );

    this.events.on("booking.cancelled", (p) =>
      this.notifications.send({
        type: "booking.cancelled",
        bookingId: p.bookingId as string,
        reason: p.reason as string | undefined,
      }),
    );

    this.events.on("booking.approval.expired", (p) =>
      this.notifications.send({
        type: "booking.approval.expired",
        bookingId: p.bookingId as string,
      }),
    );

    this.events.on("booking.payment.expired", (p) =>
      this.notifications.send({
        type: "booking.payment.expired",
        bookingId: p.bookingId as string,
      }),
    );

    this.events.on("booking.expired", (p) =>
      this.notifications.send({
        type: "booking.expired",
        bookingId: p.bookingId as string,
      }),
    );

    this.events.on("checkout.completed", (p) =>
      this.notifications.send({
        type: "checkout.completed",
        bookingId: p.bookingId as string,
        finalAmount: p.finalAmount as number | undefined,
      }),
    );

    this.logger.log("Booking event handlers registered");
  }
}
