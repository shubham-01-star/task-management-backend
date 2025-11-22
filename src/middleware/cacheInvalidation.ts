import { Request, Response, NextFunction } from 'express';
import redisClient from '../config/redis';

export const invalidateTasksCache = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const keys = await redisClient.keys('/api/tasks*');
        if (keys.length > 0) {
            await redisClient.del(keys);
            console.log(`Cache invalidated for keys: ${keys.join(', ')}`);
        }
    } catch (err) {
        console.error('Redis cache invalidation error:', err);
    }
    next();
};
