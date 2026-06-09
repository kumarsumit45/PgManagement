import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Building } from '../../buildings/entities/building.entity';

export enum NoticeType {
  GENERAL = 'general',
  MAINTENANCE = 'maintenance',
  EVENT = 'event',
  RENT = 'rent',
  URGENT = 'urgent',
}

@Entity('notices')
export class Notice extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: NoticeType, default: NoticeType.GENERAL })
  type: NoticeType;

  @Column({ name: 'published_by_id' })
  publishedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'published_by_id' })
  publishedBy: User;

  @Column({ name: 'building_id', nullable: true })
  buildingId?: string;

  @ManyToOne(() => Building, { nullable: true })
  @JoinColumn({ name: 'building_id' })
  building?: Building;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt?: Date;
}
