import { Module } from "@nestjs/common";
import { CronController } from "./cron.controller";
import { BookingsModule } from "../bookings/bookings.module";
import { SepayModule } from "../sepay/sepay.module";

@Module({
  imports: [BookingsModule, SepayModule],
  controllers: [CronController],
})
export class CronModule {}
