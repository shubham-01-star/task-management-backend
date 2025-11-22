#!/bin/bash

# Base API URL
BASE_URL="http://localhost:5000/api"

# --- Authentication ---

echo "# --- Authentication ---"

# Register a new user
echo ""
echo "# Register a new user"
echo "curl -X POST \"${BASE_URL}/auth/register\" \
-H \"Content-Type: application/json\" \
-d '{\n  \"username\": \"testuser\",\n  \"email\": \"test@example.com\",\n  \"password\": \"password123\"\n}'"

# Log in user
echo ""
echo "# Log in user"
echo "curl -X POST \"${BASE_URL}/auth/login\" \
-H \"Content-Type: application/json\" \
-d '{    \n  \"email\": \"test@example.com\",\n  \"password\": \"password123\"\n}'"

# Log out user (client-side token discard)
echo ""
echo "# Log out user (client-side token discard - JWT token is not invalidated on the server)"
echo "curl -X POST \"${BASE_URL}/auth/logout\" \
-H \"Authorization: Bearer YOUR_JWT_TOKEN\""

# Retrieve authenticated user profile
echo ""
echo "# Retrieve authenticated user profile"
echo "curl -X GET \"${BASE_URL}/auth/profile\" \
-H \"Authorization: Bearer YOUR_JWT_TOKEN\""

# --- Task Routes ---

echo ""
echo "# --- Task Routes ---"

# Get list of tasks (example: all tasks)
echo ""
echo "# Get list of tasks (example: all tasks)"
echo "curl -X GET \"${BASE_URL}/tasks\" \
-H \"Authorization: Bearer YOUR_JWT_TOKEN\""

# Get list of tasks (example: filter by status, priority, and search)
echo ""
echo "# Get list of tasks (example: filter by status='Pending', priority='High', and search='urgent')"
echo "curl -X GET \"${BASE_URL}/tasks?status=Pending&priority=High&search=urgent\" \
-H \"Authorization: Bearer YOUR_JWT_TOKEN\""

# Get list of tasks (example: sort by dueDate ascending)
echo ""
echo "# Get list of tasks (example: sort by dueDate ascending)"
echo "curl -X GET \"${BASE_URL}/tasks?sortBy=dueDate&sortOrder=asc\" \
-H \"Authorization: Bearer YOUR_JWT_TOKEN\""

# Create a new task
echo ""
echo "# Create a new task"
echo "curl -X POST \"${BASE_URL}/tasks\" \
-H \"Authorization: Bearer YOUR_JWT_TOKEN\" \
-H \"Content-Type: application/json\" \
-d '{    \n  \"title\": \"My New Task\",\n  \"description\": \"This is a detailed description of my new task.\",\n  \"dueDate\": \"2025-12-25\",\n  \"priority\": \"Medium\",\n  \"assignedTo\": \"USER_ID_TO_ASSIGN_TO\"\n}'"

# Update task details
echo ""
echo "# Update task details"
echo "curl -X PUT \"${BASE_URL}/tasks/TASK_ID\" \
-H \"Authorization: Bearer YOUR_JWT_TOKEN\" \
-H \"Content-Type: application/json\" \
-d '{    \n  \"status\": \"In Progress\",\n  \"priority\": \"High\"\n}'"

# Delete a task
echo ""
echo "# Delete a task"
echo "curl -X DELETE \"${BASE_URL}/tasks/TASK_ID\" \
-H \"Authorization: Bearer YOUR_JWT_TOKEN\""

# Assign task to a different user
echo ""
echo "# Assign task to a different user"
echo "curl -X PUT \"${BASE_URL}/tasks/TASK_ID/assign\" \
-H \"Authorization: Bearer YOUR_JWT_TOKEN\" \
-H \"Content-Type: application/json\" \
-d '{    \n  \"userId\": \"NEW_ASSIGNEE_USER_ID\"\n}'"

# --- Admin Route ---

echo ""
echo "# --- Admin Route ---"

# Update a user's role (Admin role required)
echo ""
echo "# Update a user's role (Admin role required)"
echo "curl -X PUT \"${BASE_URL}/admin/users/USER_ID/role\" \
-H \"Authorization: Bearer YOUR_ADMIN_JWT_TOKEN\" \
-H \"Content-Type: application/json\" \
-d '{    \n  \"role\": \"Manager\"\n}'"

# --- Analytics Route ---

echo ""
echo "# --- Analytics Route ---"

# Get task statistics
echo ""
echo "# Get task statistics"
echo "curl -X GET \"${BASE_URL}/analytics/tasks\" \
-H \"Authorization: Bearer YOUR_JWT_TOKEN\""
