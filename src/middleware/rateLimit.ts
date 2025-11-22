import rateLimit from 'express-rate-limit';

// Role-based rate limiters
export const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: JSON.stringify({ msg: 'Too many requests, please try again after 15 minutes', code: 429 }),
});

export const managerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 250,
    standardHeaders: true,
    legacyHeaders: false,
    message: JSON.stringify({ msg: 'Too many requests, please try again after 15 minutes', code: 429 }),
});

export const userLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: JSON.stringify({ msg: 'Too many requests, please try again after 15 minutes', code: 429 }),
});

// Stricter rate limiter for sensitive endpoints
export const sensitiveEndpointLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: JSON.stringify({ msg: 'Too many requests to this endpoint, please try again after 15 minutes', code: 429 }),
});

// Specific, stricter rate limiter for the login endpoint (Brute Force Prevention)
export const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Allow only 5 failed login attempts per IP per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: JSON.stringify({
    msg: 'Too many login attempts from this IP, please try again after 5 minutes',
    code: 429
  }),
});