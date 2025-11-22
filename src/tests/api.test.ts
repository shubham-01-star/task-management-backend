import request from 'supertest';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.get('/', (req, res) => res.send('API Running'));

describe('GET /', () => {
  it('should return API Running', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('API Running');
  });
});
