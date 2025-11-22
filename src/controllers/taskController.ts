import { Response } from 'express';
import Task, { ITask } from '../models/Task';
import { CustomRequest } from '../middleware/auth'; 
import { validationResult, body, param } from 'express-validator';
import mongoose from 'mongoose';
// --- ADVANCED FEATURE IMPORTS ---
import { sendNotification } from '../services/notificationService'; // For Third-Party Notifications
import { getSocket } from '../utils/socket'; // For Real-Time Updates (WebSockets)

// --- Validation Middleware ---

export const taskCreationValidation = [
    body('title', 'Title is required').not().isEmpty(),
    body('dueDate', 'Due date must be a valid date').optional().isISO8601().toDate(),
    body('priority', 'Invalid priority value').optional().isIn(['Low', 'Medium', 'High']),
    body('assignedTo', 'Assigned user ID must be a valid Mongo ID').isMongoId(),
];


// --- Task CRUD Operations ---

/**
 * @route POST /api/tasks
 * @desc Create a new task
 * @access Private (All authenticated users)
 */
export const createTask = async (req: CustomRequest, res: Response) => {
    console.log('Entering createTask function');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, dueDate, priority, assignedTo } = req.body;
    const createdById = req.user!.id; // Creator is the authenticated user

    try {
        const newTask = new Task({
            title,
            description,
            dueDate,
            priority,
            assignedTo, 
            createdBy: createdById,
            status: 'Pending', 
        }) as ITask;

        const task = await newTask.save();
        
        // --- REAL-TIME UPDATE ---
        const io = getSocket();
        io.emit('task:created', { task });
        
        // --- NOTIFICATION INTEGRATION ---
        sendNotification('TASK_CREATED', task, assignedTo);

        res.status(201).json(task);

    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error creating task');
    }
};


/**
 * @route GET /api/tasks
 * @desc Retrieve a list of tasks with filtering and sorting
 * @access Private (RBAC enforced internally)
 */
export const getTasks = async (req: CustomRequest, res: Response) => {
    console.log('Entering getTasks function');
    const { status, priority, sortBy, sortOrder, search, dueDateFrom, dueDateTo } = req.query;
    const { id: userId, role } = req.user!;
    
    let filter: any = {};
    let sort: any = {};

    // 1. RBAC Filtering: Restrict tasks based on role
    if (role === 'User') {
        // Users only see tasks assigned to them
        filter.assignedTo = userId;
    } 
    if (role === 'Manager') {
        // Managers see tasks they created OR are assigned to
        filter.$or = [
            { createdBy: userId },
            { assignedTo: userId }
        ];
    }
    // Admin sees all

    // 2. Query Filtering
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) {
        filter.$text = { $search: search as string };
    }
    if (dueDateFrom || dueDateTo) {
        filter.dueDate = {};
        if (dueDateFrom) {
            filter.dueDate.$gte = new Date(dueDateFrom as string);
        }
        if (dueDateTo) {
            filter.dueDate.$lte = new Date(dueDateTo as string);
        }
    }

    // 3. Sorting
    if (sortBy) {
        sort[sortBy as string] = (sortOrder === 'desc' ? -1 : 1);
    } else {
        sort.createdAt = -1; // Default sort by newest first
    }

    try {
        const tasks = await Task.find(filter)
            .sort(sort)
            .populate('assignedTo', 'username email') // Populate user details
            .populate('createdBy', 'username email');
            
        res.json(tasks);

    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error retrieving tasks');
    }
};


/**
 * @route PUT /api/tasks/:id
 * @desc Update task details
 * @access Private (RBAC enforced internally)
 */
export const updateTask = async (req: CustomRequest, res: Response) => {
    console.log('Entering updateTask function');
    const { id: userId, role } = req.user!;
    const taskId = req.params.id;
    const updates = req.body;
    let notificationType: 'TASK_STATUS_UPDATE' | 'TASK_ASSIGNED' = 'TASK_STATUS_UPDATE';


    // Validate if task ID is valid
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return res.status(404).json({ msg: 'Task not found' });
    }

    try {
        let task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        // 1. RBAC Enforcement & Ownership Check
        const isOwner = task.assignedTo.toString() === userId || task.createdBy.toString() === userId;
        
        if (role !== 'Admin' && !isOwner) {
            return res.status(403).json({ msg: 'Forbidden: You do not have permission to update this task.' });
        }
        
        // Determine Notification Type (Check if assignment changed)
        const previousAssignee = task.assignedTo.toString();
        if (updates.assignedTo && updates.assignedTo.toString() !== previousAssignee) {
            notificationType = 'TASK_ASSIGNED';
        }

        // 2. Update the task
        const updatedTask = await Task.findByIdAndUpdate(taskId, { $set: updates }, { new: true }) as ITask;
        
        // --- REAL-TIME UPDATE ---
        const io = getSocket();
        io.emit('task:updated', { task: updatedTask });
        
        // --- NOTIFICATION INTEGRATION ---
        sendNotification(notificationType, updatedTask, updatedTask.assignedTo.toString());

        res.json(updatedTask);

    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error updating task');
    }
};


/**
 * @route DELETE /api/tasks/:id
 * @desc Delete a task
 * @access Private (RBAC enforced internally)
 */
export const deleteTask = async (req: CustomRequest, res: Response) => {
    console.log('Entering deleteTask function');
    const { id: userId, role } = req.user!;
    const taskId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return res.status(404).json({ msg: 'Task not found' });
    }

    try {
        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        // 1. RBAC Enforcement & Ownership Check
        const isCreator = task.createdBy.toString() === userId;

        if (role !== 'Admin' && !isCreator) {
            return res.status(403).json({ msg: 'Forbidden: You do not have permission to delete this task.' });
        }
        
        // Store assignedTo ID before deletion for notification
        const assignedToId = task.assignedTo.toString();

        // 2. Delete the task
        await Task.findByIdAndDelete(taskId);
        
        // --- REAL-TIME UPDATE ---
        const io = getSocket();
        io.emit('task:deleted', { taskId });

        // --- NOTIFICATION INTEGRATION ---
        // Pass minimal data since the task object is gone
        sendNotification('TASK_DELETED', { _id: taskId, assignedTo: assignedToId } as any, assignedToId);

        res.json({ msg: 'Task removed' });

    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error deleting task');
    }
};


/**
 * @route PUT /api/tasks/assign/:taskId
 * @desc Assign a task to a different user
 * @access Private (Admin or Manager only)
 */
export const assignTask = async (req: CustomRequest, res: Response) => {
    console.log('Entering assignTask function');
    const taskId = req.params.taskId;
    const { userId: newAssigneeId } = req.body; // New user ID to assign to

    if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(newAssigneeId)) {
        return res.status(400).json({ msg: 'Invalid Task ID or User ID' });
    }

    try {
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        // Update the task's assignment
        const updatedTask = await Task.findByIdAndUpdate(
            taskId, 
            { $set: { assignedTo: newAssigneeId } }, 
            { new: true }
        ).populate('assignedTo', 'username email') as ITask;

        // --- REAL-TIME UPDATE ---
        const io = getSocket();
        io.emit('task:assigned', { task: updatedTask });

        // --- NOTIFICATION INTEGRATION ---
        sendNotification('TASK_ASSIGNED', updatedTask, newAssigneeId);

        res.json(updatedTask);

    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error assigning task');
    }
};