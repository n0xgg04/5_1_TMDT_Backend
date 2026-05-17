import {
  IsString,
  IsInt,
  IsOptional,
  Min,
  IsDateString,
  IsNumberString,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateBookingDto {
  @ApiProperty({ example: "room-id" })
  @IsString()
  roomId!: string;

  @ApiProperty({ example: "2026-05-01" })
  @IsDateString()
  checkIn!: string;

  @ApiProperty({ example: "2026-05-03" })
  @IsDateString()
  checkOut!: string;

  @ApiPropertyOptional({ example: "14:00" })
  @IsOptional()
  @IsString()
  checkInTime?: string;

  @ApiPropertyOptional({ example: "12:00" })
  @IsOptional()
  @IsString()
  checkOutTime?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  adults?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  children?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  guestNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialRequests?: string;
}

export class CancelBookingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UploadReceiptDto {
  @ApiProperty({ example: "https://cdn.example.com/receipt.jpg" })
  @IsString()
  receiptImageUrl!: string;
}

export class ApproveBookingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class RejectBookingDto {
  @ApiProperty({ example: "Phòng đã hết chỗ" })
  @IsString()
  reason!: string;
}
