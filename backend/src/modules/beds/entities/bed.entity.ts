import { Entity, Column, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Room } from '../../rooms/entities/room.entity';

@Entity('beds')
export class Bed extends BaseEntity {
  @Column({ name: 'bed_number' })
  bedNumber: string;

  @Column({ name: 'room_id' })
  roomId: string;

  @ManyToOne(() => Room, (room) => room.beds, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ name: 'is_occupied', default: false })
  isOccupied: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'description', nullable: true })
  description?: string;
}
