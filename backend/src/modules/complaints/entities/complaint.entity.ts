import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import {
  ComplaintStatus,
  ComplaintCategory,
  ComplaintPriority,
} from '../../../common/enums/complaint-status.enum';

@Entity('complaints')
export class Complaint extends BaseEntity {
  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: User;

  @Column({ name: 'assigned_to_id', nullable: true })
  assignedToId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo?: User;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: ComplaintCategory, default: ComplaintCategory.OTHER })
  category: ComplaintCategory;

  @Column({ type: 'enum', enum: ComplaintPriority, default: ComplaintPriority.MEDIUM })
  priority: ComplaintPriority;

  @Column({ type: 'enum', enum: ComplaintStatus, default: ComplaintStatus.OPEN })
  status: ComplaintStatus;

  @Column({ name: 'resolution_note', type: 'text', nullable: true })
  resolutionNote?: string;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt?: Date;

  @OneToMany(() => ComplaintImage, (img) => img.complaint, { cascade: true })
  images: ComplaintImage[];
}

@Entity('complaint_images')
export class ComplaintImage extends BaseEntity {
  @Column({ name: 'complaint_id' })
  complaintId: string;

  @ManyToOne(() => Complaint, (c) => c.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'complaint_id' })
  complaint: Complaint;

  @Column({ name: 'image_url', type: 'text' })
  imageUrl: string;

  @Column({ name: 'public_id', nullable: true })
  publicId?: string;
}
