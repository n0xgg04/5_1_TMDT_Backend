import { Module } from "@nestjs/common";
import { StaffController } from "./staff.controller";
import { StaffService } from "./staff.service";
import { AvailabilityModule } from "../availability/availability.module";

@Module({
  imports: [AvailabilityModule],
  controllers: [StaffController],
  providers: [StaffService],
})
export class StaffModule {}
