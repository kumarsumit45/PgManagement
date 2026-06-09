import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  IsUUID,
  Min,
} from 'class-validator';
import { RoomType } from '../../../common/enums/room-type.enum';

export class CreateRoomDto {
  @ApiProperty({ example: 'A101' })
  @IsString()
  roomNumber: string;

  @ApiProperty()
  @IsUUID()
  buildingId: string;

  @ApiProperty({ enum: RoomType, example: RoomType.DOUBLE })
  @IsEnum(RoomType)
  type: RoomType;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  capacity: number;

  @ApiProperty({ example: 7000 })
  @IsNumber()
  @Min(0)
  rentAmount: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  floorNumber?: number;

  @ApiPropertyOptional({ example: ['AC', 'Attached Bathroom'] })
  @IsOptional()
  @IsArray()
  amenities?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateRoomDto extends PartialType(CreateRoomDto) {}
