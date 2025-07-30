# Migrating from TypeORM to Prisma

This guide outlines the steps required to complete the migration from TypeORM to Prisma in the Taskosaur backend.

## Completed Steps

1. ✅ Installed Prisma dependencies
2. ✅ Created Prisma schema based on TypeORM entities
3. ✅ Updated database configuration
4. ✅ Set up Prisma service and module
5. ✅ Updated app module to use Prisma instead of TypeORM
6. ✅ Updated package.json scripts
7. ✅ Migrated the User service and module as an example

## Remaining Steps

1. Migrate the remaining modules:
   - Workspaces
   - Projects
   - Tasks
   - Tags

2. For each module, follow these steps (using the Users module as a reference):
   - Update the service file to use Prisma instead of TypeORM repositories
   - Update the module file to remove TypeORM imports and dependencies
   - Update the controller file to import models from `@prisma/client` instead of entity files

3. Run migration and sync database:
   ```bash
   npx prisma migrate dev --name init
   ```

4. Optional: Seed the database with initial data:
   ```bash
   # Create a seed file
   mkdir -p prisma/seed
   touch prisma/seed/index.ts
   
   # Update package.json to add seed script
   # Add to scripts: "prisma:seed": "ts-node prisma/seed/index.ts"
   ```

5. Update or remove the TypeORM entity files (they're not needed by Prisma but can be kept as reference)

6. Remove TypeORM configuration files that are no longer needed:
   - src/config/typeorm.config.ts
   - src/config/database.config.ts (unless repurposed for other database configurations)

## Using Prisma in Development

- View and edit your database with Prisma Studio:
  ```bash
  npx prisma studio
  ```

- After schema changes, regenerate the Prisma client:
  ```bash
  npx prisma generate
  ```

- Create migrations after schema changes:
  ```bash
  npx prisma migrate dev --name descriptive_name
  ```

## Example: Migrating a Service

Original TypeORM service:
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entity } from './entity.entity';

@Injectable()
export class SomeService {
  constructor(
    @InjectRepository(Entity)
    private repository: Repository<Entity>,
  ) {}

  findAll() {
    return this.repository.find();
  }
}
```

Migrated Prisma service:
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SomeService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.entity.findMany();
  }
}
```

## Example: Migrating a Module

Original TypeORM module:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Entity } from './entity.entity';
import { SomeController } from './some.controller';
import { SomeService } from './some.service';

@Module({
  imports: [TypeOrmModule.forFeature([Entity])],
  controllers: [SomeController],
  providers: [SomeService],
  exports: [SomeService],
})
export class SomeModule {}
```

Migrated Prisma module:
```typescript
import { Module } from '@nestjs/common';
import { SomeController } from './some.controller';
import { SomeService } from './some.service';

@Module({
  controllers: [SomeController],
  providers: [SomeService],
  exports: [SomeService],
})
export class SomeModule {}
```

## Common Prisma Operations

| TypeORM                                   | Prisma                                     |
|-------------------------------------------|-------------------------------------------|
| `repository.find()`                       | `prisma.model.findMany()`                  |
| `repository.findOneBy({ id })`            | `prisma.model.findUnique({ where: { id }})` |
| `repository.save(entity)`                 | `prisma.model.create({ data })`            |
| `repository.update(id, data)`             | `prisma.model.update({ where: { id }, data })` |
| `repository.delete(id)`                   | `prisma.model.delete({ where: { id }})`    |
| `repository.createQueryBuilder()`         | Prisma has its own query API               |