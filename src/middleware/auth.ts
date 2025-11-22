import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend the Express Request interface to include the user data from JWT payload
export interface CustomRequest extends Request {
  user?: {
    id: string;
    role: 'Admin' | 'Manager' | 'User';
  };
}

const auth = (req: CustomRequest, res: Response, next: NextFunction) => {
  console.log('Entering auth middleware');
  // Get token from header (removes 'Bearer ' prefix if present)
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    // 401 Unauthorized: No token provided
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // Verify the token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string, role: 'Admin' | 'Manager' | 'User' };
    
    // Attach the user info (ID and role) to the request object for downstream use
    req.user = decoded; 
    next();
  } catch (err) {
    // 401 Unauthorized: Token is invalid (expired, wrong signature, etc.)
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

export default auth;