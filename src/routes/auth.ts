import { Router } from 'express';
import auth from '../middleware/auth';
import { loginLimiter } from '../middleware/rateLimit'; // Module dependency check
import { 
    registerUser, 
    loginUser, 
    getUserProfile, 
    logoutUser,
    registrationValidation,
    loginValidation
} from '../controllers/authController';

const router = Router();

// @route POST api/auth/register 
// Apply validation middleware before the controller logic
router.post('/register', registrationValidation, registerUser); 

// @route POST api/auth/login
// Apply the loginLimiter middleware here for brute-force prevention
router.post('/login', loginLimiter, loginValidation, loginUser); 

// @route GET api/auth/profile 
// Requires the JWT 'auth' middleware to protect the endpoint
router.get('/profile', auth, getUserProfile); 

// @route POST api/auth/logout
// Requires the JWT 'auth' middleware
router.post('/logout', auth, logoutUser); 

export default router;