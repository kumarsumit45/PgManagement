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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { AssignBedDto, VacateBedDto, TransferBedDto } from './dto/tenant.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { User } from '../users/entities/user.entity';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Post('assign-bed')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.CARETAKER)
  @ApiOperation({ summary: 'Assign bed to tenant with KYC & check-in details' })
  assignBed(@Body() dto: AssignBedDto) {
    return this.tenantsService.assignBed(dto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.CARETAKER)
  @ApiOperation({ summary: 'Get all active tenant allocations' })
  @ApiQuery({ name: 'buildingId', required: false })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('buildingId') buildingId?: string,
  ) {
    return this.tenantsService.findAllAllocations(pagination, buildingId);
  }

  @Get('my-allocation')
  @Roles(Role.TENANT)
  @ApiOperation({ summary: 'Get current tenant own allocation details' })
  myAllocation(@CurrentUser() user: User) {
    return this.tenantsService.findTenantAllocation(user.id);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.CARETAKER)
  @ApiOperation({ summary: 'Get allocation by ID' })
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.getAllocationById(id);
  }

  @Patch(':id/vacate')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Vacate tenant bed (check-out)' })
  vacate(@Param('id', ParseUUIDPipe) id: string, @Body() dto: VacateBedDto) {
    return this.tenantsService.vacateBed(id, dto);
  }

  @Patch(':id/transfer')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Transfer tenant to another bed' })
  transfer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransferBedDto,
  ) {
    return this.tenantsService.transferBed(id, dto);
  }
}
