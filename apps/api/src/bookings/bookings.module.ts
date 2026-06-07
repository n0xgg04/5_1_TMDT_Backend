import { Module } from "@nestjs/common";
import { BookingsController } from "./bookings.controller";
import { BookingsService } from "./bookings.service";
import { BookingEventHandlers } from "./booking.events";
import { RoomsModule } from "../rooms/rooms.module";
import { CouponsModule } from "../coupons/coupons.module";
import { FlashSalesModule } from "../flash-sales/flash-sales.module";
import { AvailabilityModule } from "../availability/availability.module";
import { BillsModule } from "../bills/bills.module";

@Module({
  imports: [RoomsModule, CouponsModule, FlashSalesModule, AvailabilityModule, BillsModule],
  controllers: [BookingsController],
  providers: [BookingsService, BookingEventHandlers],
  exports: [BookingsService],
})
export class BookingsModule {}
