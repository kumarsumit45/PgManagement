import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Visitor, VisitorStatus } from './entities/visitor.entity';
import { CreateVisitorDto, UpdateVisitorStatusDto } from './dto/visitor.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class VisitorsService {
  constructor(
    @InjectRepository(Visitor) private visitorRepo: Repository<Visitor>,
  ) {}

  async create(dto: CreateVisitorDto, tenantId: string): Promise<Visitor> {
    const visitor = this.visitorRepo.create({ ...dto, tenantId });
    return this.visitorRepo.save(visitor);
  }

  async findAll(pagination: PaginationDto, tenantId?: string) {
    const { page, limit } = pagination;
    const query = this.visitorRepo
      .createQueryBuilder('v')
      .leftJoinAndSelect('v.tenant', 'tenant')
      .leftJoinAndSelect('v.approvedBy', 'approvedBy');

    if (tenantId) query.where('v.tenantId = :tenantId', { tenantId });

    query.orderBy('v.createdAt', 'DESC').skip((page - 1) * limit).take(limit);
    const [data, total] = await query.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async updateStatus(
    id: string,
    dto: UpdateVisitorStatusDto,
    approverId: string,
  ): Promise<Visitor> {
    const visitor = await this.visitorRepo.findOne({ where: { id } });
    if (!visitor) throw new NotFoundException('Visitor not found');

    const update: Partial<Visitor> = {
      status: dto.status,
      approvedById: approverId,
    };

    if (dto.status === VisitorStatus.APPROVED) update.checkIn = new Date();
    if (dto.status === VisitorStatus.CHECKED_OUT) update.checkOut = new Date();

    await this.visitorRepo.update(id, update);
    return this.visitorRepo.findOne({ where: { id }, relations: { tenant: true, approvedBy: true } });
  }
}
