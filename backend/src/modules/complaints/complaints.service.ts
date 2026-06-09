import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Complaint, ComplaintImage } from './entities/complaint.entity';
import { CreateComplaintDto, UpdateComplaintStatusDto } from './dto/complaint.dto';
import { UploadService } from '../upload/upload.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import { ComplaintStatus } from '../../common/enums/complaint-status.enum';
import { Role } from '../../common/enums/role.enum';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ComplaintsService {
  constructor(
    @InjectRepository(Complaint) private complaintRepo: Repository<Complaint>,
    @InjectRepository(ComplaintImage) private imageRepo: Repository<ComplaintImage>,
    private uploadService: UploadService,
  ) {}

  async create(
    dto: CreateComplaintDto,
    tenantId: string,
    files?: Express.Multer.File[],
  ): Promise<Complaint> {
    const complaint = this.complaintRepo.create({ ...dto, tenantId });
    const saved = await this.complaintRepo.save(complaint);

    if (files?.length) {
      const imageEntities = await Promise.all(
        files.map(async (file) => {
          const { url, publicId } = await this.uploadService.uploadBuffer(
            file.buffer,
            'complaints',
            `${saved.id}_${Date.now()}`,
          );
          return this.imageRepo.create({ complaintId: saved.id, imageUrl: url, publicId });
        }),
      );
      await this.imageRepo.save(imageEntities);
    }

    return this.findOne(saved.id);
  }

  async findAll(
    pagination: PaginationDto,
    user: User,
    status?: ComplaintStatus,
  ) {
    const { page, limit } = pagination;
    const query = this.complaintRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.tenant', 'tenant')
      .leftJoinAndSelect('c.assignedTo', 'assignedTo')
      .leftJoinAndSelect('c.images', 'images');

    if (user.role === Role.TENANT) {
      query.where('c.tenantId = :tenantId', { tenantId: user.id });
    }

    if (status) query.andWhere('c.status = :status', { status });

    query.orderBy('c.createdAt', 'DESC').skip((page - 1) * limit).take(limit);

    const [data, total] = await query.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async findOne(id: string): Promise<Complaint> {
    const complaint = await this.complaintRepo.findOne({
      where: { id },
      relations: { tenant: true, assignedTo: true, images: true },
    });
    if (!complaint) throw new NotFoundException('Complaint not found');
    return complaint;
  }

  async updateStatus(
    id: string,
    dto: UpdateComplaintStatusDto,
    requestingUser: User,
  ): Promise<Complaint> {
    const complaint = await this.findOne(id);

    if (
      requestingUser.role === Role.TENANT &&
      complaint.tenantId !== requestingUser.id
    ) {
      throw new ForbiddenException('Cannot update another tenant complaint');
    }

    const updateData: Partial<Complaint> = {
      status: dto.status,
      resolutionNote: dto.resolutionNote,
    };

    if (dto.assignedToId) updateData.assignedToId = dto.assignedToId;
    if (dto.status === ComplaintStatus.RESOLVED) {
      updateData.resolvedAt = new Date();
    }

    await this.complaintRepo.update(id, updateData);
    return this.findOne(id);
  }

  async getAnalytics() {
    const stats = await this.complaintRepo
      .createQueryBuilder('c')
      .select('c.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('c.status')
      .getRawMany();

    const byCategory = await this.complaintRepo
      .createQueryBuilder('c')
      .select('c.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('c.category')
      .getRawMany();

    return { byStatus: stats, byCategory };
  }
}
