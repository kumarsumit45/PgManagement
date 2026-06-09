import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { appConfig, databaseConfig, redisConfig, jwtConfig } from './config';

// Core modules
import { RedisModule } from './modules/redis/redis.module';
import { UploadModule } from './modules/upload/upload.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BuildingsModule } from './modules/buildings/buildings.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { BedsModule } from './modules/beds/beds.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { ComplaintsModule } from './modules/complaints/complaints.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NoticesModule } from './modules/notices/notices.module';
import { VisitorsModule } from './modules/visitors/visitors.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

// Guards, filters, interceptors
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

// Background jobs
import { RentReminderJob } from './jobs/rent-reminder.job';
import { RentInvoice } from './modules/payments/entities/rent-invoice.entity';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, jwtConfig],
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get('database'),
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE_TTL', 60) * 1000,
            limit: config.get<number>('THROTTLE_LIMIT', 60),
          },
        ],
      }),
    }),

    // Cron jobs
    ScheduleModule.forRoot(),

    // Global modules
    RedisModule,
    UploadModule,
    NotificationsModule,

    // Feature modules
    AuthModule,
    UsersModule,
    BuildingsModule,
    RoomsModule,
    BedsModule,
    TenantsModule,
    ComplaintsModule,
    PaymentsModule,
    NoticesModule,
    VisitorsModule,
    DashboardModule,

    // For RentReminderJob
    TypeOrmModule.forFeature([RentInvoice]),
  ],
  providers: [
    // Global JWT guard — all routes protected unless @Public()
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Global exception filter
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    // Global response interceptor
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    // Global logging interceptor
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    // Background jobs
    RentReminderJob,
  ],
})
export class AppModule {}
