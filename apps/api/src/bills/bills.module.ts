import { Module } from "@nestjs/common";
import { BillsService } from "./bills.service";

@Module({
  providers: [BillsService],
  exports: [BillsService],
})
export class BillsModule {}
