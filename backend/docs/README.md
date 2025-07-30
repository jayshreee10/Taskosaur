# Taskosaur API Documentation

This directory contains the Swagger documentation for the Taskosaur backend API.

## Files

- `swagger.json`: The OpenAPI/Swagger specification file
- `index.html`: HTML viewer for the Swagger documentation

## How to Use

1. Open `index.html` in a web browser to view the interactive API documentation
2. You can also use tools like Swagger UI or Redoc to parse the `swagger.json` file

## API Overview

The Taskosaur API provides endpoints for:

- Authentication (login, signup, profile)
- Workspaces (create, read, update, delete)
- Projects (create, read, update, delete)
- Tasks (create, read, update, delete)
- Activities (view activity logs)
- Members (view team members)
- Deadlines (view upcoming deadlines)
- Stats (view project statistics)

## Security

The API uses JWT (JSON Web Token) authentication. Include the token in the Authorization header for secured endpoints.

## Data Models

- User: User account information
- Workspace: Container for projects and team members
- Project: Container for tasks with specific goals
- Task: Individual work items with status, priority, and assignee
- Activity: Logged actions performed in the system
- Member: User with specific role in a workspace or project
- Deadline: Important dates for projects or tasks
- Stat: Statistical data for dashboards