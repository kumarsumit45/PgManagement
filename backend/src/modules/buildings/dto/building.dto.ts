import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  Min,
} from 'class-validator';

export class CreateBuildingDto {
  @ApiProperty({ example: 'PG Tower A' })
  @IsString()
  name: string;

  @ApiProperty({ example: '123 MG Road, Koramangala' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'Bangalore' })
  @IsString()
  city: string;

  @ApiPropertyOptional({ example: 'Karnataka' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: '560001' })
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  contactNumber?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  totalFloors?: number;

  @ApiPropertyOptional({ example: ['WiFi', 'CCTV', 'Parking'] })
  @IsOptional()
  @IsArray()
  amenities?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rules?: string;
}

export class UpdateBuildingDto extends PartialType(CreateBuildingDto) {}
