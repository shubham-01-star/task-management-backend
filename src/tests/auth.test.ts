import request from 'supertest';
import express from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import authRouter from '../routes/auth';
import User from '../models/User';
import { createToken } from '../utils/jwt';

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
    await User.deleteMany({});
});


describe('Auth API', () => {

    describe('POST /api/auth/register', () => {
        it('should register a new user and return a token', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@test.com',
                    password: 'password123',
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('token');
        });

        it('should not register a user that already exists', async () => {
            await User.create({ username: 'testuser', email: 'test@test.com', password: 'password123' });

            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@test.com',
                    password: 'password123',
                });

            expect(res.status).toBe(400);
            expect(res.body.msg).toBe('User already exists');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login a user and return a token', async () => {
            await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@test.com',
                    password: 'password123',
                });

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@test.com',
                    password: 'password123',
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
        });

        it('should not login a user with invalid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'wrong@test.com',
                    password: 'wrongpassword',
                });

            expect(res.status).toBe(400);
            expect(res.body.msg).toBe('Invalid Credentials');
        });
    });

    describe('GET /api/auth/profile', () => {
        it('should get the profile of the authenticated user', async () => {
            const user = await User.create({ username: 'testuser', email: 'test@test.com', password: 'password123' });
            const token = createToken({ id: user._id.toString(), role: 'User' });

            const res = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.username).toBe('testuser');
        });
    });


});
