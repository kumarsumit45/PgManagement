import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import { RentInvoice } from './entities/rent-invoice.entity';
import { Payment } from './entities/payment.entity';
import {
  GenerateInvoiceDto,
  CreateRazorpayOrderDto,
  VerifyPaymentDto,
  RecordCashPaymentDto,
} from './dto/payment.dto';
import { PaymentStatus, PaymentMethod } from '../../common/enums/payment-status.enum';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class PaymentsService {
  private razorpay: Razorpay;

  constructor(
    @InjectRepository(RentInvoice) private invoiceRepo: Repository<RentInvoice>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    private configService: ConfigService,
  ) {
    this.razorpay = new Razorpay({
      key_id: this.configService.get('RAZORPAY_KEY_ID'),
      key_secret: this.configService.get('RAZORPAY_KEY_SECRET'),
    });
  }

  async generateInvoice(dto: GenerateInvoiceDto): Promise<RentInvoice> {
    const existing = await this.invoiceRepo.findOne({
      where: { tenantId: dto.tenantId, month: dto.month },
    });
    if (existing) throw new BadRequestException('Invoice already exists for this month');

    const totalAmount =
      dto.amount + (dto.lateFee || 0) - (dto.discount || 0);

    const invoice = this.invoiceRepo.create({
      ...dto,
      totalAmount,
      dueDate: new Date(dto.dueDate),
      invoiceNumber: `INV-${Date.now()}`,
      status: PaymentStatus.PENDING,
    });

    return this.invoiceRepo.save(invoice);
  }

  async createRazorpayOrder(dto: CreateRazorpayOrderDto) {
    const invoice = await this.invoiceRepo.findOne({ where: { id: dto.invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status === PaymentStatus.PAID)
      throw new BadRequestException('Invoice already paid');

    const order = await this.razorpay.orders.create({
      amount: Math.round(invoice.totalAmount * 100),
      currency: 'INR',
      receipt: invoice.invoiceNumber,
      notes: { invoiceId: invoice.id, tenantId: invoice.tenantId },
    });

    await this.paymentRepo.save(
      this.paymentRepo.create({
        invoiceId: invoice.id,
        tenantId: invoice.tenantId,
        razorpayOrderId: order.id,
        amount: invoice.totalAmount,
        method: PaymentMethod.RAZORPAY,
      }),
    );

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: this.configService.get('RAZORPAY_KEY_ID'),
    };
  }

  async verifyPayment(dto: VerifyPaymentDto): Promise<{ message: string }> {
    const secret = this.configService.get('RAZORPAY_KEY_SECRET');
    const body = `${dto.razorpayOrderId}|${dto.razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== dto.razorpaySignature) {
      throw new BadRequestException('Payment signature verification failed');
    }

    const payment = await this.paymentRepo.findOne({
      where: { razorpayOrderId: dto.razorpayOrderId },
    });
    if (!payment) throw new NotFoundException('Payment record not found');

    await this.paymentRepo.update(payment.id, {
      razorpayPaymentId: dto.razorpayPaymentId,
      razorpaySignature: dto.razorpaySignature,
      paidAt: new Date(),
      isVerified: true,
    });

    await this.invoiceRepo.update(payment.invoiceId, {
      status: PaymentStatus.PAID,
    });

    return { message: 'Payment verified and recorded successfully' };
  }

  async handleWebhook(body: any, signature: string): Promise<void> {
    const secret = this.configService.get('RAZORPAY_WEBHOOK_SECRET');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(body))
      .digest('hex');

    if (expectedSignature !== signature) throw new BadRequestException('Invalid webhook signature');

    if (body.event === 'payment.captured') {
      const { order_id, id: paymentId } = body.payload.payment.entity;
      const payment = await this.paymentRepo.findOne({ where: { razorpayOrderId: order_id } });
      if (payment && !payment.isVerified) {
        await this.paymentRepo.update(payment.id, { razorpayPaymentId: paymentId, isVerified: true, paidAt: new Date() });
        await this.invoiceRepo.update(payment.invoiceId, { status: PaymentStatus.PAID });
      }
    }
  }

  async recordCashPayment(dto: RecordCashPaymentDto, recordedBy: string): Promise<Payment> {
    const invoice = await this.invoiceRepo.findOne({ where: { id: dto.invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status === PaymentStatus.PAID) throw new BadRequestException('Invoice already paid');

    const payment = await this.paymentRepo.save(
      this.paymentRepo.create({
        invoiceId: dto.invoiceId,
        tenantId: invoice.tenantId,
        amount: dto.amount,
        transactionId: dto.transactionId || `CASH-${Date.now()}`,
        method: PaymentMethod.CASH,
        paidAt: new Date(),
        isVerified: true,
      }),
    );

    await this.invoiceRepo.update(dto.invoiceId, { status: PaymentStatus.PAID });
    return payment;
  }

  async getTenantInvoices(tenantId: string, pagination: PaginationDto) {
    const { page, limit } = pagination;
    const [data, total] = await this.invoiceRepo.findAndCount({
      where: { tenantId },
      relations: { payments: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return paginate(data, total, page, limit);
  }

  async getInvoiceById(id: string): Promise<RentInvoice> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: { tenant: true, payments: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async getDueInvoices() {
    const today = new Date();
    return this.invoiceRepo
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.tenant', 'tenant')
      .where('inv.status = :status', { status: PaymentStatus.PENDING })
      .andWhere('inv.dueDate <= :today', { today })
      .getMany();
  }

  async getRevenueReport(month?: string) {
    const query = this.paymentRepo
      .createQueryBuilder('p')
      .select('SUM(p.amount)', 'totalRevenue')
      .addSelect('COUNT(*)', 'totalPayments')
      .where('p.isVerified = true');

    if (month) {
      query
        .innerJoin('p.invoice', 'inv')
        .andWhere('inv.month = :month', { month });
    }

    return query.getRawOne();
  }
}
