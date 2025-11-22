import { Request, Response } from 'express';
// Assuming IUser is defined in '../models/User'
import User, { IUser } from '../models/User'; 
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createToken } from '../utils/jwt';
import { body, validationResult } from 'express-validator';
import { CustomRequest } from '../middleware/auth'; // Custom type for login/profile

// Import Document type from mongoose to correctly type model results
import type { Document } from 'mongoose'; 

// Define the type for a Mongoose User Document (IUser data + Mongoose methods)
// This resolves the error: "Type 'IUser' is not assignable to type 'Document<...>'."
type IUserDocument = Document<unknown, {}, IUser> & IUser;

// --- Helper Functions and Validation ---
export const registrationValidation = [
  body('username', 'Username is required').not().isEmpty(),
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
];

export const loginValidation = [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists(),
];


// --- Controller Logic ---

/**
 * @route POST /api/auth/register
 * @desc Register user & get token
 * @access Public
 */
export const registerUser = async (req: Request, res: Response) => {
  console.log('Entering registerUser function');
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;

  try {
    // 1. Check if user already exists
    let user: IUserDocument | null = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // 2. Create new user instance
    // Cast to the correct Document type, not just IUser
    user = new User({
      username,
      email,
      password,
    }) as IUserDocument; 

    // 3. Hash Password 
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // 4. Save user to database
    await user.save();

    // 5. Create JWT Payload
    const payload = {
      id: user.id, // Mongoose documents have an 'id' getter
      role: user.role,
    };

    // 6. Sign/Issue JWT Token
    const token = createToken(payload);
res.status(201).json({ token });
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).send('Server error during registration');
  }
};


/**
 * @route POST /api/auth/login
 * @desc Authenticate user & get token
 * @access Public
 */
export const loginUser = async (req: Request, res: Response) => {
  console.log('Entering loginUser function');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // 1. Check if user exists (Validation)
    const user: IUserDocument | null = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // 2. Compare Passwords (Validation)
    // User is non-null here, so user.password is safe to access (with non-null assertion or check)
    const isMatch = await bcrypt.compare(password, user.password as string);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // 3. Create JWT Payload
    const payload = {
      id: user.id,
      role: user.role,
    };

    // 4. Sign/Issue JWT Token
    const token = createToken(payload);
res.json({ token });
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).send('Server error during login');
  }
};

/**
 * @route GET /api/auth/profile
 * @desc Get authenticated user's profile
 * @access Private (Requires auth middleware)
 */
export const getUserProfile = async (req: CustomRequest, res: Response) => {
    console.log('Entering getUserProfile function');
    // Check if req.user exists before accessing its properties (Fixes 'user' is possibly 'null')
    if (!req.user?.id) {
        return res.status(401).json({ msg: 'User not authenticated or token is malformed.' });
    }
    
    const userId = req.user.id;

    try {
        // Fetch user profile excluding the password field. The return type is IUserDocument | null
        const user: IUserDocument | null = await User.findById(userId).select('-password');
        
        // Explicitly check for null after the database query (Fixes 'user' is possibly 'null')
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // To avoid Mongoose model methods being sent in the response, use .toObject()
        // We use { getters: true } to include the virtual 'id'
        res.json(user.toObject({ getters: true }));

    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error fetching profile');
    }
};

/**
 * @route POST /api/auth/logout
 * @desc Invalidate token
 * @access Private (Requires auth middleware)
 */
export const logoutUser = (req: CustomRequest, res: Response) => {
    console.log('Entering logoutUser function');
    try {
        // In a real application, the token in the Authorization header 
        // would be added to a temporary blacklist here. 
        res.json({ msg: 'Logged out successfully. Token invalidated (if blacklisting is implemented).' });
    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error during logout');
    }
};