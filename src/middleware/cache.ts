import { Request, Response, NextFunction } from 'express';
import redisClient from '../config/redis';

/**
 * Middleware to cache responses for GET requests using Redis.
 * Responses are cached based on their URL.
 */
export const cacheMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
        return next();
    }

    const key = req.originalUrl;
    
    try {
        const cachedResponse = await redisClient.get(key);

        if (cachedResponse) {
            console.log(`Cache hit for ${key}`);
            // If cached response is found, send it back
            return res.send(JSON.parse(cachedResponse));
        } else {
            console.log(`Cache miss for ${key}`);
            // If no cached response, override res.send to cache the response before sending
            const originalSend = res.send;
            res.send = (body: any) => {
                // Cache for 5 minutes (300 seconds)
                redisClient.setEx(key, 300, JSON.stringify(body)); 
                return originalSend.call(res, body); // Send the response
            };
            next();
        }
    } catch (err) {
        console.error('Redis cache error:', err);
        next();
    }
};
