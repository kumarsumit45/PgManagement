import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Building } from '../../buildings/entities/building.entity';
import { Bed } from '../../beds/entities/bed.entity';
import { RoomType } from '../../../common/enums/room-type.enum';

@Entity('rooms')
export class Room extends BaseEntity {
  @Column({ name: 'room_number' })
  roomNumber: string;

  @Column({ name: 'building_id' })
  buildingId: string;

  @ManyToOne(() => Building, (building) => building.rooms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'building_id' })
  building: Building;

  @Column({ type: 'enum', enum: RoomType, default: RoomType.SINGLE })
  type: RoomType;

  @Column()
  capacity: number;

  @Column({ name: 'rent_amount', type: 'decimal', precision: 10, scale: 2 })
  rentAmount: number;

  @Column({ name: 'floor_number', default: 1 })
  floorNumber: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'simple-array', nullable: true })
  amenities?: string[];

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @OneToMany(() => Bed, (bed) => bed.room, { cascade: true })
  beds: Bed[];
}
