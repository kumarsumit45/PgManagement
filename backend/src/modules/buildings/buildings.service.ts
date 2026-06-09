import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Building } from './entities/building.entity';
import { CreateBuildingDto, UpdateBuildingDto } from './dto/building.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class BuildingsService {
  constructor(
    @InjectRepository(Building) private buildingRepo: Repository<Building>,
  ) {}

  async create(dto: CreateBuildingDto): Promise<Building> {
    const building = this.buildingRepo.create(dto);
    return this.buildingRepo.save(building);
  }

  async findAll(pagination: PaginationDto) {
    const { page, limit } = pagination;
    const [data, total] = await this.buildingRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return paginate(data, total, page, limit);
  }

  async findOne(id: string): Promise<Building> {
    const building = await this.buildingRepo.findOne({
      where: { id },
      relations: { rooms: { beds: true } },
    });
    if (!building) throw new NotFoundException(`Building ${id} not found`);
    return building;
  }

  async update(id: string, dto: UpdateBuildingDto): Promise<Building> {
    await this.findOne(id);
    await this.buildingRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);
    await this.buildingRepo.softDelete(id);
    return { message: 'Building deleted successfully' };
  }

  async getOccupancyStats(id: string) {
    const building = await this.findOne(id);
    let totalBeds = 0;
    let occupiedBeds = 0;
    building.rooms?.forEach((room) => {
      room.beds?.forEach((bed) => {
        totalBeds++;
        if (bed.isOccupied) occupiedBeds++;
      });
    });
    return {
      buildingId: id,
      name: building.name,
      totalRooms: building.rooms?.length || 0,
      totalBeds,
      occupiedBeds,
      vacantBeds: totalBeds - occupiedBeds,
      occupancyRate: totalBeds ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : '0',
    };
  }
}
