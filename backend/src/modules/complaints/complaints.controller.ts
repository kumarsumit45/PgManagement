import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto, UpdateComplaintStatusDto } from './dto/complaint.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { ComplaintStatus } from '../../common/enums/complaint-status.enum';
import { User } from '../users/entities/user.entity';

@ApiTags('Complaints')
@ApiBearerAuth()
@Controller('complaints')
export class ComplaintsController {
  constructor(private complaintsService: ComplaintsService) {}

  @Post()
  @Roles(Role.TENANT)
  @UseGuards(RolesGuard)
  @UseInterceptors(FilesInterceptor('images', 5, { storage: memoryStorage() }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Raise a complaint with optional images' })
  create(
    @Body() dto: CreateComplaintDto,
    @CurrentUser() user: User,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.complaintsService.create(dto, user.id, files);
  }

  @Get()
  @ApiOperation({ summary: 'Get complaints (Tenant: own; Admin: all)' })
  @ApiQuery({ name: 'status', required: false, enum: ComplaintStatus })
  findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() user: User,
    @Query('status') status?: ComplaintStatus,
  ) {
    return this.complaintsService.findAll(pagination, user, status);
  }

  @Get('analytics')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Complaint analytics by status & category' })
  analytics() {
    return this.complaintsService.getAnalytics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get complaint details' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.complaintsService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update complaint status (Admin) or close (Tenant)' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateComplaintStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.complaintsService.updateStatus(id, dto, user);
  }
}
