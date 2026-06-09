import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto, UpdateUserRoleDto } from './dto/update-user.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  async findAll(pagination: PaginationDto, role?: Role) {
    const { page, limit } = pagination;
    const query = this.userRepo.createQueryBuilder('user');
    if (role) query.where('user.role = :role', { role });
    query.orderBy('user.createdAt', 'DESC');
    query.skip((page - 1) * limit).take(limit);
    const [data, total] = await query.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async update(id: string, dto: UpdateUserDto, requesterId: string): Promise<User> {
    if (id !== requesterId) throw new ForbiddenException('Cannot update another user');
    await this.userRepo.update(id, dto);
    return this.findById(id);
  }

  async updateRole(id: string, dto: UpdateUserRoleDto): Promise<User> {
    await this.findById(id);
    await this.userRepo.update(id, { role: dto.role });
    return this.findById(id);
  }

  async deactivate(id: string): Promise<{ message: string }> {
    await this.findById(id);
    await this.userRepo.update(id, { isActive: false });
    return { message: 'User deactivated successfully' };
  }

  async activate(id: string): Promise<{ message: string }> {
    await this.findById(id);
    await this.userRepo.update(id, { isActive: true });
    return { message: 'User activated successfully' };
  }
}
