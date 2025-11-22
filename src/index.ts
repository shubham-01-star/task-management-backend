import express, { Request, Response, NextFunction } from 'express'; // Added necessary types
import dotenv from 'dotenv';
import connectDB from './config/db';
import authRoutes from './routes/auth';
import taskRoutes from './routes/task'; // Using the user's singular 'task' route
import { createServer } from 'http'; // 👈 REQUIRED: Node.js HTTP module for Socket.IO
import { initSocket } from './utils/socket'; // 👈 REQUIRED: Socket.IO initializer
import { requestLogger } from './middleware/requestLogger'; // Import the new requestLogger

// Load environment variables
dotenv.config();

const app = express();

// --- Middleware Setup ---

app.use(requestLogger); // Use the request logger middleware here

// Rate Limiting (Assuming this is used as per assignment requirements)


// Init Middleware: Allows us to accept JSON data in the body
app.use(express.json());

app.get('/', (req: Request, res: Response) => res.send('API Running'));

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/admin', require('./routes/admin').default); // Admin routes
app.use('/api/analytics/tasks', require('./routes/analytics').default); // Analytics routes

// --- Error Handling Middleware (Best practice) ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});


const PORT = process.env.PORT || 5000;

// --- Server Initialization (Updated for WebSockets) ---

// 1. Create a standard HTTP server from the Express app
const httpServer = createServer(app);

// 2. Connect Database and then start the server
(async () => {
    try {
        await connectDB(); // Connect to the database first

        // 3. Initialize Socket.IO and attach it to the HTTP server
        initSocket(httpServer);

        // 4. Start listening on the HTTP server, not the express app directly
        httpServer.listen(PORT, () => console.log(`Server started on port ${PORT}`));
    } catch (error) {
        console.error("Failed to connect to DB or start server:", error);
        process.exit(1);
    }
})();