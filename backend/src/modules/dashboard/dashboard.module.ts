import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Building } from '../buildings/entities/building.entity';
import { Room } from '../rooms/entities/room.entity';
import { Bed } from '../beds/entities/bed.entity';
import { TenantAllocation } from '../tenants/entities/tenant-allocation.entity';
import { Complaint } from '../complaints/entities/complaint.entity';
import { RentInvoice } from '../payments/entities/rent-invoice.entity';
import { Payment } from '../payments/entities/payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Building,
      Room,
      Bed,
      TenantAllocation,
      Complaint,
      RentInvoice,
      Payment,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
