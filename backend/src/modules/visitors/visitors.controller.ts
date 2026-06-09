import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VisitorsService } from './visitors.service';
import { CreateVisitorDto, UpdateVisitorStatusDto } from './dto/visitor.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { User } from '../users/entities/user.entity';

@ApiTags('Visitors')
@ApiBearerAuth()
@Controller('visitors')
export class VisitorsController {
  constructor(private visitorsService: VisitorsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.TENANT)
  @ApiOperation({ summary: 'Register a visitor entry request' })
  create(@Body() dto: CreateVisitorDto, @CurrentUser() user: User) {
    return this.visitorsService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get visitors (Admin: all, Tenant: own)' })
  findAll(@Query() pagination: PaginationDto, @CurrentUser() user: User) {
    const tenantId = user.role === Role.TENANT ? user.id : undefined;
    return this.visitorsService.findAll(pagination, tenantId);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.CARETAKER)
  @ApiOperation({ summary: 'Approve, reject or check-out visitor' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVisitorStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.visitorsService.updateStatus(id, dto, user.id);
  }
}
