import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { PaymentMethod } from '../../../common/enums/payment-status.enum';
import { RentInvoice } from './rent-invoice.entity';

@Entity('payments')
export class Payment extends BaseEntity {
  @Column({ name: 'invoice_id' })
  invoiceId: string;

  @ManyToOne(() => RentInvoice, (inv) => inv.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice: RentInvoice;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'tenant_id' })
  tenant: User;

  @Column({ name: 'razorpay_order_id', nullable: true })
  razorpayOrderId?: string;

  @Column({ name: 'razorpay_payment_id', nullable: true })
  razorpayPaymentId?: string;

  @Column({ name: 'razorpay_signature', nullable: true })
  razorpaySignature?: string;

  @Column({ name: 'transaction_id', nullable: true })
  transactionId?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.RAZORPAY })
  method: PaymentMethod;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt?: Date;

  @Column({ name: 'receipt_url', nullable: true })
  receiptUrl?: string;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;
}
