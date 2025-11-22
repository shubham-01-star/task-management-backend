import { Request, Response, NextFunction } from 'express';
import { CustomRequest } from './auth';
import { adminLimiter, managerLimiter, userLimiter } from './rateLimit';

export const roleBasedRateLimiter = (req: Request, res: Response, next: NextFunction) => {
    const customReq = req as CustomRequest;
    const role = customReq.user?.role;

    switch (role) {
        case 'Admin':
            return adminLimiter(req, res, next);
        case 'Manager':
            return managerLimiter(req, res, next);
        default:
            return userLimiter(req, res, next);
    }
};
