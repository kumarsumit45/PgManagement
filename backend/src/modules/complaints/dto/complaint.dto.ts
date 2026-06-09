import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
} from '../../../common/enums/complaint-status.enum';

export class CreateComplaintDto {
  @ApiProperty({ example: 'Water leakage in bathroom' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'There is a major water leakage under the sink.' })
  @IsString()
  description: string;

  @ApiProperty({ enum: ComplaintCategory, example: ComplaintCategory.PLUMBING })
  @IsEnum(ComplaintCategory)
  category: ComplaintCategory;

  @ApiPropertyOptional({ enum: ComplaintPriority })
  @IsOptional()
  @IsEnum(ComplaintPriority)
  priority?: ComplaintPriority;
}

export class UpdateComplaintStatusDto {
  @ApiProperty({ enum: ComplaintStatus })
  @IsEnum(ComplaintStatus)
  status: ComplaintStatus;

  @ApiPropertyOptional({ example: 'Fixed the pipe and sealed the joint.' })
  @IsOptional()
  @IsString()
  resolutionNote?: string;

  @ApiPropertyOptional({ description: 'Staff user ID to assign' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}
