import { Response } from 'express';
import Task from '../models/Task';
import { CustomRequest } from '../middleware/auth';
import User from '../models/User'; // Import User model for leaderboard

// Define the structure for the aggregated analytics response
interface IAnalyticsResponse {
    totalTasks: number;
    tasksByStatus: {
        [key: string]: number; 
    };
    tasksByPriority: {
        [key: string]: number;
    };
    overdueTasks: number;
    tasksDueSoon: number;
    userLeaderboard?: { // For Admins/Managers
        [username: string]: {
            total: number;
            completed: number;
        };
    };
}

/**
 * Helper function to determine the MongoDB filter based on the user's role.
 */
const getTaskFilterByRole = (userId: string, role: 'Admin' | 'Manager' | 'User'): any => {
    let filter: any = {};
    
    if (role === 'User') {
        filter.assignedTo = userId;
    } 
    
    if (role === 'Manager') {
        filter.$or = [
            { createdBy: userId },
            { assignedTo: userId }
        ];
    }
    
    return filter;
};

/**
 * @route GET /api/analytics/tasks
 * @desc Get task distribution statistics relevant to the authenticated user's role
 * @access Private (Requires auth middleware)
 */
export const getTaskAnalytics = async (req: CustomRequest, res: Response) => {
    console.log('Entering getTaskAnalytics function');
    const { id: userId, role } = req.user!; 

    try {
        const filter = getTaskFilterByRole(userId, role);

        // Fetch tasks with necessary fields, populating user details for the leaderboard
        const tasks = await Task.find(filter)
            .select('status priority dueDate assignedTo')
            .populate('assignedTo', 'username');

        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);

        let overdueTasks = 0;
        let tasksDueSoon = 0;
        const userTaskCounts: { [username: string]: { total: number, completed: number } } = {};
        
        const analyticsData: IAnalyticsResponse = {
            totalTasks: tasks.length,
            tasksByStatus: { 'Pending': 0, 'In Progress': 0, 'Completed': 0 },
            tasksByPriority: { 'Low': 0, 'Medium': 0, 'High': 0 },
            overdueTasks: 0,
            tasksDueSoon: 0,
        };

        tasks.forEach(task => {
            // Status & Priority aggregation
            if (task.status in analyticsData.tasksByStatus) {
                analyticsData.tasksByStatus[task.status] += 1;
            }
            if (task.priority in analyticsData.tasksByPriority) {
                 analyticsData.tasksByPriority[task.priority] += 1;
            }

            // Overdue tasks calculation
            if (task.dueDate && task.dueDate < now && task.status !== 'Completed') {
                overdueTasks++;
            }
            
            // Tasks due soon calculation
            if (task.dueDate && task.dueDate > now && task.dueDate <= tomorrow) {
                tasksDueSoon++;
            }
            
            // Leaderboard aggregation (if user populated)
            if (task.assignedTo && (task.assignedTo as any).username) {
                const username = (task.assignedTo as any).username;
                if (!userTaskCounts[username]) {
                    userTaskCounts[username] = { total: 0, completed: 0 };
                }
                userTaskCounts[username].total++;
                if (task.status === 'Completed') {
                    userTaskCounts[username].completed++;
                }
            }
        });

        analyticsData.overdueTasks = overdueTasks;
        analyticsData.tasksDueSoon = tasksDueSoon;
        
        // Include leaderboard for Admins and Managers
        if (role === 'Admin' || role === 'Manager') {
            analyticsData.userLeaderboard = userTaskCounts;
        }

        res.json(analyticsData);

    } catch (err) {
        console.error((err as Error).message);
        res.status(500).send('Server error calculating task analytics');
    }
};