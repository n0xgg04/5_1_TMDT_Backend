import { Controller, Get, Post, Body, Query, Param } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { CouponsService } from "./coupons.service";
import { CreateCouponDto, ApplyCouponDto } from "./coupons.dto";
import { Public } from "../common/decorators/public.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { Role } from "@prisma/client";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@ApiTags("Coupons")
@Controller({ path: "coupons", version: "1" })
export class CouponsController {
  constructor(private readonly service: CouponsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "Lấy danh sách coupon đang active" })
  findActive() {
    return this.service.findActive();
  }

  @Public()
  @Get("public")
  @ApiOperation({ summary: "Danh sách coupon công khai" })
  findActivePublic(@CurrentUser() user?: { id: string }) {
    return this.service.findActivePublic(user?.id);
  }

  @Get("my-coupons")
  @ApiOperation({ summary: "Ưu đãi của tôi" })
  getMyCoupons(@CurrentUser() user: { id: string }) {
    return this.service.getMyCoupons(user.id);
  }

  @Post(":id/claim")
  @ApiOperation({ summary: "Lưu coupon" })
  claim(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    return this.service.claimCoupon(user.id, id);
  }

  @Get("admin")
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Lấy tất cả coupon (admin)" })
  findAll() {
    return this.service.findAll();
  }

  @Post("admin")
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Tạo coupon (admin)" })
  create(@Body() dto: CreateCouponDto) {
    return this.service.create(dto);
  }

  @Public()
  @Post("apply")
  @ApiOperation({ summary: "Áp dụng coupon" })
  apply(@Body() dto: ApplyCouponDto) {
    return this.service.applyCoupon(dto);
  }
}
