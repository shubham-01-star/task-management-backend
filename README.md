# Task Management API

This is a comprehensive RESTful API for a task management system built with Node.js, Express, and MongoDB. It includes user authentication, role-based access control (RBAC), task management, and real-time notifications via WebSockets.

## Features

- **User Authentication**: User registration, login with JWT.
- **Role-Based Access Control (RBAC)**: Admin, Manager, and User roles with different permissions.
- **Full Task Management**: CRUD operations for tasks.
- **Task Assignment**: Ability for Admins/Managers to assign tasks to users.
- **Search and Filtering**: Full-text search on task titles/descriptions and filtering by status/priority.
- **Real-time Updates**: Uses Socket.io to notify users of task changes.
- **Analytics**: Endpoints for task completion statistics.
- **Caching**: Implemented with Redis for improved performance on frequently accessed endpoints.
- **Rate Limiting**: Protection against brute-force attacks and API abuse, with different limits based on user roles.
- **API Documentation**: OpenAPI specification is available in `openapi.yaml`.

## Prerequisites

- Node.js (v18 or newer recommended)
- npm
- MongoDB
- Redis (optional, for caching)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd task-management-api
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

## Configuration

The application requires environment variables for its configuration. Create a `.env` file in the root of the project and add the following variables. Refer to `.env.example` for a template.

```env
# MongoDB Connection String
MONGO_URI=mongodb://localhost:27017/task-management

# JWT Secret and Expiration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d

# Redis Configuration (optional, for caching)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_URL=

# Port for the server
PORT=3000
```

## Running the Application

- **Development Mode** (with hot-reloading):
  ```bash
  npm run dev
  ```

- **Production Mode**:
  First, build the TypeScript code:
  ```bash
  npm run build
  ```
  Then, start the server:
  ```bash
  npm start
  ```

The API will be running at `http://localhost:3000`.

## Running Tests

To run the test suite, use the following command:

```bash
npm test
```

## API Documentation

The API is documented using the OpenAPI specification in the `openapi.yaml` file. You can use tools like [Swagger UI](https://swagger.io/tools/swagger-ui/) or [ReDoc](https://redocly.com/redoc/) to view the interactive documentation.
