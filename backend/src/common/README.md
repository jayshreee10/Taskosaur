# Automatic Audit Trail System

This system automatically injects `createdBy` and `updatedBy` fields for all database operations, using either the current authenticated user or a system user as fallback.

## How It Works

1. **System User**: A special user (`00000000-0000-0000-0000-000000000000`) is created during seeding for system operations
2. **Request Context**: The `RequestContextInterceptor` captures the current user from the JWT token and stores it in AsyncLocalStorage
3. **Prisma Middleware**: The audit middleware automatically injects `createdBy` and `updatedBy` fields for all create/update operations
4. **Fallback Mechanism**: When no user context is available, the system user is used as fallback
5. **Global Application**: Applied globally through the AppModule

## System User

The system user (`00000000-0000-0000-0000-000000000000`):
- **Cannot authenticate**: Status is `INACTIVE` and has no password
- **Used for system operations**: Migrations, automated tasks, fallback scenarios
- **Created during seeding**: Always available as the first user in the database
- **Blocked from login**: Authentication service explicitly prevents login attempts

## Automatic Behavior

### Create Operations
```typescript
// Before: You had to manually add createdBy
const task = await this.prisma.task.create({
  data: {
    title: 'New Task',
    createdBy: currentUserId, // Manual
  }
});

// After: Automatic injection
const task = await this.prisma.task.create({
  data: {
    title: 'New Task',
    // createdBy is automatically set to current user
  }
});
```

### Update Operations
```typescript
// Before: Manual updatedBy
const task = await this.prisma.task.update({
  where: { id: taskId },
  data: {
    title: 'Updated Task',
    updatedBy: currentUserId, // Manual
  }
});

// After: Automatic injection
const task = await this.prisma.task.update({
  where: { id: taskId },
  data: {
    title: 'Updated Task',
    // updatedBy is automatically set to current user
  }
});
```

## Manual Override

You can still manually set these fields if needed:

```typescript
const task = await this.prisma.task.create({
  data: {
    title: 'System Generated Task',
    createdBy: 'system-user-id', // Manual override
  }
});
```

## System Operations

### Automatic System User Fallback
Operations without user context automatically use the system user:

```typescript
// ✅ No user context - automatically uses system user
const task = await this.prisma.task.create({
  data: {
    title: 'Automated Task',
    // createdBy will be '00000000-0000-0000-0000-000000000000'
  }
});
```

### Manual System Operations
For explicit system operations:

```typescript
import { AuditService } from '../common/audit.service';

@Injectable()
export class SystemService {
  constructor(private auditService: AuditService) {}

  async createSystemTask() {
    // Option 1: Run as system user explicitly
    return this.auditService.runAsSystem(() => {
      return this.prisma.task.create({
        data: {
          title: 'System Task',
          // createdBy will be system user ID
        }
      });
    });

    // Option 2: Check if current user is system
    if (this.auditService.isSystemUser()) {
      console.log('Running as system user');
    }

    // Option 3: Get system user ID
    const systemUserId = this.auditService.getSystemUserId();
  }
}
```

## Supported Models

The following models have automatic audit trail support:
- User, Organization, OrganizationMember
- Workspace, WorkspaceMember
- Project, ProjectMember
- Task, TaskDependency, TaskLabel, TaskWatcher, TaskComment, TaskAttachment
- TimeEntry, Workflow, TaskStatus, StatusTransition
- Sprint, Label, CustomField
- Notification, ActivityLog
- AutomationRule, RuleExecution

## Configuration

### Adding New Models
To add audit support for new models:

1. Add the model name to `AUDITABLE_MODELS` in `audit.middleware.ts`
2. Ensure your Prisma schema has `createdBy` and `updatedBy` fields
3. Add the corresponding User relations

### Excluding Fields from Updates
Fields listed in `EXCLUDED_UPDATE_FIELDS` won't trigger `updatedBy` updates:
- `createdAt`
- `updatedAt` 
- `createdBy`

## Debugging

Check if user context is available:
```typescript
import { AuditService } from '../common/audit.service';

if (!this.auditService.hasUserContext()) {
  console.log('No user context available');
}

const currentUserId = this.auditService.getCurrentUserId();
console.log('Current user:', currentUserId);
```

## Migration Notes

1. **Database Seeding**: Run `npm run seed` to create the system user
2. **Existing Services**: Remove manual `createdBy`/`updatedBy` assignments - they're now automatic
3. **DTOs**: Remove `createdBy`/`updatedBy` from DTOs as they shouldn't come from client
4. **System Operations**: Operations without user context automatically use system user
5. **Testing**: Use `runWithUserContext` or `runAsSystem` in tests

## Seeding

The system user is automatically created during database seeding:

```bash
# Create system user and other seed data
npm run seed

# The system user will be created first with ID: 00000000-0000-0000-0000-000000000000
```

## Security

- **System user cannot login**: Authentication is explicitly blocked
- **Status is INACTIVE**: Prevents any accidental authentication attempts  
- **No password**: The password field is null
- **Audit trail**: All system operations are properly tracked