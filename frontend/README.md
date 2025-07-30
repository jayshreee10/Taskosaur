# 🦕 Taskosaur

A modern, comprehensive project management platform built with Next.js, designed for teams who need powerful task management, sprint planning, and project collaboration tools.

## 🌟 Overview

Taskosaur is a Jira-inspired project management application that provides teams with everything they need to organize work, track progress, and deliver projects efficiently. Built with modern web technologies, it offers a responsive, intuitive interface with enterprise-grade features.

## ✨ Key Features

### 🏢 Multi-Organization Management
- **Organization-level administration** with role-based access control
- **Workspace management** for organizing related projects
- **Team member management** with customizable permissions
- **Multi-tenant architecture** supporting multiple organizations

### 📋 Advanced Task Management
- **Multiple task types**: Task, Bug, Epic, Story, Subtask
- **Comprehensive task metadata**: Priorities, statuses, labels, assignees
- **Task dependencies** and blocking relationships
- **Rich text descriptions** with attachment support
- **Task hierarchy** with parent-child relationships

### 👁️ Multiple Task Views
- **Kanban Board**: Drag-and-drop task management
- **List View**: Detailed task listing with filtering
- **Calendar View**: Time-based task visualization
- **Gantt Chart**: Project timeline and dependency tracking

### 🏃‍♂️ Sprint Management
- **Sprint planning** with capacity management
- **Sprint boards** for active sprint tracking
- **Sprint progress tracking** with burndown metrics
- **Velocity tracking** and team performance analytics

### ⏱️ Time Tracking & Reporting
- **Time entry logging** with detailed descriptions
- **Time reporting** by user, project, and sprint
- **Original estimates** vs actual time tracking
- **Team productivity analytics**

### 📊 Analytics & Insights
- **Project dashboards** with key metrics
- **Task distribution analysis** by type, status, and assignee
- **Team velocity tracking** over time
- **Custom reporting** with exportable data

### 🔄 Workflow Automation
- **Custom workflow rules** and automation
- **Status transition triggers**
- **Automated notifications** and alerts
- **Rule-based task assignments**

### 🎨 Modern User Experience
- **Responsive design** optimized for all devices
- **Dark mode support** with system preference detection
- **Intuitive navigation** with breadcrumb trails
- **Real-time updates** and collaborative features

## 🛠️ Technology Stack

### Frontend
- **Next.js 15.2.2** with App Router
- **React 19.0.0** with TypeScript 5.x
- **Tailwind CSS 4.x** for styling
- **React Context API** for state management

### Development Tools
- **Turbopack** for fast development builds
- **ESLint** for code quality
- **TypeScript** for type safety
- **CSS Modules** for component styling

### Design System
- **Custom UI Components** with consistent styling
- **Responsive design patterns**
- **Accessibility-first approach**
- **Dark/Light theme support**

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication pages
│   │   └── login/
│   ├── (main)/                   # Main application pages
│   │   ├── dashboard/            # Dashboard views
│   │   ├── [workspaceSlug]/      # Workspace-specific pages
│   │   │   ├── [projectSlug]/    # Project-specific pages
│   │   │   │   ├── tasks/        # Task management
│   │   │   │   ├── sprints/      # Sprint management
│   │   │   │   ├── analytics/    # Project analytics
│   │   │   │   ├── time/         # Time tracking
│   │   │   │   └── settings/     # Project settings
│   │   │   ├── projects/         # Project listing
│   │   │   └── members/          # Team management
│   │   └── organizations/        # Organization management
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── analytics/                # Analytics and reporting
│   ├── automation/               # Workflow automation
│   ├── layout/                   # Layout components
│   ├── notifications/            # Notification system
│   ├── organizations/            # Organization management
│   ├── projects/                 # Project components
│   ├── settings/                 # Settings and configuration
│   ├── sprints/                  # Sprint management
│   ├── tasks/                    # Task management
│   └── ui/                       # Reusable UI components
│       ├── avatars/              # User and entity avatars
│       ├── badges/               # Status and type badges
│       ├── buttons/              # Button components
│       ├── cards/                # Card layouts
│       ├── modals/               # Modal dialogs
│       └── tables/               # Data tables
├── contexts/                     # React Context providers
├── types/                        # TypeScript type definitions
├── utils/                        # Utility functions
└── styles/                       # Component-specific styles
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ 
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd taskosaur/frontend
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Start the development server**
```bash
npm run dev
# or
yarn dev
```

4. **Open your browser**
Navigate to [http://localhost:4000](http://localhost:4000)

### Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint code analysis
```

## 🏗️ Core Architecture

### Data Hierarchy
```
Organization
├── Workspaces
│   ├── Projects
│   │   ├── Tasks
│   │   ├── Sprints
│   │   └── Members
│   └── Settings
└── Members & Permissions
```

### Key Components

#### Task Management
- **TaskBoard**: Kanban-style task management
- **TaskList**: List view with filtering and sorting
- **TaskDetail**: Comprehensive task editing modal
- **TaskCreate**: Task creation wizard

#### Sprint Management
- **SprintBoard**: Sprint-specific task board
- **SprintPlanning**: Sprint planning interface
- **SprintProgress**: Sprint metrics and progress tracking

#### Analytics
- **AnalyticsDashboard**: Project and team analytics
- **TaskDistributionChart**: Visual task breakdown
- **VelocityChart**: Team velocity tracking

#### Project Management
- **ProjectCard**: Project overview cards
- **ProjectSettings**: Project configuration
- **MemberManagement**: Team member administration

### State Management
- **OrganizationContext**: Global organization state
- **Local component state** for UI interactions
- **Mock data integration** for development

## 🎨 Design System

### Color Scheme
- **Primary**: Indigo (600/500)
- **Secondary**: Gray (600/500)
- **Success**: Green (600/500)
- **Warning**: Yellow (600/500)
- **Error**: Red (600/500)

### Components
- **Consistent spacing** using Tailwind's spacing scale
- **Typography hierarchy** with responsive text sizing
- **Interactive states** for all clickable elements
- **Accessibility features** including keyboard navigation

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file for environment-specific settings:
```bash
NEXT_PUBLIC_API_URL=your_api_url_here
NEXT_PUBLIC_APP_NAME=Taskosaur
```

### Tailwind Configuration
Custom configuration in `tailwind.config.js` includes:
- Custom color palette
- Extended spacing and typography
- Component-specific utilities

## 📱 Responsive Design

- **Mobile-first approach** with responsive breakpoints
- **Touch-friendly interfaces** for mobile devices
- **Optimized layouts** for tablets and desktop
- **Progressive enhancement** for advanced features

## 🔒 Security Considerations

- **Client-side mock authentication** (development only)
- **Role-based access control** architecture
- **Input validation** and sanitization
- **Secure routing** with authentication guards

## ⚡ Performance

- **Next.js App Router** for optimal routing
- **Turbopack** for fast development builds
- **Component lazy loading** for better performance
- **Optimized bundle sizing** with code splitting

## 🧪 Testing

The project is structured to support:
- **Unit testing** with Jest and React Testing Library
- **Integration testing** for component interactions
- **E2E testing** with Cypress or Playwright

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines
- Follow **TypeScript best practices**
- Use **consistent component patterns**
- Maintain **responsive design principles**
- Write **descriptive commit messages**
- Update **documentation** for new features

## 🔮 Future Enhancements

### Planned Features
- **Real-time collaboration** with WebSocket integration
- **Advanced reporting** with custom dashboard builder
- **API integration** replacing mock data
- **File upload and attachment** management
- **Advanced search** with full-text capabilities
- **Integration ecosystem** with popular development tools

### Technical Improvements
- **Performance optimizations** with React 19 features
- **Accessibility enhancements** for better inclusivity
- **Internationalization** support for multiple languages
- **Progressive Web App** capabilities
- **Advanced caching** strategies

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋‍♂️ Support

For questions, issues, or contributions:
- **Create an issue** on GitHub
- **Join our community** discussions
- **Read the documentation** for detailed guides

---

**Built with ❤️ by the Taskosaur team**

*Empowering teams to deliver exceptional projects through intuitive project management.*