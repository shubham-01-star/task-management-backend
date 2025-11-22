import request from 'supertest';
import express from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import authRouter from '../routes/auth';
import analyticsRouter from '../routes/analytics';
import taskRouter from '../routes/task';
import User from '../models/User';
import Task from '../models/Task';
import { createToken } from '../utils/jwt';

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/tasks', taskRouter);

let mongoServer: MongoMemoryServer;
let adminToken: string;
let managerToken: string;
let userToken: string;
let adminId: string;
let managerId: string;
let userId: string;

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

  // Create tasks
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  await Task.create({ title: 'Overdue Task', createdBy: adminId, assignedTo: userId, status: 'In Progress', priority: 'High', dueDate: yesterday });
  await Task.create({ title: 'Due Soon Task', createdBy: managerId, assignedTo: userId, status: 'Pending', priority: 'Medium', dueDate: tomorrow });
  await Task.create({ title: 'Completed Task', createdBy: adminId, assignedTo: managerId, status: 'Completed', priority: 'Low' }); // Changed priority to Low for testing
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('GET /api/analytics', () => {
  it('should return analytics for an admin', async () => {
    const res = await request(app)
      .get('/api/analytics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalTasks).toBe(3);
    expect(res.body.tasksByStatus['In Progress']).toBe(1);
    expect(res.body.tasksByStatus['Pending']).toBe(1);
    expect(res.body.tasksByStatus['Completed']).toBe(1);
    expect(res.body.tasksByPriority['High']).toBe(1);
    expect(res.body.tasksByPriority['Medium']).toBe(1);
    expect(res.body.tasksByPriority['Low']).toBe(1);
    expect(res.body.overdueTasks).toBe(1);
    expect(res.body.tasksDueSoon).toBe(1);
    expect(res.body.userLeaderboard).toEqual({
      'user': { total: 2, completed: 0 },
      'manager': { total: 1, completed: 1 },
    });
  });

  it('should return analytics for a manager', async () => {
    const res = await request(app)
        .get('/api/analytics')
        .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalTasks).toBe(2);
    expect(res.body.overdueTasks).toBe(0);
    expect(res.body.tasksDueSoon).toBe(1);
    expect(res.body.userLeaderboard).toEqual({
      'user': { total: 1, completed: 0 },
      'manager': { total: 1, completed: 1 },
    });
    });

    it('should return analytics for a user', async () => {
        const res = await request(app)
            .get('/api/analytics')
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);
        expect(res.body.totalTasks).toBe(2);
        expect(res.body.overdueTasks).toBe(1);
        expect(res.body.tasksDueSoon).toBe(1);
        expect(res.body.userLeaderboard).toBeUndefined();
    });
});
