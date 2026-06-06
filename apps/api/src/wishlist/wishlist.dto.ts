import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SaveWishlistDto {
  @ApiProperty()
  @IsString()
  roomTypeId!: string;
}

export class SyncWishlistDto {
  @ApiProperty()
  @IsString()
  sessionId!: string;
}
