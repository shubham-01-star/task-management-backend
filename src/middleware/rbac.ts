import { Response, NextFunction } from 'express';
import { CustomRequest } from './auth'; // Reuse the custom request type

// This middleware function checks if the authenticated user's role 
// is included in the list of required roles for a route.
const authorize = (requiredRoles: ('Admin' | 'Manager' | 'User')[]) => {
  console.log('Entering authorize middleware');
  return (req: CustomRequest, res: Response, next: NextFunction) => {
    // 1. Check if req.user exists (set by the auth middleware)
    if (!req.user) {
      // This should ideally be caught by the preceding 'auth' middleware, 
      // but serves as a safeguard.
      return res.status(401).json({ msg: 'Authentication required.' });
    }

    const userRole = req.user.role; 

    // 2. Check if the user's role is in the authorized list
    if (!requiredRoles.includes(userRole)) {
      // 403 Forbidden: User is authenticated but lacks necessary permissions
      return res.status(403).json({ msg: 'Access denied: Insufficient privileges.' });
    }
    
    // 3. If authorized, proceed to the next middleware or controller
    next();
  };
};

export default authorize;