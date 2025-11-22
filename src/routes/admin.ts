import { Router, Request, Response } from 'express';
import auth from '../middleware/auth';
import authorize from '../middleware/rbac';
import User from '../models/User'; 
import { body, validationResult, param } from 'express-validator'; // param imported
import mongoose from 'mongoose';

const router = Router();

// Middleware: Requires authentication and Admin role
router.use(auth);
router.use(authorize(['Admin']));

// Validation for role update - Checking the 'role' in the body, and 'userId' in the URL params
const roleUpdateValidation = [
    body('role', 'Invalid role provided').isIn(['Admin', 'Manager', 'User']),
    param('userId', 'Invalid user ID format in URL parameter').isMongoId(), // Using param() for userId
];

// @route PUT api/admin/users/:userId/role
// @desc Update a user's role (Admin Only)
// @access Private (Admin)
router.put(
    '/users/:userId/role',
    roleUpdateValidation,
    async (req: Request, res: Response) => {
        console.log('Entering admin route handler');
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { role } = req.body;
        const { userId } = req.params; // userId comes from URL param

        // The param validation already checked if it's a valid Mongo ID.

        try {
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({ msg: 'User not found' });
            }

            user.role = role;
            await user.save();

            // Exclude password from the response
            const userObject = user.toObject({ getters: true });
            delete userObject.password;

            res.json({ msg: `Role for user ${userObject.username} updated to ${role}`, user: userObject });

        } catch (err) {
            console.error((err as Error).message);
            res.status(500).send('Server error updating user role');
        }
    }
);

export default router;