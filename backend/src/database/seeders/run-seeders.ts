import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../../../.env') });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'pg_management',
  synchronize: true,
  entities: [join(__dirname, '../../**/*.entity{.ts,.js}')],
});

async function seed() {
  await AppDataSource.initialize();
  console.log('[Seeder] Connected to database');

  const userRepository = AppDataSource.getRepository('users');

  // Check if super admin already exists
  const existing = await userRepository.findOne({
    where: { email: 'superadmin@pgmanagement.com' },
  });

  if (!existing) {
    const hashedPassword = await bcrypt.hash('Admin@123456', 12);
    await userRepository.save({
      fullName: 'Super Admin',
      email: 'superadmin@pgmanagement.com',
      phoneNumber: '+919000000000',
      password: hashedPassword,
      role: 'super_admin',
      isActive: true,
      isPhoneVerified: true,
      isEmailVerified: true,
    });
    console.log('[Seeder] ✅ Super Admin created: superadmin@pgmanagement.com / Admin@123456');
  } else {
    console.log('[Seeder] Super Admin already exists, skipping.');
  }

  await AppDataSource.destroy();
  console.log('[Seeder] Done.');
}

seed().catch((err) => {
  console.error('[Seeder] Error:', err);
  process.exit(1);
});
