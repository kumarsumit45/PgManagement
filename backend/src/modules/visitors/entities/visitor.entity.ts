import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum VisitorStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CHECKED_OUT = 'checked_out',
}

@Entity('visitors')
export class Visitor extends BaseEntity {
  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: User;

  @Column({ name: 'visitor_name' })
  visitorName: string;

  @Column({ name: 'visitor_phone' })
  visitorPhone: string;

  @Column({ name: 'visitor_id_type', nullable: true })
  visitorIdType?: string;

  @Column({ name: 'visitor_id_number', nullable: true })
  visitorIdNumber?: string;

  @Column({ name: 'purpose', nullable: true })
  purpose?: string;

  @Column({ type: 'enum', enum: VisitorStatus, default: VisitorStatus.PENDING })
  status: VisitorStatus;

  @Column({ name: 'check_in', type: 'timestamp', nullable: true })
  checkIn?: Date;

  @Column({ name: 'check_out', type: 'timestamp', nullable: true })
  checkOut?: Date;

  @Column({ name: 'approved_by_id', nullable: true })
  approvedById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by_id' })
  approvedBy?: User;
}
