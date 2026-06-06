import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { UserPaymentMethodsService } from "./user-payment-methods.service";
import {
  CreateUserPaymentMethodDto,
  UpdateUserPaymentMethodDto,
} from "./user-payment-methods.dto";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@ApiTags("User Payment Methods")
@Controller({ path: "user-payment-methods", version: "1" })
export class UserPaymentMethodsController {
  constructor(private readonly service: UserPaymentMethodsService) {}

  @Get()
  @ApiOperation({ summary: "Danh sách phương thức thanh toán của tôi" })
  findAll(@CurrentUser() user: { id: string }) {
    return this.service.findAll(user.id);
  }

  @Post()
  @ApiOperation({ summary: "Thêm phương thức thanh toán" })
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateUserPaymentMethodDto,
  ) {
    return this.service.create(user.id, dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật phương thức thanh toán" })
  update(
    @CurrentUser() user: { id: string },
    @Param("id") id: string,
    @Body() dto: UpdateUserPaymentMethodDto,
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Xóa phương thức thanh toán" })
  delete(@CurrentUser() user: { id: string }, @Param("id") id: string) {
    return this.service.delete(user.id, id);
  }
}
