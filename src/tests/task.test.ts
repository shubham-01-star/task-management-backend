import request from 'supertest';
import express from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import authRouter from '../routes/auth';
import taskRouter from '../routes/task';
import User from '../models/User';
import Task from '../models/Task';
import { createToken } from '../utils/jwt';

jest.mock('../utils/socket', () => ({
    getSocket: () => ({
        emit: jest.fn(),
    }),
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/tasks', taskRouter);

let mongoServer: MongoMemoryServer;
let adminToken: string;
let managerToken: string;
let userToken: string;
let adminId: string;
let managerId: string;
let userId: string;
let taskId: string;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create users
    const admin = await User.create({ username: 'admin', email: 'admin@test.com', password: 'password', role: 'Admin' });
    const manager = await User.create({ username: 'manager', email: 'manager@test.com', password: 'password', role: 'Manager' });
    const user = await User.create({ username: 'user', email: 'user@test.com', password: 'password', role: 'User' });
    
    adminId = admin._id.toString();
    managerId = manager._id.toString();
    userId = user._id.toString();

    // Create tokens
    adminToken = createToken({ id: adminId, role: 'Admin' });
    managerToken = createToken({ id: managerId, role: 'Manager' });
    userToken = createToken({ id: userId, role: 'User' });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Task.deleteMany({});
    const task = await Task.create({ title: 'Test Task', createdBy: adminId, assignedTo: userId, status: 'Pending', priority: 'High' });
    taskId = task._id.toString();
});

describe('Task API', () => {

    describe('POST /api/tasks', () => {
        it('should create a new task', async () => {
            const res = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: 'New Task',
                    description: 'A new task',
                    assignedTo: userId,
                });

            expect(res.status).toBe(201);
            expect(res.body.title).toBe('New Task');
        });
    });

    describe('GET /api/tasks', () => {
        it('should get a list of tasks', async () => {
            const res = await request(app)
                .get('/api/tasks')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
        });
    });

    describe('PUT /api/tasks/:id', () => {
        it('should update a task', async () => {
            const res = await request(app)
                .put(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    status: 'In Progress',
                });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('In Progress');
        });
    });

    describe('DELETE /api/tasks/:id', () => {
        it('should delete a task', async () => {
            const res = await request(app)
                .delete(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.msg).toBe('Task removed');
        });
    });

    describe('PUT /api/tasks/assign/:taskId', () => {
        it('should assign a task to a different user', async () => {
            const res = await request(app)
                .put(`/api/tasks/${taskId}/assign`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    userId: managerId,
                });

            expect(res.status).toBe(200);
            expect(res.body.assignedTo.username).toBe('manager');
        });
    });
});
