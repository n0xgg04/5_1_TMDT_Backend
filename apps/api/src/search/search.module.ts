import { Module } from "@nestjs/common";
import { SearchController } from "./search.controller";
import { SearchService } from "./search.service";
import { RoomsModule } from "../rooms/rooms.module";
import { AvailabilityModule } from "../availability/availability.module";

@Module({
  imports: [RoomsModule, AvailabilityModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
