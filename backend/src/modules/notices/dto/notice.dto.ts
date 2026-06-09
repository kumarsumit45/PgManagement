import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { NoticeType } from '../entities/notice.entity';

export class CreateNoticeDto {
  @ApiProperty({ example: 'Water supply interruption' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Water supply will be interrupted on 10th June from 9AM to 1PM.' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ enum: NoticeType })
  @IsOptional()
  @IsEnum(NoticeType)
  type?: NoticeType;

  @ApiPropertyOptional({ description: 'Target specific building, null = all buildings' })
  @IsOptional()
  @IsUUID()
  buildingId?: string;

  @ApiPropertyOptional({ example: '2026-07-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateNoticeDto extends PartialType(CreateNoticeDto) {}
