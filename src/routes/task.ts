import { Router } from 'express';
import auth from '../middleware/auth';
import authorize from '../middleware/rbac';
import { cacheMiddleware } from '../middleware/cache';
import { invalidateTasksCache } from '../middleware/cacheInvalidation';
import { roleBasedRateLimiter } from '../middleware/roleBasedRateLimit';
import { sensitiveEndpointLimiter } from '../middleware/rateLimit';
import { 
    createTask, 
    getTasks, 
    updateTask, 
    deleteTask, 
    assignTask,
    taskCreationValidation
} from '../controllers/taskController';

const router = Router();

// Routes are protected by JWT authentication middleware
router.use(auth); 

// Create Task: Invalidate cache after creating a task
router.post('/', sensitiveEndpointLimiter, taskCreationValidation, createTask, invalidateTasksCache); 

// Read Tasks (List) - Cached
router.get('/', roleBasedRateLimiter, cacheMiddleware, getTasks);

// Assign Task: Invalidate cache after assigning a task
router.put('/:taskId/assign', sensitiveEndpointLimiter, authorize(['Admin', 'Manager']), assignTask, invalidateTasksCache); 

// Update Task: Invalidate cache after updating a task
router.put('/:id', sensitiveEndpointLimiter, updateTask, invalidateTasksCache);

// Delete Task: Invalidate cache after deleting a task
router.delete('/:id', sensitiveEndpointLimiter, deleteTask, invalidateTasksCache);

export default router;