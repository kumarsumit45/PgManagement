import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { User } from '../users/entities/user.entity';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.CARETAKER)
  @ApiOperation({ summary: 'Admin overview dashboard (cached 5 min)' })
  adminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }

  @Get('tenant')
  @UseGuards(RolesGuard)
  @Roles(Role.TENANT)
  @ApiOperation({ summary: 'Tenant personal dashboard' })
  tenantDashboard(@CurrentUser() user: User) {
    return this.dashboardService.getTenantDashboard(user.id);
  }
}
