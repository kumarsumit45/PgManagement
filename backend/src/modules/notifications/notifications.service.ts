import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Notification, NotificationType } from './entities/notification.entity';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    private configService: ConfigService,
  ) {}

  async create(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = NotificationType.SYSTEM,
    referenceId?: string,
    referenceType?: string,
    data?: Record<string, any>,
  ): Promise<Notification> {
    const notification = this.notificationRepo.create({
      userId,
      title,
      message,
      type,
      referenceId,
      referenceType,
      data,
    });
    const saved = await this.notificationRepo.save(notification);
    // Push via FCM (fire and forget)
    this.sendPush(userId, title, message, data).catch(() => {});
    return saved;
  }

  async sendBulk(
    userIds: string[],
    title: string,
    message: string,
    type: NotificationType,
  ): Promise<void> {
    const notifications = userIds.map((userId) =>
      this.notificationRepo.create({ userId, title, message, type }),
    );
    await this.notificationRepo.save(notifications);
  }

  async findAllForUser(userId: string, pagination: PaginationDto) {
    const { page, limit } = pagination;
    const [data, total] = await this.notificationRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return paginate(data, total, page, limit);
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await this.notificationRepo.update({ id, userId }, { isRead: true });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationRepo.update({ userId, isRead: false }, { isRead: true });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.count({ where: { userId, isRead: false } });
  }

  private async sendPush(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    // Integrate firebase-admin here for FCM push notifications
    // const { getMessaging } = await import('firebase-admin/messaging');
    // await getMessaging().send({ notification: { title, body }, data, token: fcmToken });
    console.log(`[FCM] Push to user ${userId}: ${title}`);
  }
}
