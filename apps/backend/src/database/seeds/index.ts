import * as bcrypt from 'bcryptjs';
import { AppDataSource } from '../data-source';

async function seed() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository('users');

  const existing = await userRepo.findOne({ where: { email: 'admin@trackflow.uz' } });
  if (existing) {
    console.log('Seed user already exists, skipping.');
    await AppDataSource.destroy();
    return;
  }

  const passwordHash = await bcrypt.hash('admin123', 10);

  await userRepo.save({
    email: 'admin@trackflow.uz',
    passwordHash,
    firstName: 'Admin',
    lastName: 'User',
    role: 'SUPER_ADMIN',
    companyId: '00000000-0000-0000-0000-000000000001',
    isActive: true,
  });

  console.log('✓ Seed user created: admin@trackflow.uz / admin123');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
