import { createClient } from 'redis';

const redisClient = createClient({
    //url: process.env.REDIS_URL // Uncomment and configure in .env if needed
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

redisClient.connect();

export default redisClient;
