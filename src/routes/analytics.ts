import { Router } from 'express';
import auth from '../middleware/auth';
import { getTaskAnalytics } from '../controllers/analyticsController';
import { roleBasedRateLimiter } from '../middleware/roleBasedRateLimit';

const router = Router();

// Middleware: All routes in this file require authentication
router.use(auth); 

// @route GET /api/analytics/tasks
// @desc Get task statistics (RBAC filtering is handled in controller)
// @access Private
router.get('/', roleBasedRateLimiter, getTaskAnalytics);

export default router;