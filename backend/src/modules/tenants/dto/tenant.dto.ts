import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsNumber,
  IsDateString,
  IsObject,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class KycDocumentDto {
  @ApiProperty({ example: 'aadhar' })
  @IsString()
  idType: string;

  @ApiProperty({ example: '1234-5678-9012' })
  @IsString()
  idNumber: string;

  @ApiProperty()
  @IsString()
  frontImage: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  backImage?: string;
}

export class AssignBedDto {
  @ApiProperty({ description: 'Tenant (User) ID' })
  @IsUUID()
  tenantId: string;

  @ApiProperty()
  @IsUUID()
  buildingId: string;

  @ApiProperty()
  @IsUUID()
  roomId: string;

  @ApiProperty()
  @IsUUID()
  bedId: string;

  @ApiProperty({ example: '2026-06-01' })
  @IsDateString()
  joiningDate: string;

  @ApiProperty({ example: 7000 })
  @IsNumber()
  @Min(0)
  monthlyRent: number;

  @ApiPropertyOptional({ example: 14000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  securityDeposit?: number;

  @ApiPropertyOptional({ default: 5, example: 5 })
  @IsOptional()
  @IsNumber()
  rentDueDay?: number;

  @ApiPropertyOptional({ example: 'Anjali Sharma' })
  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @ApiPropertyOptional({ example: '+919876543210' })
  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @ApiPropertyOptional({ type: KycDocumentDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => KycDocumentDto)
  kycDocuments?: KycDocumentDto;
}

export class VacateBedDto {
  @ApiProperty({ example: '2026-07-31' })
  @IsDateString()
  leavingDate: string;
}

export class TransferBedDto {
  @ApiProperty()
  @IsUUID()
  newBedId: string;

  @ApiProperty()
  @IsUUID()
  newRoomId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  newMonthlyRent?: number;
}
