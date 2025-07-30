'use client';

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';
import { WorkspaceContext } from '@/contexts/workspace-context';
import { ProjectContext } from '@/contexts/project-context';
import { useAuth } from '@/contexts/auth-context';
import TaskViewTabs from '@/components/tasks/TaskViewTabs';
import TaskGanttView from '@/components/tasks/views/TaskGanttView';
import {
  HiPlus,
  HiChevronDown,
  HiChartBarSquare,
  HiExclamationTriangle,
} from 'react-icons/hi2';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  params: Promise<{
    workspaceSlug: string;
  }>;
}

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="max-w-7xl mx-auto p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
        <div className="h-10 bg-muted rounded mb-4"></div>
        <Card>
          <CardContent className="p-6">
            <div className="h-96 bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

const ErrorState = ({ 
  error, 
  onBack 
}: { 
  error: string;
  onBack?: () => void;
}) => (
  <div className="min-h-screen bg-background">
    <div className="max-w-7xl mx-auto p-6">
      <Alert variant="destructive">
        <HiExclamationTriangle className="h-4 w-4" />
        <AlertDescription className="flex flex-col gap-2">
          <span>{error}</span>
          <Link 
            href="/workspaces"
            className="text-sm text-primary hover:text-primary/80 underline"
          >
            Back to Workspaces
          </Link>
        </AlertDescription>
      </Alert>
    </div>
  </div>
);

export default function WorkspaceTasksGanttPage({ params }: Props) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { workspaceSlug } = resolvedParams;
  
  // Get authentication context
  const { isAuthenticated } = useAuth();
  
  // Get contexts
  const workspaceContext = useContext(WorkspaceContext);
  const projectContext = useContext(ProjectContext);
  
  if (!workspaceContext || !projectContext) {
    throw new Error('Workspace and Project contexts must be used within their respective providers');
  }
  
  const { getWorkspaceBySlug } = workspaceContext;
  const { getProjectsByWorkspace } = projectContext;
  
  const [workspace, setWorkspace] = useState<any>(null);
  const [workspaceProjects, setWorkspaceProjects] = useState<any[]>([]);
  const [workspaceTasks, setWorkspaceTasks] = useState<any[]>([]);
  const [projectsData, setProjectsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check authentication using context
        if (!isAuthenticated()) {
          console.error('Not authenticated, redirecting to login');
          router.push('/login');
          return;
        }

        console.log('Fetching workspace with slug:', workspaceSlug);

        // Fetch workspace data using context method (no token needed)
        const workspaceData = await getWorkspaceBySlug(workspaceSlug);
        
        if (!workspaceData) {
          setError('Workspace not found');
          return;
        }
        
        setWorkspace(workspaceData);

        // Fetch projects for this workspace (no token needed)
        const allProjects = await getProjectsByWorkspace(workspaceData.id);
        setProjectsData(allProjects);

        // All projects are already filtered for this workspace
        setWorkspaceProjects(allProjects);

        // Generate mock tasks for workspace projects
        const allTasks = allProjects.flatMap((project: any) => 
          generateMockTasks(project, workspaceSlug)
        );
        
        setWorkspaceTasks(allTasks);

      } catch (error: any) {
        console.error('Error fetching data:', error);
        
        if (error.message.includes('401') || error.message.includes('unauthorized')) {
          setError('Unauthorized access. Please log in again.');
          router.push('/login');
        } else if (error.message.includes('404') || error.message.includes('not found')) {
          setError('Workspace not found');
        } else {
          setError(`Failed to load data: ${error.message}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [workspaceSlug, getWorkspaceBySlug, getProjectsByWorkspace, router, isAuthenticated]);

  // Generate mock tasks for projects
  const generateMockTasks = (project: any, workspaceSlug: string) => {
    const priorities = ['Low', 'Medium', 'High'];
    const statuses = ['Todo', 'In Progress', 'Review', 'Done'];
    const assignees = [
      { name: 'John Doe', avatar: 'JD', id: '1' },
      { name: 'Jane Smith', avatar: 'JS', id: '2' },
      { name: 'Mike Johnson', avatar: 'MJ', id: '3' },
      { name: 'Sarah Williams', avatar: 'SW', id: '4' },
    ];

    const taskTemplates = [
      'Design wireframes',
      'Implement authentication',
      'Create component library',
      'Setup CI/CD pipeline',
      'Write unit tests',
      'User testing',
      'Code review'
    ];

    // Generate 3-4 tasks per project
    const numTasks = Math.floor(Math.random() * 2) + 3;
    return taskTemplates.slice(0, numTasks).map((template, index) => ({
      id: `${project.id}-task-${index + 1}`,
      title: `${project.name} - ${template}`,
      description: `${template} for the ${project.name} project`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      assignee: Math.random() > 0.3 ? assignees[Math.floor(Math.random() * assignees.length)] : null,
      dueDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      project: project.id,
      projectData: {
        id: project.id,
        name: project.name,
        key: project.key,
        color: project.color,
        slug: project.slug || project.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        workspace: {
          slug: workspaceSlug
        }
      }
    }));
  };

  // Filter tasks based on selected project
  const filteredTasks = selectedProject === 'all' 
    ? workspaceTasks 
    : workspaceTasks.filter(task => task.project === selectedProject);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!workspace) {
    return <ErrorState error="Workspace not found. Please check the URL and try again." />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
                <HiChartBarSquare size={20} />
                {workspace.name} Tasks
              </h1>
              <p className="text-sm text-muted-foreground">
                All tasks across all projects in {workspace.name} workspace.
              </p>
            </div>
            
            {/* Controls */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Project Filter */}
              <div className="flex items-center gap-2">
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {workspaceProjects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Add Task Button */}
              <Button asChild>
                <Link href={`/${workspaceSlug}/tasks/new`} className="flex items-center gap-2">
                  <HiPlus size={16} />
                  Add Task
                </Link>
              </Button>
            </div>
          </div>

          {/* Task Count and Filter Summary */}
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              {filteredTasks.length} of {workspaceTasks.length} tasks
            </span>
            {selectedProject !== 'all' && (
              <div className="flex items-center gap-2">
                <span>•</span>
                <span>Filtered by:</span>
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                  {workspaceProjects.find(p => p.id === selectedProject)?.name || 'Project'}
                </span>
                <button
                  onClick={() => setSelectedProject('all')}
                  className="text-primary hover:text-primary/80 text-xs underline"
                >
                  Clear filter
                </button>
              </div>
            )}
          </div>
        </div>

        {/* View Tabs */}
        <div className="mb-6">
          <TaskViewTabs currentView="gantt" baseUrl={`/${workspaceSlug}/tasks`} />
        </div>

        {/* Gantt Chart */}
        <Card>
          <CardContent className="gantt-wrapper p-6">
            <TaskGanttView
              tasks={filteredTasks}
              workspaceSlug={workspaceSlug}
              projectSlug=""
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}