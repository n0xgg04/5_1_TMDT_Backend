import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { PaymentMethodsService } from "./payment-methods.service";
import {
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
} from "./payment-methods.dto";
import { Roles } from "../common/decorators/roles.decorator";
import { Public } from "../common/decorators/public.decorator";

@ApiTags("Payment Methods")
@Controller({ path: "payment-methods", version: "1" })
export class PaymentMethodsController {
  constructor(private readonly service: PaymentMethodsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "Lấy danh sách TK ngân hàng (public)" })
  findAll() {
    return this.service.findAll();
  }

  @Get("admin")
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Lấy tất cả TK ngân hàng (admin)" })
  findAllAdmin() {
    return this.service.findAllAdmin();
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Tạo TK ngân hàng" })
  create(@Body() dto: CreatePaymentMethodDto) {
    return this.service.create(dto);
  }

  @Put(":id")
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Cập nhật TK ngân hàng" })
  update(@Param("id") id: string, @Body() dto: UpdatePaymentMethodDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Xóa TK ngân hàng" })
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
