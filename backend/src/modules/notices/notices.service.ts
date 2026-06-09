import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notice } from './entities/notice.entity';
import { CreateNoticeDto, UpdateNoticeDto } from './dto/notice.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class NoticesService {
  constructor(
    @InjectRepository(Notice) private noticeRepo: Repository<Notice>,
  ) {}

  async create(dto: CreateNoticeDto, publishedById: string): Promise<Notice> {
    const notice = this.noticeRepo.create({
      ...dto,
      publishedById,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });
    return this.noticeRepo.save(notice);
  }

  async findAll(pagination: PaginationDto, buildingId?: string) {
    const { page, limit } = pagination;
    const query = this.noticeRepo
      .createQueryBuilder('n')
      .leftJoinAndSelect('n.publishedBy', 'publisher')
      .where('n.isActive = true')
      .andWhere('(n.expiresAt IS NULL OR n.expiresAt > NOW())');

    if (buildingId) {
      query.andWhere('(n.buildingId = :buildingId OR n.buildingId IS NULL)', { buildingId });
    }

    query.orderBy('n.createdAt', 'DESC').skip((page - 1) * limit).take(limit);
    const [data, total] = await query.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async findOne(id: string): Promise<Notice> {
    const notice = await this.noticeRepo.findOne({
      where: { id },
      relations: { publishedBy: true },
    });
    if (!notice) throw new NotFoundException('Notice not found');
    return notice;
  }

  async update(id: string, dto: UpdateNoticeDto): Promise<Notice> {
    await this.findOne(id);
    await this.noticeRepo.update(id, {
      ...dto,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);
    await this.noticeRepo.update(id, { isActive: false });
    return { message: 'Notice removed' };
  }
}
