'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getTasks, getProjects, getProjectBySlug } from '@/utils/apiUtils';
import TaskViewTabs from '@/components/tasks/TaskViewTabs';
import TaskKanbanView from '@/components/tasks/views/TaskKanbanView';
import { Task } from '@/types/tasks';
import { Project } from '@/types/projects';
import { Button, Select, Card } from '@/components/ui';
import { HiPlus, HiViewColumns } from 'react-icons/hi2';

export default function ProjectTasksKanbanPage() {
  const params = useParams();
  const slug = params.slug as string;
  const currentOrganization = localStorage.getItem('currentOrganizationId') || '';
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Add keyframes for spin animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [tasksData, projectsData, projectData] = await Promise.all([
          getTasks(),
          getProjects(),
          getProjectBySlug(slug)
        ]);
        
        // Filter tasks for this project
        const projectTasks = tasksData.filter(task => task.projectId === projectData?.id);
        
        setTasks(projectTasks);
        setProjects(projectsData);
        setCurrentProject(projectData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [slug, currentOrganization]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--background-color, #f8fafc)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '24rem' }}>
            <div style={{ 
              width: '2rem', 
              height: '2rem', 
              border: '2px solid #e5e7eb', 
              borderTop: '2px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--background-color, #f8fafc)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem' }}>
          <Card className="p-8 text-center">
            <h2 style={{ fontSize: '1.25rem', fontWeight: '500', margin: '0 0 0.5rem 0' }}>
              Project not found
            </h2>
            <p style={{ color: 'var(--text-muted, #6b7280)', margin: 0 }}>
              The project you're looking for doesn't exist.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  const defaultWorkspace = currentProject.workspace || { slug: 'default-workspace' };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background-color, #f8fafc)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div>
              <h1 style={{ 
                fontSize: '1.125rem',
                fontWeight: '600',
                margin: '0 0 0.25rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--foreground)'
              }}>
                <HiViewColumns size={20} />
                {currentProject.name} Tasks
              </h1>
              <p style={{ 
                fontSize: '0.875rem',
                color: 'var(--text-muted, #6b7280)',
                margin: 0
              }}>
                Manage and track tasks for {currentProject.name} project
              </p>
            </div>
            
            {/* Controls */}
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: '0.75rem',
              alignItems: 'center'
            }}>
              {/* Task Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Select 
                // className="min-w-[140px]"
                >
                  <option>All Tasks</option>
                  <option>Assigned to me</option>
                  <option>Created by me</option>
                  <option>Subscribed</option>
                </Select>
              </div>

              {/* Add Task Button */}
              <Button
                size="md"
                className="inline-flex items-center gap-2"
                onClick={() => window.location.href = `/${defaultWorkspace.slug}/${currentProject.slug}/tasks/new`}
              >
                <HiPlus size={16} />
                Add Task
              </Button>
            </div>
          </div>

          {/* Task Count */}
          <div style={{ 
            marginTop: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            fontSize: '0.875rem',
            color: 'var(--text-muted, #6b7280)'
          }}>
            <span>
              {tasks.length} tasks
            </span>
            <span>•</span>
            <span>
              Kanban Board View
            </span>
          </div>
        </div>

        {/* View Tabs */}
        <div style={{ marginBottom: '1.5rem' }}>
          <TaskViewTabs 
            currentView="kanban" 
            baseUrl={`/projects/${slug}/tasks`} 
          />
        </div>

        {/* Kanban Content */}
        <div>
          <TaskKanbanView 
            tasks={tasks} 
            projects={projects}
            workspaceSlug={defaultWorkspace.slug}
            projectSlug={currentProject.slug}
          />
        </div>
      </div>
    </div>
  );
}