# Taskosaur

> **An Open-Source, Self-Hostable Alternative to Jira, Monday.com, and Enterprise Project Management**

<!-- Badges will be added here -->
![Node.js](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/typescript-%5E5.0.0-blue.svg)
![NestJS](https://img.shields.io/badge/nestjs-%5E11.0.0-red.svg)
![Next.js](https://img.shields.io/badge/nextjs-15.2.2-black.svg)
![PostgreSQL](https://img.shields.io/badge/postgresql-%3E%3D13-blue.svg)
![Redis](https://img.shields.io/badge/redis-%3E%3D6-red.svg)

**Take control of your project management.** Taskosaur aims to be a powerful, enterprise-grade project management platform that you can host on your own infrastructure. Built with modern technologies and designed to compete with commercial solutions, Taskosaur is working toward providing the features of Jira, Monday.com, and Asana without vendor lock-in, data privacy concerns, or subscription fees.

## Why Choose Taskosaur?

🏠 **Self-Hosted & Private** - Your data stays on your servers, under your control  
💰 **Cost-Effective** - No per-seat pricing or monthly subscriptions  
🔧 **Fully Customizable** - Modify and extend the platform to fit your exact needs  
🚀 **Modern Tech Stack** - Built with TypeScript, NestJS, Next.js, and PostgreSQL  
📱 **Enterprise Features** - Working toward advanced workflows, automation, analytics, and integrations  
🌍 **Open Source** - Transparent, community-driven development

## Table of Contents

- [Why Choose Taskosaur?](#why-choose-taskosaur)
- [Features](#features)
- [Quick Start](#quick-start)
- [Development](#development)
- [Project Structure](#project-structure)
- [Development Roadmap](#development-roadmap)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [FAQ](#faq)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)
- [Support](#support)

## Features

*Taskosaur is actively under development. The following features represent our planned capabilities, with many already implemented and others in progress.*

### Organization Management
- **Multi-tenant Architecture**: Planned support for multiple organizations with isolated data
- **Workspace Organization**: Group projects within workspaces for better organization
- **Role-based Access Control**: Implementing granular permissions (Admin, Manager, Member, Viewer)
- **Team Management**: Invite and manage team members across organizations

### Project Management
- **Flexible Project Structure**: Create and manage projects with custom workflows
- **Sprint Planning**: Planned agile sprint management with planning and tracking
- **Task Dependencies**: Working on relationships between tasks with various dependency types
- **Custom Workflows**: Implementing custom status workflows for different project needs

### Task Management
- **Rich Task Types**: Support for Tasks, Bugs, Epics, Stories, and Subtasks
- **Priority Management**: Set task priorities from Lowest to Highest
- **Custom Fields**: Add custom fields to capture project-specific data
- **Labels & Tags**: Organize tasks with customizable labels
- **Time Tracking**: Track time spent on tasks with detailed logging
- **File Attachments**: Attach files and documents to tasks
- **Comments & Mentions**: Collaborate through task comments with @mentions
- **Task Watchers**: Subscribe to task updates and notifications

### Multiple Views
- **Kanban Board**: Visual task management with drag-and-drop
- **Calendar View**: Planned schedule and timeline visualization
- **Gantt Charts**: Planned project timeline and dependency visualization
- **List View**: Traditional table-based task listing
- **Analytics Dashboard**: Working toward project metrics, burndown charts, and team velocity

### Automation & Integrations
- **Automation Rules**: Planned custom automation workflows
- **Email Notifications**: Automated email alerts for task updates
- **Real-time Updates**: Live updates using WebSocket connections
- **Activity Logging**: Comprehensive audit trail of all changes
- **Search Functionality**: Working toward global search across projects and tasks

### Analytics & Reporting
- **Sprint Burndown Charts**: Planned sprint progress tracking
- **Team Velocity**: Planned team performance monitoring over time
- **Task Distribution**: Working toward task allocation and workload analysis
- **Custom Reports**: Planned project-specific report generation

## Quick Start

### Prerequisites

- Node.js 22+ and npm
- PostgreSQL 13+
- Redis 6+ (for background jobs)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Taskosaur/taskosaur.git
   cd taskosaur
   ```

2. **Environment Setup**
   
   Run the interactive setup command to create your environment configuration:
   
   ```bash
   npm run setup
   ```
   
   This will create a single `.env` file with guided configuration for:
   - **Global Configuration**: App host and port settings
   - **Backend Configuration**: Database, authentication, Redis, email, and file upload settings
   - **Frontend Configuration**: API base URL and organization settings
   
   After setup, you'll need to manually run:
   ```bash
   # Install dependencies
   npm run be:install && npm run fe:install
   
   # Setup database
   npm run db:migrate
   npm run db:seed
   ```
   
3. **Manual Setup (Alternative)**
   
   If you prefer manual configuration, create a single environment file in the root directory:

   **Root Environment** (`.env`):
   ```env
   # Global/Proxy Configuration
   APP_HOST=127.0.0.1
   APP_PORT=9123

   #### Backend Configuration >>>>>
   BE_UNIX_SOCKET=1
   # BE_HOST=127.0.0.1  # Use when BE_UNIX_SOCKET=0
   # BE_PORT=9102       # Use when BE_UNIX_SOCKET=0
   
   BE_DATABASE_URL="postgresql://your-db-username:your-db-password@localhost:5432/taskosaur"
   
   # Authentication
   BE_JWT_SECRET="your-jwt-secret-key-change-this"
   BE_JWT_REFRESH_SECRET="your-refresh-secret-key-change-this-too"
   BE_JWT_EXPIRES_IN="15m"
   BE_JWT_REFRESH_EXPIRES_IN="7d"
   
   # Redis Configuration (for Bull Queue)
   BE_REDIS_HOST=localhost
   BE_REDIS_PORT=6379
   BE_REDIS_PASSWORD=
   
   # Email Configuration (for notifications)
   BE_SMTP_HOST=smtp.gmail.com
   BE_SMTP_PORT=587
   BE_SMTP_USER=your-email@gmail.com
   BE_SMTP_PASS=your-app-password
   BE_SMTP_FROM=noreply@taskosaur.com
   
   # Frontend URL (for email links)
   BE_FRONTEND_URL=http://127.0.0.1:9123
   
   # File Upload
   BE_UPLOAD_DEST="./uploads"
   BE_MAX_FILE_SIZE=10485760
   
   # Queue Configuration
   BE_MAX_CONCURRENT_JOBS=5
   BE_JOB_RETRY_ATTEMPTS=3
   #### Backend Configuration <<<<<

   #### Frontend Configuration >>>>>
   FE_UNIX_SOCKET=1
   # FE_HOST=127.0.0.1  # Use when FE_UNIX_SOCKET=0
   # FE_PORT=9101       # Use when FE_UNIX_SOCKET=0
   
   FE_NEXT_PUBLIC_API_BASE_URL=/api
   FE_NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID=your-default-organization-id-here
   #### Frontend Configuration <<<<<
   ```

   Then install dependencies and setup database:
   ```bash
   # Install dependencies (run from root directory)
   npm install
   npm run be:install         # Install backend dependencies
   npm run fe:install         # Install frontend dependencies
   
   # Setup database
   npm run db:migrate         # Run database migrations
   npm run db:seed            # Seed the database with core data
   ```

4. **Start the Application**
   ```bash
   # Development mode (with hot reload)
   npm run start:dev
   
   # Production mode
   npm start
   ```

5. **Access the Application**
   - Application: [http://127.0.0.1:9123](http://127.0.0.1:9123) (or your configured host/port)
   - Backend API: Check your backend configuration
   - API Documentation: Available at your backend URL + `/api/docs`

## Development

### Root Commands (Unified)
```bash
# Setup & Installation
npm run setup             # Interactive setup (create .env only)
npm run be:install        # Install backend dependencies  
npm run fe:install        # Install frontend dependencies

# Application Management
npm run start             # Start both backend and frontend in production
npm run start:dev         # Start both backend and frontend in development

# Database Operations
npm run db:migrate           # Run database migrations
npm run db:seed              # Seed database with core data  
npm run db:reset             # Reset database (deletes all data!)
npm run db:generate          # Generate Prisma client
```

### Backend Commands
```bash
# All commands run from root directory with environment variables loaded

# Development
npm run be:start:dev       # Start development server with hot reload
npm run be:build           # Build for production
npm run be:start:prod      # Start production server

# Database
npm run be:prisma:studio      # Open Prisma Studio
npm run be:prisma:migrate:dev # Create and apply migration
npm run be:prisma:generate    # Generate Prisma client

# Testing
npm run be:test            # Run unit tests
npm run be:test:watch      # Run tests in watch mode
npm run be:test:e2e        # Run end-to-end tests

# Code Quality
npm run be:lint            # Run ESLint
npm run be:format          # Format code with Prettier
```

### Frontend Commands
```bash
# All commands run from root directory with environment variables loaded

# Development
npm run fe:dev            # Start development server
npm run fe:build          # Build for production
npm run fe:start          # Start production server

# Code Quality
npm run fe:lint           # Run ESLint
```

## Project Structure

```
taskosaur/
├── backend/                 # NestJS Backend
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   ├── config/         # Configuration files
│   │   ├── gateway/        # WebSocket gateway
│   │   └── prisma/         # Database service
│   ├── prisma/             # Database schema and migrations
│   └── uploads/            # File uploads
├── frontend/               # Next.js Frontend
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── styles/        # CSS styles
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
└── README.md
```

## Development Roadmap

### Current Status
- Core project management features (in development)
- Basic task management with multiple views (in progress)
- User authentication and authorization
- Real-time updates via WebSocket (in development)
- Basic automation rules (planned)
- File attachments and comments (in development)

### Phase 1: Core Enhancements (Q2 2025)
- [ ] **Advanced Search & Filtering**
  - Global search with advanced filters
  - Saved search queries
  - Search within comments and attachments
  
- [ ] **Enhanced Notifications**
  - In-app notification center
  - Email notification templates
  - Slack/Discord integrations
  
- [ ] **Improved Analytics**
  - Advanced reporting dashboards
  - Export reports to PDF/Excel
  - Custom chart builders

### Phase 2: Collaboration Features (Q3 2025)
- [ ] **Advanced Commenting System**
  - Rich text editor with markdown support
  - Comment reactions and threading
  - @mention improvements with team suggestions
  
- [ ] **Real-time Collaboration**
  - Live cursor tracking in task editing
  - Collaborative document editing
  - Screen sharing integration
  
- [ ] **Mobile Application**
  - React Native mobile app
  - Offline capability
  - Push notifications

### Phase 3: Enterprise Features (Q4 2025)
- [ ] **Advanced Security**
  - Two-factor authentication (2FA)
  - Single Sign-On (SSO) integration
  - Advanced audit logging
  
- [ ] **Integrations & API**
  - REST API improvements
  - GraphQL API
  - GitHub/GitLab integration
  - Jira import/export tools
  
- [ ] **Scalability & Performance**
  - Database query optimization
  - Caching improvements
  - CDN integration for file uploads

### Phase 4: AI & Advanced Features (2026)
- [ ] **AI-Powered Features**
  - Automatic task prioritization
  - Smart deadline predictions
  - Natural language task creation
  
- [ ] **Advanced Project Management**
  - Resource management and capacity planning
  - Advanced dependency management
  - Portfolio management for multiple projects
  
- [ ] **Custom Plugins System**
  - Plugin architecture
  - Custom field types
  - Third-party integration marketplace

### Long-term Vision
- **Open-Source Alternative**: Provide a viable open-source option alongside Jira, Monday.com, Asana, and other enterprise PM tools
- **Data Sovereignty**: Give organizations complete control over their project data and infrastructure
- **Zero Vendor Lock-in**: Enable seamless migration and customization without proprietary constraints
- **Community-Driven Innovation**: Build features driven by real user needs, not subscription revenue
- **Enterprise Without the Enterprise Tax**: Deliver enterprise-grade functionality without per-seat pricing
- **Developer-First Approach**: Create the most developer-friendly and extensible project management platform

## Deployment

### Production Deployment

#### Using Docker (Recommended)
```bash
# Clone the repository
git clone https://github.com/Taskosaur/taskosaur.git
cd taskosaur

# Build and run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

#### Manual Deployment

**Prerequisites for Production:**
- Node.js 22+ LTS
- PostgreSQL 13+
- Redis 6+
- Reverse proxy (Nginx recommended)

**Backend Deployment:**
```bash
# From root directory
npm install --production
npm run be:build
npm run be:prisma:migrate:deploy
npm run be:start:prod
```

**Frontend Deployment:**
```bash
# From root directory
npm install --production
npm run fe:build
npm run fe:start
```

#### Environment Variables for Production

Update your environment variables for production:

**Root (.env):**
```env
# Global/Proxy Configuration
APP_HOST=0.0.0.0
APP_PORT=9123
NODE_ENV=production

# Backend Configuration
BE_DATABASE_URL="postgresql://username:password@your-db-host:5432/taskosaur"
BE_JWT_SECRET="your-secure-production-jwt-secret"
BE_REDIS_HOST="your-redis-host"
BE_CORS_ORIGIN="https://your-domain.com"

# Frontend Configuration  
FE_NEXT_PUBLIC_API_BASE_URL=https://api.your-domain.com
```

#### Hosting Platforms

**Recommended platforms:**
- **Backend**: Railway, Render, DigitalOcean App Platform
- **Frontend**: Vercel, Netlify, Railway
- **Database**: Railway PostgreSQL, Supabase, AWS RDS
- **Redis**: Railway Redis, Redis Cloud, AWS ElastiCache

## API Documentation

The API documentation is automatically generated using Swagger and is available at:
- Development: [http://localhost:9123/api/docs](http://localhost:9123/api/docs)
- Production: `https://your-domain.com/api/docs`

## FAQ

### General Questions

**Q: Is Taskosaur free to use?**
A: Yes! Taskosaur is available under the Business Source License and free for non-production use and internal production use within organizations.

**Q: Can I use Taskosaur for commercial projects?**
A: Yes, you can use Taskosaur for production purposes as long as you don't offer it to third parties as a competitive hosting service or embedded product. Internal use within your organization is permitted. After 4 years, it becomes MPL 2.0 licensed.

**Q: How does Taskosaur compare to Jira/Monday.com/Asana?**
A: Taskosaur is working toward providing equivalent functionality to these enterprise platforms with key advantages: complete data ownership, no subscription fees, full source code access for customization, modern tech stack, and the ability to host on your own infrastructure. Our goal is to offer enterprise features without vendor lock-in.

### Technical Questions

**Q: What databases are supported?**
A: Currently PostgreSQL 13+. We plan to add MySQL support in future releases.

**Q: Can I deploy Taskosaur on my own servers?**
A: Yes! Taskosaur is designed for self-hosting with Docker or manual deployment on any server.

**Q: Is there a mobile app?**
A: A mobile app is planned for Phase 2 (Q3 2025). The web app is mobile-responsive in the meantime.

**Q: How do I backup my data?**
A: Use `pg_dump` for PostgreSQL backups and backup your uploaded files from the `uploads/` directory.

### Development Questions

**Q: How can I contribute?**
A: Check our [Contributing Guide](CONTRIBUTING.md) for development setup and contribution guidelines.

**Q: Can I create custom plugins?**
A: Plugin system is planned for Phase 4 (2026). Currently, you can modify the source code directly.

**Q: How do I add custom fields?**
A: Custom fields are being implemented and will be available through the admin interface. See the documentation for current implementation status.

### Deployment Questions

**Q: What hosting providers work best?**
A: We recommend Railway, Render, or DigitalOcean for backend, and Vercel or Netlify for frontend.

**Q: How many users can Taskosaur support?**
A: This depends on your server resources. The architecture is designed to handle hundreds of concurrent users with proper scaling.

**Q: Is there enterprise support available?**
A: Community support is available through GitHub. Enterprise support options are being planned.

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- **Code Style**: Follow the existing code style and use Prettier for formatting
- **TypeScript**: Use strict TypeScript with proper type annotations
- **Testing**: Write tests for new features and bug fixes
- **Documentation**: Update documentation for any API changes
- **Commit Messages**: Use conventional commit messages

## License

This project is licensed under the Business Source License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [NestJS](https://nestjs.com/) - Backend framework
- [Next.js](https://nextjs.org/) - Frontend framework
- [Prisma](https://prisma.io/) - Database ORM
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

## Support

- Email: support@taskosaur.com
- Issues: [GitHub Issues](https://github.com/Taskosaur/taskosaur/issues)
- Discussions: [GitHub Discussions](https://github.com/Taskosaur/taskosaur/discussions)

---

Built with love by the Taskosaur team