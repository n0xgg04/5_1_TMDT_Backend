import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { FlashSalesService } from "./flash-sales.service";
import { Public } from "../common/decorators/public.decorator";

@ApiTags("Flash Sales")
@Controller({ path: "flash-sales", version: "1" })
export class FlashSalesController {
  constructor(private readonly service: FlashSalesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "Lấy danh sách flash sale đang active" })
  findActive() {
    return this.service.findActive();
  }
}
