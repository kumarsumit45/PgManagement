import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Room } from '../../rooms/entities/room.entity';

@Entity('buildings')
export class Building extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'text' })
  address: string;

  @Column()
  city: string;

  @Column({ nullable: true })
  state?: string;

  @Column({ name: 'pincode', nullable: true })
  pincode?: string;

  @Column({ name: 'contact_number', nullable: true })
  contactNumber?: string;

  @Column({ name: 'total_floors', default: 1 })
  totalFloors: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'amenities', type: 'simple-array', nullable: true })
  amenities?: string[];

  @Column({ name: 'rules', type: 'text', nullable: true })
  rules?: string;

  @OneToMany(() => Room, (room) => room.building)
  rooms: Room[];
}
