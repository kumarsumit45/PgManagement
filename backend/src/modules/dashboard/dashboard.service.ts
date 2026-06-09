import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectRedis } from '../redis/redis.module';
import Redis from 'ioredis';
import { Building } from '../buildings/entities/building.entity';
import { Room } from '../rooms/entities/room.entity';
import { Bed } from '../beds/entities/bed.entity';
import { TenantAllocation } from '../tenants/entities/tenant-allocation.entity';
import { Complaint } from '../complaints/entities/complaint.entity';
import { RentInvoice } from '../payments/entities/rent-invoice.entity';
import { Payment } from '../payments/entities/payment.entity';
import { ComplaintStatus } from '../../common/enums/complaint-status.enum';
import { PaymentStatus } from '../../common/enums/payment-status.enum';

const ADMIN_DASHBOARD_CACHE_KEY = 'cache:dashboard:admin';
const CACHE_TTL = 300;

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Building) private buildingRepo: Repository<Building>,
    @InjectRepository(Room) private roomRepo: Repository<Room>,
    @InjectRepository(Bed) private bedRepo: Repository<Bed>,
    @InjectRepository(TenantAllocation) private allocationRepo: Repository<TenantAllocation>,
    @InjectRepository(Complaint) private complaintRepo: Repository<Complaint>,
    @InjectRepository(RentInvoice) private invoiceRepo: Repository<RentInvoice>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRedis() private redis: Redis,
  ) {}

  async getAdminDashboard() {
    const cached = await this.redis.get(ADMIN_DASHBOARD_CACHE_KEY);
    if (cached) return JSON.parse(cached);

    const [
      totalBuildings,
      totalRooms,
      totalBeds,
      occupiedBeds,
      totalTenants,
      pendingComplaints,
      inProgressComplaints,
      overdueInvoices,
    ] = await Promise.all([
      this.buildingRepo.count({ where: { isActive: true } }),
      this.roomRepo.count({ where: { isActive: true } }),
      this.bedRepo.count({ where: { isActive: true } }),
      this.bedRepo.count({ where: { isOccupied: true, isActive: true } }),
      this.allocationRepo.count({ where: { isActive: true } }),
      this.complaintRepo.count({ where: { status: ComplaintStatus.OPEN } }),
      this.complaintRepo.count({ where: { status: ComplaintStatus.IN_PROGRESS } }),
      this.invoiceRepo.count({ where: { status: PaymentStatus.OVERDUE } }),
    ]);

    const currentMonth = new Date().toISOString().slice(0, 7);
    const revenueResult = await this.paymentRepo
      .createQueryBuilder('p')
      .select('SUM(p.amount)', 'total')
      .innerJoin('p.invoice', 'inv')
      .where('inv.month = :month', { month: currentMonth })
      .andWhere('p.isVerified = true')
      .getRawOne();

    const result = {
      totalBuildings,
      totalRooms,
      totalBeds,
      occupiedBeds,
      vacantBeds: totalBeds - occupiedBeds,
      occupancyRate: totalBeds ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : '0',
      totalTenants,
      pendingComplaints,
      inProgressComplaints,
      overdueInvoices,
      monthlyRevenue: parseFloat(revenueResult?.total || '0'),
      generatedAt: new Date().toISOString(),
    };

    await this.redis.setex(ADMIN_DASHBOARD_CACHE_KEY, CACHE_TTL, JSON.stringify(result));
    return result;
  }

  async getTenantDashboard(tenantId: string) {
    const allocation = await this.allocationRepo.findOne({
      where: { tenantId, isActive: true },
      relations: { building: true, room: true, bed: true },
    });

    const [pendingInvoices, openComplaints] = await Promise.all([
      this.invoiceRepo.find({
        where: { tenantId, status: PaymentStatus.PENDING },
        order: { dueDate: 'ASC' },
        take: 1,
      }),
      this.complaintRepo.count({
        where: { tenantId, status: ComplaintStatus.OPEN },
      }),
    ]);

    return {
      allocation,
      roomNumber: allocation?.room?.roomNumber,
      bedNumber: allocation?.bed?.bedNumber,
      buildingName: allocation?.building?.name,
      monthlyRent: allocation?.monthlyRent,
      nextDueDate: pendingInvoices[0]?.dueDate,
      rentDue: pendingInvoices[0]?.totalAmount,
      openComplaints,
    };
  }

  async invalidateCache(): Promise<void> {
    await this.redis.del(ADMIN_DASHBOARD_CACHE_KEY);
  }
}
