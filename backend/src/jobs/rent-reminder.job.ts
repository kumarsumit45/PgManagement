import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { RentInvoice } from '../modules/payments/entities/rent-invoice.entity';
import { NotificationsService } from '../modules/notifications/notifications.service';
import { NotificationType } from '../modules/notifications/entities/notification.entity';
import { PaymentStatus } from '../common/enums/payment-status.enum';

@Injectable()
export class RentReminderJob {
  private readonly logger = new Logger(RentReminderJob.name);

  constructor(
    @InjectRepository(RentInvoice) private invoiceRepo: Repository<RentInvoice>,
    private notificationsService: NotificationsService,
  ) {}

  // Run every day at 9 AM
  @Cron('0 9 * * *')
  async sendRentDueReminders() {
    this.logger.log('Running rent due reminder job...');

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const upcomingDue = await this.invoiceRepo.find({
      where: {
        status: PaymentStatus.PENDING,
        dueDate: LessThanOrEqual(threeDaysFromNow),
      },
    });

    for (const invoice of upcomingDue) {
      await this.notificationsService.create(
        invoice.tenantId,
        'Rent Due Reminder',
        `Your rent of ₹${invoice.totalAmount} is due on ${invoice.dueDate.toDateString()}`,
        NotificationType.RENT_DUE,
        invoice.id,
        'invoice',
      );
    }

    this.logger.log(`Sent ${upcomingDue.length} rent due reminders`);
  }

  // Run every day at 10 AM — mark overdue invoices
  @Cron('0 10 * * *')
  async markOverdueInvoices() {
    this.logger.log('Marking overdue invoices...');
    const today = new Date();

    const overdueInvoices = await this.invoiceRepo.find({
      where: {
        status: PaymentStatus.PENDING,
        dueDate: LessThanOrEqual(today),
      },
    });

    for (const invoice of overdueInvoices) {
      await this.invoiceRepo.update(invoice.id, { status: PaymentStatus.OVERDUE });
      await this.notificationsService.create(
        invoice.tenantId,
        'Rent Overdue',
        `Your rent of ₹${invoice.totalAmount} is overdue. Please pay immediately to avoid late fees.`,
        NotificationType.RENT_OVERDUE,
        invoice.id,
        'invoice',
      );
    }

    this.logger.log(`Marked ${overdueInvoices.length} invoices as overdue`);
  }
}
