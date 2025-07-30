'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import SprintBoard from '@/components/sprints/SprintBoard';
import SprintPlanning from '@/components/sprints/SprintPlanning';
import SprintProgress from '@/components/sprints/SprintProgress';
import SprintSelector from '@/components/sprints/SprintSelector';
import { Button } from '@/components/ui';

type SprintView = 'board' | 'planning' | 'progress';

export default function SprintsPage() {
  const params = useParams();
  const [activeView, setActiveView] = useState<SprintView>('board');
  const [selectedSprint, setSelectedSprint] = useState<any>(null);
  const [sprints, setSprints] = useState<any[]>([]);
  
  const workspaceSlug = params?.workspaceSlug as string;
  const projectSlug = params?.projectSlug as string;

  const handleSprintChange = (sprint: any) => {
    setSelectedSprint(sprint);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sprint Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage sprints for {projectSlug} project
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <SprintSelector
            currentSprint={selectedSprint}
            sprints={sprints}
            onSprintChange={handleSprintChange}
          />
          <Button>
            Create Sprint
          </Button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center space-x-1 mb-6">
        {[
          { id: 'board', label: 'Sprint Board', icon: '📋' },
          { id: 'planning', label: 'Planning', icon: '📅' },
          { id: 'progress', label: 'Progress', icon: '📊' }
        ].map(view => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id as SprintView)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === view.id
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <span className="mr-2">{view.icon}</span>
            {view.label}
          </button>
        ))}
      </div>

      {/* Sprint Content */}
      <div className="space-y-6">
        {activeView === 'board' && (
          <SprintBoard 
            projectId={projectSlug} 
            sprintId={selectedSprint}
          />
        )}
        
        {activeView === 'planning' && (
          <SprintPlanning 
            projectId={projectSlug} 
            sprintId={selectedSprint}
          />
        )}
        
        {activeView === 'progress' && (
          <SprintProgress selectedSprint={selectedSprint} />
        )}
      </div>
    </div>
  );
}