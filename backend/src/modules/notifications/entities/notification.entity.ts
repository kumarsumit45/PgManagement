import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  RENT_DUE = 'rent_due',
  RENT_OVERDUE = 'rent_overdue',
  PAYMENT_RECEIVED = 'payment_received',
  COMPLAINT_UPDATE = 'complaint_update',
  NOTICE = 'notice',
  VISITOR = 'visitor',
  ANNOUNCEMENT = 'announcement',
  SYSTEM = 'system',
}

@Entity('notifications')
export class Notification extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'enum', enum: NotificationType, default: NotificationType.SYSTEM })
  type: NotificationType;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ name: 'reference_id', nullable: true })
  referenceId?: string;

  @Column({ name: 'reference_type', nullable: true })
  referenceType?: string;

  @Column({ name: 'data', type: 'simple-json', nullable: true })
  data?: Record<string, any>;
}
