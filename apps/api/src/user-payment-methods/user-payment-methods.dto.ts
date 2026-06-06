import { IsString, IsOptional, IsBoolean, IsObject } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateUserPaymentMethodDto {
  @ApiProperty({ enum: ["VNPAY", "MOMO", "VISA", "SHOPEEPAY", "CASH"] })
  @IsString()
  type!: string;

  @ApiProperty({ example: "Thẻ VISA ****4242" })
  @IsString()
  label!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  details?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateUserPaymentMethodDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  details?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
