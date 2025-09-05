/**
 * Task management automation functions
 */

import {
  AutomationResult,
  waitForElement,
  waitForElementReady,
  simulateTyping,
  simulateClick,
  navigateTo,
  waitForModalClose,
  waitFor,
  generateSlug,
  selectDropdownOption,
  simulateKeyPress
} from './helpers';
import { taskStatusApi } from '../api/taskStatusApi';
import { projectApi } from '../api/projectApi';

/**
 * Create a new task
 */
export async function createTask(
  workspaceSlug: string,
  projectSlug: string,
  taskTitle: string,
  options: {
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'HIGHEST';
    description?: string;
    dueDate?: string;
    assignee?: string;
    reporter?: string;
    labels?: string[];
    timeout?: number;
  } = {}
): Promise<AutomationResult> {
  const {
    priority = 'MEDIUM',
    description = '',
    dueDate,
    assignee,
    labels = [],
    timeout = 15000
  } = options;

  try {
    // Navigate to tasks page using provided workspace and project slugs
    const tasksUrl = `/${workspaceSlug}/${projectSlug}/tasks`;

    // Navigate to tasks page
    await navigateTo(tasksUrl);

    // Wait for tasks page to load
    await waitForElement('.dashboard-container, .space-y-6', timeout);
    await waitFor(500);

    // Find and click "Create Task" button using proven patterns
    let createTaskBtn: Element | null = null;
    
    // First try to find button by text content (most reliable)
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      if (button.textContent?.includes('Create Task') || 
          button.textContent?.includes('New Task') ||
          button.textContent?.includes('Add Task')) {
        createTaskBtn = button;
        break;
      }
    }

    // Fallback selectors if text search doesn't work
    if (!createTaskBtn) {
      const fallbackSelectors = [
        '[data-testid="create-task-button"]',
        '.create-task-button',
        'button[aria-label*="task"]',
        '.actionbutton-primary' // Based on project patterns
      ];

      for (const selector of fallbackSelectors) {
        createTaskBtn = document.querySelector(selector);
        if (createTaskBtn) break;
      }
    }

    if (!createTaskBtn) {
      throw new Error('Create Task button not found');
    }

    await simulateClick(createTaskBtn);

    // Wait for task creation modal
    await waitForElement('.projects-modal-container, [role="dialog"]', timeout);
    await waitFor(500); // Brief pause for modal animation

    // Fill task title using proven React-compatible approach
    const titleInput = await waitForElementReady(
      'input#title, input[name="title"], input[id="task-title"], input[placeholder*="title"]',
      timeout
    ) as HTMLInputElement;

    if (!titleInput) {
      throw new Error('Task title input not found');
    }

    // Use React-compatible input handling (same as project/workspace)
    titleInput.focus();
    titleInput.click();
    await waitFor(100);
    
    // Set value using native setter for React compatibility
    const titleValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set;
    
    if (titleValueSetter) {
      titleValueSetter.call(titleInput, taskTitle);
    } else {
      titleInput.value = taskTitle;
    }
    
    titleInput.dispatchEvent(new Event('input', { bubbles: true }));
    titleInput.dispatchEvent(new Event('change', { bubbles: true }));
    await waitFor(300);

    // Set priority (optional field)
    const prioritySelectors = [
      'select#priority',
      'select[name="priority"]',
      '[data-testid="priority-select"]',
      '.priority-select'
    ];

    for (const selector of prioritySelectors) {
      try {
        const priorityElement = document.querySelector(selector);
        if (priorityElement && priorityElement.tagName === 'SELECT') {
          const selectElement = priorityElement as HTMLSelectElement;
          selectElement.value = priority;
          selectElement.dispatchEvent(new Event('change', { bubbles: true }));
          await waitFor(200);
          break;
        }
      } catch (error) {
        console.warn(`Priority selection failed for ${selector}:`, error);
      }
    }

    // Set due date if provided
    if (dueDate) {
      const dueDateSelectors = [
        'input#dueDate',
        'input[name="dueDate"]',
        'input[name="due_date"]',
        'input[type="date"]'
      ];

      for (const selector of dueDateSelectors) {
        const dueDateInput = document.querySelector(selector) as HTMLInputElement;
        if (dueDateInput) {
          dueDateInput.focus();
          dueDateInput.value = dueDate;
          dueDateInput.dispatchEvent(new Event('input', { bubbles: true }));
          dueDateInput.dispatchEvent(new Event('change', { bubbles: true }));
          await waitFor(200);
          break;
        }
      }
    }

    // Submit the basic task creation using proven button finding approach
    let createButton: Element | null = null;
    
    // First try to find button by text content within modal
    const modalButtons = document.querySelectorAll('.projects-modal-container button, [role="dialog"] button');
    for (const button of modalButtons) {
      const buttonText = button.textContent?.trim().toLowerCase() || '';
      if (buttonText.includes('create task') || buttonText.includes('create') || buttonText === 'save') {
        createButton = button;
        break;
      }
    }

    // Fallback selectors
    if (!createButton) {
      const fallbackSelectors = [
        'button[type="submit"]',
        '.projects-form-actions button:last-child',
        '.modal-footer button:last-child'
      ];

      for (const selector of fallbackSelectors) {
        createButton = document.querySelector(selector);
        if (createButton) break;
      }
    }

    if (!createButton) {
      throw new Error('Create task button not found');
    }

    await simulateClick(createButton);

    // Wait for modal to close and task to be created
    await waitForModalClose();
    await waitFor(2000);

    const taskSlug = generateSlug(taskTitle);

    // If additional fields need to be set, open task details
    if (description || assignee || labels.length > 0) {
      try {
        // Find the newly created task and open it
        const taskSelectors = [
          `[data-testid="task-${taskSlug}"]`,
          `[data-task-title="${taskTitle}"]`,
          '.task-card:first-child',
          '.task-item:first-child'
        ];

        let taskElement: Element | null = null;
        for (const selector of taskSelectors) {
          taskElement = document.querySelector(selector);
          if (taskElement) break;
        }

        // If we can't find the specific task, try clicking the first task
        if (!taskElement) {
          const allTaskElements = document.querySelectorAll('.task-card, .task-item, [data-testid^="task-"]');
          if (allTaskElements.length > 0) {
            taskElement = allTaskElements[0];
          }
        }

        if (taskElement) {
          await simulateClick(taskElement);
          await waitForElement('[data-testid="task-detail-modal"], .task-detail, [role="dialog"]', timeout);

          // Set description using React-compatible approach
          if (description) {
            const descSelectors = [
              'textarea#description',
              'textarea[name="description"]',
              '.task-description textarea',
              '[data-testid="task-description-input"]'
            ];

            for (const selector of descSelectors) {
              const descInput = document.querySelector(selector) as HTMLTextAreaElement;
              if (descInput) {
                descInput.focus();
                descInput.click();
                await waitFor(100);
                
                // Use React-compatible approach
                const descValueSetter = Object.getOwnPropertyDescriptor(
                  window.HTMLTextAreaElement.prototype,
                  'value'
                )?.set;
                
                if (descValueSetter) {
                  descValueSetter.call(descInput, description);
                } else {
                  descInput.value = description;
                }
                
                descInput.dispatchEvent(new Event('input', { bubbles: true }));
                descInput.dispatchEvent(new Event('change', { bubbles: true }));
                await waitFor(300);
                break;
              }
            }
          }

          // Set assignee
          if (assignee) {
            const assigneeSelectors = [
              '[data-testid="assignee-select"]',
              '.assignee-select',
              'select[name="assignee"]'
            ];

            for (const selector of assigneeSelectors) {
              try {
                await selectDropdownOption(selector, assignee);
                break;
              } catch (error) {
                console.warn(`Assignee selection failed for ${selector}:`, error);
              }
            }
          }

          // Add labels
          for (const label of labels) {
            const labelSelectors = [
              '[data-testid="label-input"]',
              '.label-input',
              'input[placeholder*="label"]'
            ];

            for (const selector of labelSelectors) {
              const labelInput = document.querySelector(selector) as HTMLInputElement;
              if (labelInput) {
                await simulateTyping(labelInput, label);
                await simulateKeyPress(labelInput, 'Enter');
                await waitFor(200);
                break;
              }
            }
          }

          // Save changes using scoped button search (learned from project edit fixes)
          let saveButton: Element | null = null;
          
          // First try within task detail modal/content area
          const taskDetailContent = document.querySelector('[data-testid="task-detail-modal"], .task-detail, [role="dialog"]');
          if (taskDetailContent) {
            const buttons = taskDetailContent.querySelectorAll('button');
            for (const button of buttons) {
              const buttonText = button.textContent?.trim().toLowerCase() || '';
              if (buttonText.includes('save') || buttonText.includes('update')) {
                saveButton = button;
                break;
              }
            }
          }

          // Fallback selectors
          if (!saveButton) {
            const fallbackSelectors = [
              'button[type="submit"]',
              '[data-testid="save-task"]',
              '.modal-footer button:last-child'
            ];

            for (const selector of fallbackSelectors) {
              saveButton = document.querySelector(selector);
              if (saveButton) break;
            }
          }

          if (saveButton) {
            await simulateClick(saveButton);
            await waitFor(1000);
          }

          // Close task detail modal
          const closeSelectors = [
            '[data-testid="close-task-detail"]',
            '.dialog-close',
            'button[aria-label="Close"]',
            '.modal-close'
          ];

          for (const selector of closeSelectors) {
            const closeButton = document.querySelector(selector);
            if (closeButton) {
              await simulateClick(closeButton);
              break;
            }
          }
        }
      } catch (detailError) {
        console.warn('Failed to set additional task details:', detailError);
        // Continue anyway - basic task was created successfully
      }
    }

    return {
      success: true,
      message: 'Task created successfully',
      data: {
        taskTitle,
        slug: taskSlug,
        priority,
        description,
        dueDate,
        assignee,
        labels
      }
    };

  } catch (error) {
    return {
      success: false,
      message: 'Failed to create task',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Update task status
 */
export async function updateTaskStatus(
  workspaceSlug: string,
  projectSlug: string,
  taskTitle: string,
  newStatus: string,
  options: { timeout?: number } = {}
): Promise<AutomationResult> {
  const { timeout = 10000 } = options;

  try {
    // Navigate to the tasks page first
    const tasksUrl = `/${workspaceSlug}/${projectSlug}/tasks`;
    await navigateTo(tasksUrl);
    
    // Wait for page to load
    await waitForElement('.dashboard-container, .space-y-6', timeout);
    await waitFor(1000);

    // Find the task by title
    const taskRows = document.querySelectorAll('.tasktable-row, tbody tr[data-slot="table-row"]');
    let targetTaskRow: Element | null = null;
    
    for (const row of taskRows) {
      const titleElement = row.querySelector('.tasktable-task-title, .task-title');
      const title = titleElement?.textContent?.trim();
      
      if (title && title.toLowerCase() === taskTitle.toLowerCase()) {
        targetTaskRow = row;
        break;
      }
    }

    if (!targetTaskRow) {
      throw new Error(`Task with title "${taskTitle}" not found`);
    }

    // Click on the task to open the detail view
    const taskTitleElement = targetTaskRow.querySelector('.tasktable-task-title, .task-title');
    if (taskTitleElement) {
      await simulateClick(taskTitleElement);
      await waitFor(1500); // Wait for modal/detail view to open
    }

    // Find the status dropdown in the detail view (look specifically under "Status" label)
    let statusDropdown: Element | null = null;
    
    // First, find the Status label and then look for the dropdown button below it
    const labels = document.querySelectorAll('label[data-slot="label"]');
    let statusSection: Element | null = null;
    
    for (const label of labels) {
      if (label.textContent?.trim() === 'Status') {
        statusSection = label.parentElement;
        break;
      }
    }
    
    if (statusSection) {
      // Look for dropdown button within the status section
      statusDropdown = statusSection.querySelector('button[data-slot="dropdown-menu-trigger"], button[aria-haspopup="menu"]');
    }
    
    // Fallback: look for dropdown button that contains status text
    if (!statusDropdown) {
      const buttons = document.querySelectorAll('button[data-slot="dropdown-menu-trigger"], button[aria-haspopup="menu"]');
      for (const button of buttons) {
        const buttonText = button.textContent?.trim() || '';
        // Check if this button contains status-related text
        if (buttonText === 'To Do' || buttonText === 'In Progress' || buttonText === 'Done' || 
            buttonText === 'Completed' || buttonText === 'Open' || buttonText === 'Closed') {
          statusDropdown = button;
          break;
        }
      }
    }

    if (!statusDropdown) {
      throw new Error('Status dropdown button not found in task detail view');
    }

    let statusOptions: Element[] = [];
    let attempts = 0;
    const maxAttempts = 3;
    
    while (statusOptions.length <= 1 && attempts < maxAttempts) {
      attempts++;
      
      await simulateClick(statusDropdown);
      await waitFor(800);
      
      if (attempts > 1) {
        // Try mousedown/mouseup events
        statusDropdown.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        await waitFor(100);
        statusDropdown.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        await waitFor(500);
        
        // Try focus + enter
        if (statusDropdown instanceof HTMLElement) {
          statusDropdown.focus();
          await waitFor(100);
          statusDropdown.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
          await waitFor(500);
        }
      }
      
      // Look for status options with increasingly broad searches
      const selectors = [
        // Standard dropdown patterns
        '[role="option"], [data-slot="item"], [role="menuitem"]',
        
        // Radix UI patterns - look in body for portal-rendered content
        'body [data-radix-dropdown-menu-content] [role="menuitem"], ' +
        'body [data-radix-dropdown-menu-content] [data-slot="item"], ' +
        'body [data-radix-dropdown-menu-content] div[data-value], ' +
        'body [data-radix-dropdown-menu-content] button',
        
        // Look for any recently appeared dropdown content
        '[data-state="open"] [role="menuitem"], ' +
        '[aria-expanded="true"] + * [role="menuitem"], ' +
        '.dropdown-menu [role="menuitem"], ' +
        '.popover-content [role="menuitem"]',
        
        // Look for elements that appeared after our click (using mutation observer approach)
        'body > div[style*="position"], body > div[data-radix-portal]'
      ];
      
      for (const selector of selectors) {
        const options = Array.from(document.querySelectorAll(selector));
        
        if (options.length > 0) {
          // Filter for elements that look like status options
          const filteredOptions: Element[] = [];
          for (const option of options) {
            const text = option.textContent?.trim() || '';
            
            // Check if this looks like a status option
            if (text && (
              ['To Do', 'In Progress', 'Done', 'Completed', 'Open', 'Closed', 'Backlog', 'Review', 'Todo', 'In-Progress'].some(status => 
                text.toLowerCase() === status.toLowerCase() || 
                text.toLowerCase().includes(status.toLowerCase()) ||
                status.toLowerCase().includes(text.toLowerCase())
              ) ||
              // Also accept if it contains the current status we're looking for
              text.toLowerCase() === newStatus.toLowerCase()
            )) {
              filteredOptions.push(option);
            }
          }
          
          if (filteredOptions.length > statusOptions.length) {
            statusOptions = filteredOptions;
            console.log(`Found ${statusOptions.length} status options with selector: ${selector}`);
            break;
          }
        }
      }
      
      // If we still only have 1 or no options, wait a bit more and try again
      if (statusOptions.length <= 1) {
        await waitFor(1000);
      }
    }

    let statusFound = false;
    
    for (const option of statusOptions) {
      const optionText = option.textContent?.trim();
      console.log('Checking option:', optionText);
      if (optionText && optionText.toLowerCase() === newStatus.toLowerCase()) {
        console.log('Found matching option, clicking:', optionText);
        await simulateClick(option);
        statusFound = true;
        await waitFor(500);
        break;
      }
    }

    if (!statusFound) {
      // Log available options for debugging
      const availableOptions = Array.from(statusOptions).map(o => o.textContent?.trim()).filter(t => t);
      throw new Error(`Status option "${newStatus}" not found in dropdown. Available options: ${availableOptions.join(', ')}`);
    }

    // Close the task detail view
    const closeButton = document.querySelector('[aria-label="Close"], button:has(svg[data-slot="icon"])');
    if (closeButton) {
      await simulateClick(closeButton);
    } else {
      // Try ESC key
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    }
    
    await waitFor(1000);

    return {
      success: true,
      message: `Task "${taskTitle}" status updated to "${newStatus}"`,
      data: { 
        workspaceSlug,
        projectSlug,
        taskTitle, 
        newStatus 
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `Failed to update task status`,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Navigate to tasks view (list, kanban, gantt)
 */
export async function navigateToTasksView(
  workspaceSlug: string,
  projectSlug: string,
  view: 'list' | 'kanban' | 'gantt' = 'list',
  options: { timeout?: number } = {}
): Promise<AutomationResult> {
  const { timeout = 10000 } = options;

  try {
    const validViews = ['list', 'kanban', 'gantt'];
    if (!validViews.includes(view)) {
      throw new Error(`Invalid view: ${view}. Must be one of: ${validViews.join(', ')}`);
    }

    // Construct URL for the view
    const tasksUrl = view === 'list'
      ? `/${workspaceSlug}/${projectSlug}/tasks`
      : `/${workspaceSlug}/${projectSlug}/tasks/${view}`;

    await navigateTo(tasksUrl);

    // Wait for view to load - more specific selectors for task page
    const viewSelectors = [
      '.tasktable-container',
      '.space-y-6',
      '.bg-\\[var\\(--background\\)\\]',
      '.tasks-page'
    ];

    let loaded = false;
    for (const selector of viewSelectors) {
      try {
        await waitForElement(selector, timeout);
        loaded = true;
        break;
      } catch {
        continue;
      }
    }

    if (!loaded) {
      // Wait a bit more and check for any task-related content
      await waitFor(2000);
      const hasTaskContent = document.querySelector('.tasktable-container, [data-slot="table"], .task-card, .kanban');
      if (!hasTaskContent) {
        throw new Error('Tasks page did not load properly');
      }
    }

    return {
      success: true,
      message: `Navigated to ${view} view for ${workspaceSlug}/${projectSlug}`,
      data: { workspaceSlug, projectSlug, view, currentPath: window.location.pathname }
    };

  } catch (error) {
    return {
      success: false,
      message: `Failed to navigate to ${view} view`,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Search for tasks using URL parameters
 */
export async function searchTasks(
  workspaceSlug: string,
  projectSlug: string,
  query: string,
  options: { timeout?: number } = {}
): Promise<AutomationResult> {
  const { timeout = 10000 } = options;

  try {
    // Navigate to tasks page first
    const baseUrl = `/${workspaceSlug}/${projectSlug}/tasks`;
    await navigateTo(baseUrl);
    
    // Wait for page to load
    await waitForElement('.dashboard-container, .space-y-6', timeout);
    await waitFor(1000);
    
    // Find and fill the search input to trigger filtering
    const searchInput = document.querySelector(
      'input[placeholder*="Search"], input[type="search"], input[placeholder*="search"]'
    ) as HTMLInputElement;
    
    if (!searchInput) {
      throw new Error('Search input not found on the page');
    }
    
    // Clear existing value and type the new query
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    await waitFor(500);
    
    if (query) {
      searchInput.value = query;
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Wait for search to filter results
      await waitFor(2000);
    }

    // Count search results (UI should have already filtered them)
    const taskElements = document.querySelectorAll('.tasktable-row, tbody tr[data-slot="table-row"]');
    const resultCount = taskElements.length;

    // Extract task information from filtered results
    const tasks = Array.from(taskElements).map((row, index) => {
      const titleElement = row.querySelector('.tasktable-task-title, .task-title');
      const title = titleElement?.textContent?.trim() || `Task ${index + 1}`;
      
      // Get all badges in the row
      const badges = row.querySelectorAll('[data-slot="badge"]');
      let status = 'Unknown';
      let priority = 'Unknown';
      
      // Iterate through badges to identify status vs priority
      badges.forEach(badge => {
        const text = badge.textContent?.trim() || '';
        const badgeClasses = badge.className || '';
        
        // Check if it's a priority badge (these are typically uppercase)
        if (['LOW', 'MEDIUM', 'HIGH', 'HIGHEST'].includes(text.toUpperCase())) {
          priority = text.toUpperCase();
        } 
        // Check if it's a status badge (look for status-related classes or common status names)
        else if (badgeClasses.includes('status') || 
                 ['To Do', 'In Progress', 'Done', 'Completed', 'Open', 'Closed'].some(s => 
                   text.toLowerCase().includes(s.toLowerCase())
                 )) {
          status = text;
        }
      });

      return {
        title,
        status,
        priority
      };
    });

    // Build search URL for reference
    const searchUrl = query 
      ? `/${workspaceSlug}/${projectSlug}/tasks?search=${encodeURIComponent(query)}`
      : `/${workspaceSlug}/${projectSlug}/tasks`;

    return {
      success: true,
      message: query 
        ? `Found ${resultCount} task(s) matching "${query}"`
        : `Showing all ${resultCount} tasks`,
      data: {
        query,
        resultCount,
        tasks,
        searchUrl
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `Failed to search tasks`,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Filter tasks by priority using URL parameters
 */
export async function filterTasksByPriority(
  workspaceSlug: string,
  projectSlug: string,
  priority: 'all' | 'LOW' | 'MEDIUM' | 'HIGH' | 'HIGHEST',
  options: { timeout?: number } = {}
): Promise<AutomationResult> {
  const { timeout = 15000 } = options;

  try {
    // Build the tasks URL with priority filter parameter
    let tasksUrl = `/${workspaceSlug}/${projectSlug}/tasks`;
    
    if (priority !== 'all') {
      tasksUrl += `?priorities=${priority}`;
    }

    // Navigate to the filtered URL
    await navigateTo(tasksUrl);

    // Wait for tasks page to load
    await waitForElement('.dashboard-container, .space-y-6', timeout);
    await waitFor(1500); // Wait for tasks to load with filter

    // Count and collect filtered results
    const taskElements = document.querySelectorAll('.tasktable-row, tbody tr[data-slot="table-row"]');

    const filteredTasks = Array.from(taskElements).map((row, index) => {
      const titleElement = row.querySelector('.tasktable-task-title, .task-title');
      
      // Get all badges and find the priority badge
      const badges = row.querySelectorAll('[data-slot="badge"]');
      let priority = 'Unknown';
      
      badges.forEach(badge => {
        const text = badge.textContent?.trim() || '';
        if (['LOW', 'MEDIUM', 'HIGH', 'HIGHEST'].includes(text.toUpperCase())) {
          priority = text.toUpperCase();
        }
      });
      
      return {
        title: titleElement?.textContent?.trim() || `Task ${index + 1}`,
        priority
      };
    });

    return {
      success: true,
      message: `Applied priority filter: ${priority}. Showing ${filteredTasks.length} tasks.`,
      data: {
        priority,
        resultCount: filteredTasks.length,
        filteredTasks,
        workspaceSlug,
        projectSlug,
        filterUrl: tasksUrl
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `Failed to filter tasks by priority: ${priority}`,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Filter tasks by status using URL parameters (with status name to ID mapping)
 */
export async function filterTasksByStatus(
  workspaceSlug: string,
  projectSlug: string,
  statusName: 'all' | string,
  options: { timeout?: number } = {}
): Promise<AutomationResult> {
  const { timeout = 15000 } = options;

  try {
    const tasksUrl = `/${workspaceSlug}/${projectSlug}/tasks`;
    
    if (statusName === 'all') {
      await navigateTo(tasksUrl);
      await waitForElement('.dashboard-container, .space-y-6', timeout);
      await waitFor(1000);
      
      // Count all tasks
      const taskElements = document.querySelectorAll('.tasktable-row, tbody tr[data-slot="table-row"]');
      const allTasks = Array.from(taskElements).map((row, index) => {
        const titleElement = row.querySelector('.tasktable-task-title, .task-title');
        const statusElement = row.querySelector('.statusbadge-base, .tasktable-cell [data-slot="badge"]');
        
        return {
          title: titleElement?.textContent?.trim() || `Task ${index + 1}`,
          status: statusElement?.textContent?.trim() || 'Unknown'
        };
      });

      return {
        success: true,
        message: `Showing all tasks. Found ${allTasks.length} tasks.`,
        data: {
          status: 'all',
          resultCount: allTasks.length,
          filteredTasks: allTasks,
          workspaceSlug,
          projectSlug,
          filterUrl: tasksUrl
        }
      };
    }

    await navigateTo(tasksUrl);
    await waitForElement('.dashboard-container, .space-y-6', timeout);
    await waitFor(1000);

    let projectId: string | null = null;
    
    try {
      const orgId = localStorage.getItem('currentOrganizationId');
      if (!orgId) {
        throw new Error('Organization ID not found');
      }
      
      // Get all projects and find matching slug
      const projects = await projectApi.getProjectsByOrganization(orgId);
      const matchedProject = projects.find((p: any) => 
        p.slug === projectSlug || p.name?.toLowerCase().replace(/\s+/g, '-') === projectSlug
      );
      
      if (matchedProject) {
        projectId = matchedProject.id;
      } else {
        throw new Error(`Project not found: ${projectSlug}`);
      }
    } catch (error) {
      console.error('Failed to get project ID:', error);
      throw new Error(`Could not determine project ID for project: ${projectSlug}`);
    }

    let statusId: string | null = null;
    
    try {
      const statuses = await taskStatusApi.getTaskStatusByProject(projectId);
      const matchedStatus = statuses.find((s: any) => 
        s.name?.toLowerCase().trim() === statusName.toLowerCase().trim()
      );
      
      if (matchedStatus) {
        statusId = matchedStatus.id;
      } else {
        const availableStatuses = statuses.map(s => s.name).join(', ');
        throw new Error(`Status "${statusName}" not found. Available: ${availableStatuses}`);
      }
    } catch (error) {
      throw new Error(`Failed to fetch task statuses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const filteredUrl = `${tasksUrl}?statuses=${statusId}`;
    await navigateTo(filteredUrl);
    
    await waitFor(1500);

    const taskElements = document.querySelectorAll('.tasktable-row, tbody tr[data-slot="table-row"]');

    const filteredTasks = Array.from(taskElements).map((row, index) => {
      const titleElement = row.querySelector('.tasktable-task-title, .task-title');
      
      // Get all badges and find the status badge
      const badges = row.querySelectorAll('[data-slot="badge"]');
      let status = 'Unknown';
      
      badges.forEach(badge => {
        const text = badge.textContent?.trim() || '';
        const badgeClasses = badge.className || '';
        
        // Check if it's a status badge
        if (badgeClasses.includes('status') || 
            ['To Do', 'In Progress', 'Done', 'Completed', 'Open', 'Closed'].some(s => 
              text.toLowerCase().includes(s.toLowerCase())
            )) {
          status = text;
        }
      });
      
      return {
        title: titleElement?.textContent?.trim() || `Task ${index + 1}`,
        status
      };
    });

    return {
      success: true,
      message: `Applied status filter: ${statusName}. Showing ${filteredTasks.length} tasks.`,
      data: {
        status: statusName,
        statusId,
        resultCount: filteredTasks.length,
        filteredTasks,
        workspaceSlug,
        projectSlug,
        filterUrl: filteredUrl
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `Failed to filter tasks by status: ${statusName}`,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Filter tasks by both priority and status using URL parameters
 */
export async function filterTasks(
  workspaceSlug: string,
  projectSlug: string,
  filters: any,
  options: { timeout?: number } = {}
): Promise<AutomationResult> {
  const { timeout = 15000 } = options;

  try {
    // Navigate to the tasks page first
    const tasksUrl = `/${workspaceSlug}/${projectSlug}/tasks`;
    await navigateTo(tasksUrl);

    // Wait for tasks page to load
    await waitForElement('.dashboard-container, .space-y-6', timeout);
    await waitFor(1000);

    // Apply priority filters if provided
    if (filters.priorities && filters.priorities.length > 0) {
      // Apply priority filter using the existing function
      const priorityResult = await filterTasksByPriority(
        workspaceSlug, 
        projectSlug, 
        filters.priorities,
        { timeout }
      );
      
      if (!priorityResult.success) {
        throw new Error(`Failed to apply priority filter: ${priorityResult.message}`);
      }
      
      await waitFor(1000); // Wait for filter to apply
    }

    // Apply status filters if provided
    if (filters.statuses && filters.statuses.length > 0) {
      // Apply status filter using the existing function
      const statusResult = await filterTasksByStatus(
        workspaceSlug,
        projectSlug,
        filters.statuses,
        { timeout }
      );
      
      if (!statusResult.success) {
        throw new Error(`Failed to apply status filter: ${statusResult.message}`);
      }
      
      await waitFor(1000); // Wait for filter to apply
    }

    // Count and collect filtered results
    const taskElements = document.querySelectorAll('.tasktable-row, tbody tr[data-slot="table-row"]');
    console.log(`Found ${taskElements.length} task rows after filtering`);

    const filteredTasks = Array.from(taskElements).map((row, index) => {
      const titleElement = row.querySelector('.tasktable-task-title, .task-title');
      const title = titleElement?.textContent?.trim() || `Task ${index + 1}`;
      
      // Get all badges in the row to identify priority and status
      const badges = row.querySelectorAll('[data-slot="badge"]');
      let status = 'Unknown';
      let priority = 'Unknown';
      
      badges.forEach(badge => {
        const text = badge.textContent?.trim() || '';
        
        // Check if it's a priority badge
        if (['LOW', 'MEDIUM', 'HIGH', 'HIGHEST'].includes(text.toUpperCase())) {
          priority = text.toUpperCase();
        } 
        // Check if it's a status badge
        else if (badge.className.includes('status') || 
                 ['To Do', 'In Progress', 'Done', 'Completed', 'Open', 'Closed'].some(s => 
                   text.toLowerCase().includes(s.toLowerCase())
                 )) {
          status = text;
        }
      });
      
      return {
        title,
        priority,
        status
      };
    });

    // Build a summary message
    const filterSummary: string[] = [];
    if (filters.priorities && filters.priorities.length > 0) {
      filterSummary.push(`priorities: ${filters.priorities.join(', ')}`);
    }
    if (filters.statuses && filters.statuses.length > 0) {
      filterSummary.push(`statuses: ${filters.statuses.join(', ')}`);
    }
    
    const message = filterSummary.length > 0
      ? `Applied filters (${filterSummary.join(', ')}). Showing ${filteredTasks.length} task(s).`
      : `Showing all ${filteredTasks.length} tasks.`;

    return {
      success: true,
      message,
      data: {
        filters,
        resultCount: filteredTasks.length,
        tasks: filteredTasks,
        workspaceSlug,
        projectSlug
      }
    };

  } catch (error) {
    return {
      success: false,
      message: 'Failed to filter tasks',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Clear all task filters
 */
export async function clearTaskFilters(
  workspaceSlug?: string,
  projectSlug?: string,
  options: { timeout?: number } = {}
): Promise<AutomationResult> {
  const { timeout = 10000 } = options;

  try {
    // If slugs not provided, extract from current URL
    let workspace = workspaceSlug;
    let project = projectSlug;
    
    if (!workspace || !project) {
      const currentPath = window.location.pathname;
      const pathParts = currentPath.split('/').filter(p => p);
      
      // URL pattern: /workspaceSlug/projectSlug/tasks
      if (pathParts.length >= 2) {
        // Even if we're not on /tasks, we can extract workspace and project
        workspace = workspace || pathParts[0];
        project = project || pathParts[1];
      }
      
      // If still undefined, throw error with helpful message
      if (!workspace || !project) {
        throw new Error(`Could not determine workspace and project. Current URL: ${currentPath}. Please provide them as parameters.`);
      }
    }
    
    // Simply navigate to clean URL without any parameters
    const cleanUrl = `/${workspace}/${project}/tasks`;
    
    // Navigate to the clean URL
    await navigateTo(cleanUrl);
    
    // Wait for page to load
    await waitForElement('.dashboard-container, .space-y-6', timeout);
    await waitFor(1500);

    // Count all tasks
    const taskElements = document.querySelectorAll('.tasktable-row, tbody tr[data-slot="table-row"]');
    const resultCount = taskElements.length;

    return {
      success: true,
      message: `Filters cleared. Showing ${resultCount} total tasks.`,
      data: {
        workspace,
        project,
        resultCount,
        currentUrl: window.location.href
      }
    };

  } catch (error) {
    return {
      success: false,
      message: 'Failed to clear task filters',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get task details by task name/title
 */
export async function getTaskDetails(
  workspaceSlug: string,
  projectSlug: string,
  taskIdentifier: string,
  options: { timeout?: number } = {}
): Promise<AutomationResult> {
  const { timeout = 10000 } = options;

  try {
    // Navigate to tasks page if needed
    const currentPath = window.location.pathname;
    const expectedPath = `/${workspaceSlug}/${projectSlug}/tasks`;
    
    if (!currentPath.startsWith(`/${workspaceSlug}/${projectSlug}/tasks`)) {
      await navigateTo(expectedPath);
      await waitForElement('.dashboard-container, .space-y-6', timeout);
      await waitFor(500);
    }

    let taskElement: Element | null = null;
    
    const taskCards = document.querySelectorAll('.task-card, .task-item, [data-testid^="task-"], .cursor-pointer');
    for (const card of taskCards) {
      const titleElement = card.querySelector('.task-title, h3, h4, .font-medium');
      if (titleElement?.textContent?.includes(taskIdentifier)) {
        taskElement = card;
        break;
      }
    }

    if (!taskElement) {
      throw new Error(`Task "${taskIdentifier}" not found`);
    }

    await simulateClick(taskElement);

    await waitForElement('.fixed.inset-0.z-50, [role="dialog"], .task-detail', timeout);
    await waitFor(500);

    const titleElement = document.querySelector('h1.text-xl.font-bold, .task-title, [data-testid="task-title"]');
    
    const badges = document.querySelectorAll('[data-slot="badge"]');
    let status = 'Unknown';
    let priority = 'Unknown';
    
    badges.forEach(badge => {
      const text = badge.textContent?.trim() || '';
      if (text.includes('To Do') || text.includes('In Progress') || text.includes('Done')) {
        status = text;
      } else if (text.includes('Priority')) {
        priority = text.replace(' Priority', '');
      }
    });
    
    // Description from the description section
    const descriptionElement = document.querySelector('.wmde-markdown p, .task-description, [data-testid="task-description"]');
    let description = descriptionElement?.textContent?.trim() || '';
    if (description === 'No description provided') {
      description = '';
    }
    
    // Assignee from dropdown button text (if assigned)
    const assigneeDropdowns = document.querySelectorAll('button[aria-haspopup="menu"] span');
    let assignee = 'Unassigned';
    
    for (const dropdown of assigneeDropdowns) {
      const text = dropdown.textContent?.trim() || '';
      if (text.includes('Select assignee')) {
        assignee = 'Unassigned';
        break;
      } else if (text && text !== 'Select assignee...' && !text.includes('Select')) {
        assignee = text;
        break;
      }
    }
    
    // Due date (if available)
    const dueDateElement = document.querySelector('.task-due-date, [data-testid="task-due-date"]');
    const dueDate = dueDateElement?.textContent?.trim() || null;

    const taskDetails = {
      title: titleElement?.textContent?.trim() || taskIdentifier,
      description,
      status,
      priority,
      assignee,
      dueDate,
      workspaceSlug,
      projectSlug
    };

    return {
      success: true,
      message: `Retrieved details for task: ${taskDetails.title}`,
      data: { task: taskDetails }
    };

  } catch (error) {
    return {
      success: false,
      message: `Failed to get task details for: ${taskIdentifier}`,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Delete a task
 */
export async function deleteTask(
  workspaceSlug: string,
  projectSlug: string,
  taskIdentifier: string,  // Can be task title or ID
  options: { timeout?: number; confirmDeletion?: boolean } = {}
): Promise<AutomationResult> {
  const { timeout = 10000, confirmDeletion = true } = options;

  try {
    const currentPath = window.location.pathname;
    const expectedPath = `/${workspaceSlug}/${projectSlug}/tasks`;
    
    if (!currentPath.startsWith(`/${workspaceSlug}/${projectSlug}/tasks`)) {
      await navigateTo(expectedPath);
      await waitForElement('.dashboard-container, .space-y-6', timeout);
      await waitFor(500);
    }

    let taskElement: Element | null = null;
    
    const taskCards = document.querySelectorAll('.task-card, .task-item, [data-testid^="task-"], .cursor-pointer');
    for (const card of taskCards) {
      const titleElement = card.querySelector('.task-title, h3, h4, .font-medium');
      if (titleElement?.textContent?.includes(taskIdentifier)) {
        taskElement = card;
        break;
      }
    }

    if (!taskElement) {
      throw new Error(`Task "${taskIdentifier}" not found`);
    }

    await simulateClick(taskElement);
    
    await waitForElement('.fixed.inset-0.z-50, [role="dialog"], .task-detail', timeout);
    await waitFor(500);

    let deleteButton: Element | null = null;
    const allButtons = document.querySelectorAll('button');
    
    for (const button of allButtons) {
      const className = button.className || '';
      
      if (className.includes('text-[var(--destructive)]')) {
        deleteButton = button;
        break;
      }
      
      const svgPath = button.querySelector('svg path');
      if (svgPath) {
        const pathData = svgPath.getAttribute('d') || '';
        if (pathData.startsWith('M16.5 4.478')) {
          deleteButton = button;
          break;
        }
      }
    }

    await simulateClick(deleteButton);
    await waitFor(500);

    if (confirmDeletion) {
      const confirmationDialog = await waitForElement(
        '.confirmationmodal-overlay, .confirmationmodal-panel', 
        3000
      ).catch(() => null);
      
      if (confirmationDialog) {
        const confirmButton = document.querySelector('.confirmationmodal-confirm-danger');
        await simulateClick(confirmButton);
        await waitFor(1000);
      }
      
      return {
        success: true,
        message: `Task "${taskIdentifier}" deleted successfully`,
        data: { 
          taskIdentifier,
          workspaceSlug,
          projectSlug
        }
      };
    } else {
      // Cancel deletion
      const cancelButton = document.querySelector('.confirmationmodal-cancel') ||
                          document.querySelector('.confirmationmodal-footer button:last-child');
      
      if (cancelButton) {
        await simulateClick(cancelButton);
      }

      return {
        success: true,
        message: 'Task deletion cancelled',
        data: { 
          taskIdentifier, 
          action: 'cancelled' 
        }
      };
    }

  } catch (error) {
    return {
      success: false,
      message: `Failed to delete task: ${taskIdentifier}`,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}