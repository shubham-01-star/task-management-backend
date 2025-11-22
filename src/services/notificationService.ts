import axios from 'axios';
import { ITask } from '../models/Task';
// Removed explicit import of AxiosError, which was causing the error.

// Get configuration from environment variables
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL;
const NOTIFICATION_API_KEY = process.env.NOTIFICATION_API_KEY;

// Define the payload structure for a notification
interface NotificationPayload {
    recipientId: string;
    type: 'TASK_CREATED' | 'TASK_ASSIGNED' | 'TASK_STATUS_UPDATE' | 'TASK_DELETED';
    subject: string;
    message: string;
    taskId: string;
}

/**
 * Sends a notification to the configured third-party service.
 * @param type The type of the notification.
 * @param task The task associated with the notification.
 * @param recipientId The ID of the recipient.
 */
export const sendNotification = async (type: NotificationPayload['type'], task: ITask, recipientId: string) => {
    console.log('Entering sendNotification function');
    // Basic check for configuration
    if (!NOTIFICATION_SERVICE_URL || !NOTIFICATION_API_KEY) {
        console.warn('Notification service is not configured. Skipping notification.');
        return;
    }

    const subject = `Task update: ${type}`;
    // The message is generated based on the task title, but the task object may not have the title property, so we need to handle that case.
    const message = `Task ${task?.title} (${task?._id}) was ${type.toLowerCase()}`;
    const taskId = task?._id?.toString();

    const payload: NotificationPayload = {
        recipientId,
        type,
        subject,
        message,
        taskId,
    };

    const { recipientId: newRecipientId, type: newType, subject: newSubject, message: newMessage, taskId: newTaskId } = payload;

    try {
        console.log(`Attempting to send notification of type [${newType}] to user: ${newRecipientId}`);
        
        await axios.post(
            NOTIFICATION_SERVICE_URL,
            {
                // API-specific payload structure (example)
                to: newRecipientId,
                type: newType,
                data: {
                    subject: newSubject,
                    message: newMessage,
                    taskId: newTaskId,
                }
            },
            {
                // Pass API Key as an authorization header (common practice)
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': NOTIFICATION_API_KEY,
                },
            }
        );

        console.log(`Notification sent successfully for task ${newTaskId}.`);

    } catch (error: unknown) {
        // Use axios.isAxiosError for robust type narrowing to handle 'unknown' error type.
        // This function is correctly exposed on the default axios import in modern versions.
        if (axios.isAxiosError(error)) {
            // TypeScript now correctly infers 'error' as AxiosError inside this block.
            console.error(
                `Notification service API error for task ${newTaskId}:`, 
                error.response?.data || error.message // Accessing AxiosError properties
            );
        } else {
            // Handle other potential errors (e.g., network issues, non-Axios exceptions)
            console.error(
                `Unknown error sending notification for task ${newTaskId}:`, 
                (error instanceof Error ? error.message : String(error))
            );
        }
    }
};