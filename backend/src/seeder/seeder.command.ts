import { NestFactory } from '@nestjs/core';
import { SeederModule } from './seeder.module';
import { SeederService } from './seeder.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeederModule);
  const seederService = app.get(SeederService);

  const command = process.argv[2];

  try {
    switch (command) {
      case 'seed':
        console.log('🚀 Starting core modules seeding...\n');
        await seederService.seedCoreModules();
        console.log('\n🎉 Core modules seeding completed successfully!');
        break;

      case 'clear':
        console.log('🚀 Starting core modules clearing...\n');
        await seederService.clearCoreModules();
        console.log('\n🎉 Core modules clearing completed successfully!');
        break;

      case 'reset':
        console.log('🚀 Starting core modules reset...\n');
        await seederService.clearCoreModules();
        console.log('✅ Existing data cleared\n');
        await seederService.seedCoreModules();
        console.log('\n🎉 Core modules reset completed successfully!');
        break;

      default:
        console.log(`
🌱 Core Modules Seeder Commands:

  npm run seed:core seed    - Seed core modules (Users, Organizations, Workspaces, Projects)
  npm run seed:core clear   - Clear all core modules data
  npm run seed:core reset   - Clear and re-seed core modules

Usage: npm run seed:core <command>
        `);
        break;
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
