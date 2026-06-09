import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Building } from '../../buildings/entities/building.entity';
import { Room } from '../../rooms/entities/room.entity';
import { Bed } from '../../beds/entities/bed.entity';

@Entity('tenant_allocations')
export class TenantAllocation extends BaseEntity {
  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: User;

  @Column({ name: 'building_id' })
  buildingId: string;

  @ManyToOne(() => Building)
  @JoinColumn({ name: 'building_id' })
  building: Building;

  @Column({ name: 'room_id' })
  roomId: string;

  @ManyToOne(() => Room)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ name: 'bed_id' })
  bedId: string;

  @ManyToOne(() => Bed)
  @JoinColumn({ name: 'bed_id' })
  bed: Bed;

  @Column({ name: 'joining_date', type: 'date' })
  joiningDate: Date;

  @Column({ name: 'leaving_date', type: 'date', nullable: true })
  leavingDate?: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'security_deposit', type: 'decimal', precision: 10, scale: 2, default: 0 })
  securityDeposit: number;

  @Column({ name: 'monthly_rent', type: 'decimal', precision: 10, scale: 2 })
  monthlyRent: number;

  @Column({ name: 'rent_due_day', default: 5 })
  rentDueDay: number;

  @Column({ name: 'emergency_contact_name', nullable: true })
  emergencyContactName?: string;

  @Column({ name: 'emergency_contact_phone', nullable: true })
  emergencyContactPhone?: string;

  @Column({ name: 'kyc_documents', type: 'simple-json', nullable: true })
  kycDocuments?: {
    idType: string;
    idNumber: string;
    frontImage: string;
    backImage?: string;
  };
}
