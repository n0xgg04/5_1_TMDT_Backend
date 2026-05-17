import { IsString, IsOptional, IsBoolean } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreatePaymentMethodDto {
  @ApiProperty()
  @IsString()
  bankName!: string;

  @ApiProperty()
  @IsString()
  accountNumber!: string;

  @ApiProperty()
  @IsString()
  accountHolder!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qrImageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePaymentMethodDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountHolder?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qrImageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
