import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { Bed } from '../beds/entities/bed.entity';
import { CreateRoomDto, UpdateRoomDto } from './dto/room.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room) private roomRepo: Repository<Room>,
    @InjectRepository(Bed) private bedRepo: Repository<Bed>,
  ) {}

  async create(dto: CreateRoomDto): Promise<Room> {
    const room = this.roomRepo.create(dto);
    const savedRoom = await this.roomRepo.save(room);

    // Auto-create beds based on capacity
    const beds = Array.from({ length: dto.capacity }, (_, i) =>
      this.bedRepo.create({
        bedNumber: `Bed-${i + 1}`,
        roomId: savedRoom.id,
        isOccupied: false,
      }),
    );
    await this.bedRepo.save(beds);

    return this.findOne(savedRoom.id);
  }

  async findAll(pagination: PaginationDto, buildingId?: string) {
    const { page, limit } = pagination;
    const query = this.roomRepo.createQueryBuilder('room')
      .leftJoinAndSelect('room.beds', 'bed')
      .leftJoinAndSelect('room.building', 'building');

    if (buildingId) query.where('room.buildingId = :buildingId', { buildingId });

    query.orderBy('room.roomNumber', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await query.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async findOne(id: string): Promise<Room> {
    const room = await this.roomRepo.findOne({
      where: { id },
      relations: { beds: true, building: true },
    });
    if (!room) throw new NotFoundException(`Room ${id} not found`);
    return room;
  }

  async findVacantRooms(buildingId?: string) {
    const query = this.roomRepo.createQueryBuilder('room')
      .leftJoinAndSelect('room.beds', 'bed', 'bed.isOccupied = false AND bed.isActive = true')
      .where('room.isActive = true')
      .andWhere(
        'EXISTS (SELECT 1 FROM beds b WHERE b.room_id = room.id AND b.is_occupied = false AND b.is_active = true)',
      );

    if (buildingId) query.andWhere('room.buildingId = :buildingId', { buildingId });

    return query.getMany();
  }

  async update(id: string, dto: UpdateRoomDto): Promise<Room> {
    await this.findOne(id);
    await this.roomRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const room = await this.findOne(id);
    const hasOccupied = room.beds?.some((b) => b.isOccupied);
    if (hasOccupied) throw new BadRequestException('Cannot delete a room with occupied beds');
    await this.roomRepo.softDelete(id);
    return { message: 'Room deleted successfully' };
  }
}
