# Taskosaur Frontend Automation System

This automation system provides comprehensive browser-based automation for the Taskosaur application, enabling testing, browser console manipulation, and MCP system integration.

## Quick Start

### Method 1: Automatic Embedded Loading (Recommended)

The automation system is automatically embedded into the page:

1. **Development Mode**: Automatically enabled when running `npm run dev`
2. **Production Mode**: Set `NEXT_PUBLIC_ENABLE_AUTOMATION=true` in your environment
3. Open browser console (F12)
4. Automation functions are available globally
5. Look for the automation status indicator in bottom-right corner

```javascript
// Available immediately after page load
await TaskosaurAutomation.login('user@example.com', 'password')
await TaskosaurAutomation.createWorkspace('My Workspace', 'Description')
await TaskosaurAutomation.quickDemo()
```

### Method 2: TypeScript Module Integration

For direct TypeScript integration in your code:

```typescript
import { automation, createTask, createWorkspace } from '@/utils/automation';

// Initialize the system
const result = await automation.initialize();

// Use individual functions
const workspace = await createWorkspace('Test Workspace', 'Description');
const task = await createTask('workspace-slug', 'project-slug', 'Task Title');

// Use automation class methods
const demo = await automation.demos.quickDemo();
```

### Method 3: Component Integration

For React component integration:

```tsx
import AutomationLoader from '@/components/automation/AutomationLoader';

// In your component or _app.tsx
<AutomationLoader 
  enabled={true}
  showDevPanel={true}
  enableConsoleAccess={true}
/>
```

## Available Functions

### Authentication
- `login(email, password, options)` - Log into application
- `logout(options)` - Log out of application
- `checkAuthenticationStatus()` - Check current auth status

### Workspace Management
- `createWorkspace(name, description, options)` - Create new workspace
- `navigateToWorkspace(workspaceSlug, options)` - Navigate to workspace
- `listWorkspaces(options)` - List all workspaces
- `searchWorkspaces(query, options)` - Search workspaces
- `editWorkspace(workspaceSlug, updates, options)` - Edit workspace
- `deleteWorkspace(workspaceSlug, options)` - Delete workspace
- `getCurrentWorkspace()` - Get current workspace context

### Project Management
- `createProject(workspaceSlug, name, description, options)` - Create new project
- `navigateToProject(workspaceSlug, projectSlug, options)` - Navigate to project
- `listProjects(workspaceSlug, options)` - List projects in workspace
- `searchProjects(workspaceSlug, query, options)` - Search projects
- `editProject(workspaceSlug, projectSlug, updates, options)` - Edit project
- `deleteProject(workspaceSlug, projectSlug, options)` - Delete project
- `getCurrentProject()` - Get current project context

### Task Management
- `createTask(projectId, taskTitle, options)` - Create new task
- `updateTaskStatus(taskId, newStatus, options)` - Update task status
- `searchTasks(query, options)` - Search tasks
- `filterTasksByPriority(priority, options)` - Filter by priority
- `filterTasksByStatus(status, options)` - Filter by status
- `clearTaskFilters(options)` - Clear all filters
- `getTaskDetails(taskId, options)` - Get task details
- `deleteTask(taskId, options)` - Delete task
- `navigateToTasksView(workspaceSlug, projectSlug, view, options)` - Navigate to task view (list/kanban/gantt)

### High-Level Workflows
- `completeProjectSetup(workspaceName, workspaceDescription, projectName, projectDescription, tasks)` - Complete project setup
- `bulkTaskOperations(operations)` - Perform bulk task operations

### Utility Functions
- `helpers.waitFor(ms)` - Wait for specified time
- `helpers.generateSlug(name)` - Generate URL slug
- `helpers.navigateTo(url)` - Navigate to URL
- `helpers.getCurrentContext()` - Get current page context
- `helpers.isAuthenticated()` - Check authentication status

## Usage Examples

### Complete Project Setup Workflow

```javascript
await TaskosaurAutomation.completeProjectSetup(
  'Marketing Team',
  'Workspace for marketing activities',
  'Q1 Campaign',
  'First quarter marketing campaign',
  [
    {
      title: 'Create Brand Guidelines',
      priority: 'HIGH',
      dueDate: '2024-02-15',
      description: 'Develop comprehensive brand guidelines'
    },
    {
      title: 'Design Landing Page',
      priority: 'MEDIUM',
      labels: ['Design', 'Web']
    },
    {
      title: 'Write Copy',
      priority: 'MEDIUM',
      labels: ['Content', 'Marketing']
    }
  ]
)
```

### Bulk Task Management

```javascript
await TaskosaurAutomation.bulkTaskOperations([
  {
    type: 'create',
    taskTitle: 'Task 1',
    taskData: { priority: 'HIGH' }
  },
  {
    type: 'update',
    taskId: 'task-123',
    newStatus: 'In Progress'
  },
  {
    type: 'delete',
    taskId: 'task-456'
  }
])
```

### Navigation and Context

```javascript
// Navigate through application
await TaskosaurAutomation.navigateToWorkspace('my-workspace')
await TaskosaurAutomation.navigateToProject('my-workspace', 'my-project')
await TaskosaurAutomation.navigateToTasksView('my-workspace', 'my-project', 'kanban')

// Get current context
const context = TaskosaurAutomation.helpers.getCurrentContext()
console.log('Current context:', context)

// Search and filter
await TaskosaurAutomation.searchTasks('design')
await TaskosaurAutomation.filterTasksByPriority('HIGH')
await TaskosaurAutomation.filterTasksByStatus('In Progress')
```

## Configuration Options

### Environment Variables

- `NODE_ENV=development` - Automatically loads automation system
- `NEXT_PUBLIC_ENABLE_AUTOMATION=true` - Force enable automation in production

### AutomationLoader Component Options

```typescript
<AutomationLoader 
  enabled={true}                    // Enable/disable automation
  enableConsoleAccess={true}        // Enable browser console access
  showDevPanel={true}               // Show development panel
/>
```

## Integration with Testing Frameworks

### Jest/Playwright Example

```javascript
describe('Taskosaur Automation', () => {
  test('should create workspace and project', async () => {
    await page.evaluate(async () => {
      const result = await TaskosaurAutomation.createWorkspace('Test WS', 'Test Description')
      expect(result.success).toBe(true)
      
      const projectResult = await TaskosaurAutomation.createProject(
        result.data.slug, 
        'Test Project', 
        'Test Desc'
      )
      expect(projectResult.success).toBe(true)
    })
  })
})
```

### Cypress Example

```javascript
cy.window().then((win) => {
  return win.TaskosaurAutomation.login('test@example.com', 'password')
}).then((result) => {
  expect(result.success).to.be.true
})
```

## MCP System Integration

The automation system provides MCP-compatible wrappers:

```javascript
const mcpFunctions = TaskosaurAutomation.MCPIntegration.wrapForMCP()
const metadata = TaskosaurAutomation.MCPIntegration.getFunctionMetadata()
```

## Development and Debugging

### Enable Verbose Logging

```javascript
TaskosaurAutomation.helpers.enableDebugMode = true
```

### Run System Tests

```javascript
// Quick functionality test
await TaskosaurAutomation.demos.quickDemo()

// Full functionality test
await TaskosaurAutomation.demos.fullFunctionalityTest()
```

### Custom Test Scenarios

```javascript
// Create custom test scenario
async function customTest() {
  console.log('Starting custom test...')
  
  try {
    // Check authentication
    const authStatus = await TaskosaurAutomation.checkAuthenticationStatus()
    console.log('Auth status:', authStatus)
    
    // Get current context
    const context = TaskosaurAutomation.helpers.getCurrentContext()
    console.log('Current context:', context)
    
    // Perform operations based on context
    if (context.type === 'project') {
      const taskResult = await TaskosaurAutomation.createTask(
        null, 
        'Test Task from Automation',
        { priority: 'LOW' }
      )
      console.log('Task created:', taskResult)
    }
    
    console.log('Custom test completed successfully!')
    
  } catch (error) {
    console.error('Custom test failed:', error)
  }
}

await customTest()
```

## Error Handling

All automation functions return a consistent result format:

```javascript
{
  success: boolean,
  message: string,
  data?: any,
  error?: string
}
```

Example error handling:

```javascript
const result = await TaskosaurAutomation.createWorkspace('Test', 'Description')

if (result.success) {
  console.log('Success:', result.message)
  console.log('Data:', result.data)
} else {
  console.error('Error:', result.error)
  // Handle error appropriately
}
```

## Browser Compatibility

The automation system works with modern browsers that support:
- ES6+ features
- Promises/async-await
- MutationObserver
- Modern DOM APIs

Tested browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Considerations

- Functions include realistic delays to simulate human interaction
- Large operations (bulk tasks) include automatic throttling
- DOM queries are optimized with timeouts and retries
- Memory usage is minimal with proper cleanup

## Security Notes

- Automation functions only simulate user interactions
- No direct API calls - all actions go through the UI
- Respects application's security measures
- Should only be used in development/testing environments
- Does not bypass authentication or authorization

## Troubleshooting

### Common Issues

1. **Element not found errors**
   - Increase timeout in options: `{ timeout: 20000 }`
   - Check if page has fully loaded
   - Verify selector accuracy

2. **Navigation failures**
   - Ensure user has proper permissions
   - Check if authentication is still valid
   - Verify URL structure matches expectations

3. **Modal/dropdown interaction issues**
   - Add delays between interactions: `await TaskosaurAutomation.helpers.waitFor(500)`
   - Check for overlapping elements or loading states

### Debug Mode

```javascript
// Enable debug logging
TaskosaurAutomation.helpers.debugMode = true

// Check current page state
console.log('Page loaded:', document.readyState)
console.log('Current URL:', window.location.href)
console.log('Authentication status:', TaskosaurAutomation.helpers.isAuthenticated())
```

## Support

For issues, questions, or feature requests:
1. Check console for error messages
2. Verify browser compatibility
3. Test with simple operations first
4. Use debug mode for detailed logging

## License

This automation system is part of the Taskosaur project and follows the same license terms.