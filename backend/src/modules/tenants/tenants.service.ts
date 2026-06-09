import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantAllocation } from './entities/tenant-allocation.entity';
import { Bed } from '../beds/entities/bed.entity';
import { User } from '../users/entities/user.entity';
import { AssignBedDto, VacateBedDto, TransferBedDto } from './dto/tenant.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(TenantAllocation)
    private allocationRepo: Repository<TenantAllocation>,
    @InjectRepository(Bed) private bedRepo: Repository<Bed>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async assignBed(dto: AssignBedDto): Promise<TenantAllocation> {
    const tenant = await this.userRepo.findOne({ where: { id: dto.tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const bed = await this.bedRepo.findOne({ where: { id: dto.bedId } });
    if (!bed) throw new NotFoundException('Bed not found');
    if (bed.isOccupied) throw new BadRequestException('Bed is already occupied');

    const existing = await this.allocationRepo.findOne({
      where: { tenantId: dto.tenantId, isActive: true },
    });
    if (existing) throw new BadRequestException('Tenant already has an active allocation');

    const allocation = this.allocationRepo.create({
      ...dto,
      joiningDate: new Date(dto.joiningDate),
      isActive: true,
    });
    await this.allocationRepo.save(allocation);
    await this.bedRepo.update(dto.bedId, { isOccupied: true });

    return this.allocationRepo.findOne({
      where: { id: allocation.id },
      relations: { tenant: true, building: true, room: true, bed: true },
    });
  }

  async vacateBed(allocationId: string, dto: VacateBedDto): Promise<{ message: string }> {
    const allocation = await this.allocationRepo.findOne({
      where: { id: allocationId, isActive: true },
    });
    if (!allocation) throw new NotFoundException('Active allocation not found');

    await this.allocationRepo.update(allocationId, {
      leavingDate: new Date(dto.leavingDate),
      isActive: false,
    });
    await this.bedRepo.update(allocation.bedId, { isOccupied: false });

    return { message: 'Bed vacated successfully' };
  }

  async transferBed(allocationId: string, dto: TransferBedDto): Promise<TenantAllocation> {
    const allocation = await this.allocationRepo.findOne({
      where: { id: allocationId, isActive: true },
    });
    if (!allocation) throw new NotFoundException('Active allocation not found');

    const newBed = await this.bedRepo.findOne({ where: { id: dto.newBedId } });
    if (!newBed) throw new NotFoundException('New bed not found');
    if (newBed.isOccupied) throw new BadRequestException('New bed is already occupied');

    await this.bedRepo.update(allocation.bedId, { isOccupied: false });
    await this.bedRepo.update(dto.newBedId, { isOccupied: true });

    await this.allocationRepo.update(allocationId, {
      bedId: dto.newBedId,
      roomId: dto.newRoomId,
      monthlyRent: dto.newMonthlyRent || allocation.monthlyRent,
    });

    return this.allocationRepo.findOne({
      where: { id: allocationId },
      relations: { tenant: true, building: true, room: true, bed: true },
    });
  }

  async findAllAllocations(pagination: PaginationDto, buildingId?: string) {
    const { page, limit } = pagination;
    const query = this.allocationRepo
      .createQueryBuilder('alloc')
      .leftJoinAndSelect('alloc.tenant', 'tenant')
      .leftJoinAndSelect('alloc.building', 'building')
      .leftJoinAndSelect('alloc.room', 'room')
      .leftJoinAndSelect('alloc.bed', 'bed')
      .where('alloc.isActive = true');

    if (buildingId) query.andWhere('alloc.buildingId = :buildingId', { buildingId });
    query.orderBy('alloc.createdAt', 'DESC').skip((page - 1) * limit).take(limit);

    const [data, total] = await query.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async findTenantAllocation(tenantId: string): Promise<TenantAllocation> {
    const alloc = await this.allocationRepo.findOne({
      where: { tenantId, isActive: true },
      relations: { tenant: true, building: true, room: true, bed: true },
    });
    if (!alloc) throw new NotFoundException('No active allocation found for this tenant');
    return alloc;
  }

  async getAllocationById(id: string): Promise<TenantAllocation> {
    const alloc = await this.allocationRepo.findOne({
      where: { id },
      relations: { tenant: true, building: true, room: true, bed: true },
    });
    if (!alloc) throw new NotFoundException('Allocation not found');
    return alloc;
  }
}
