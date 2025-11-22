import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketIOServer;

/**
 * Initializes the Socket.IO server and attaches it to the HTTP server.
 * @param httpServer The Node.js HTTP server instance.
 */
export const initSocket = (httpServer: HttpServer) => {
    // Initialize Socket.IO with CORS settings for client connections
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: "*", // Allow all origins for testing, be restrictive in production
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log(`[Socket.IO] New client connected: ${socket.id}`);

        // Optional: Join a room based on the user's ID for personalized notifications
        // Example: socket.join(userId);

        socket.on('disconnect', () => {
            console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
        });
    });

    console.log("[Socket.IO] Server is running.");
    return io;
};

/**
 * Returns the initialized Socket.IO instance.
 * @throws {Error} If the socket server has not been initialized.
 */
export const getSocket = () => {
    if (!io) {
        throw new Error("Socket.IO not initialized. Call initSocket first.");
    }
    return io;
};