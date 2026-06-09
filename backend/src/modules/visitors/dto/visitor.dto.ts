import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { VisitorStatus } from '../entities/visitor.entity';

export class CreateVisitorDto {
  @ApiProperty({ example: 'Anjali Sharma' })
  @IsString()
  visitorName: string;

  @ApiProperty({ example: '+919876543210' })
  @IsString()
  visitorPhone: string;

  @ApiPropertyOptional({ example: 'aadhar' })
  @IsOptional()
  @IsString()
  visitorIdType?: string;

  @ApiPropertyOptional({ example: '1234-5678-9012' })
  @IsOptional()
  @IsString()
  visitorIdNumber?: string;

  @ApiPropertyOptional({ example: 'Family visit' })
  @IsOptional()
  @IsString()
  purpose?: string;
}

export class UpdateVisitorStatusDto {
  @ApiProperty({ enum: VisitorStatus })
  @IsEnum(VisitorStatus)
  status: VisitorStatus;
}
