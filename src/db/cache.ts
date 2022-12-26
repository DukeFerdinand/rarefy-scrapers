import {createClient} from '@redis/client';

export const redisClient = createClient({
	url: process.env.REDIS_URL,
});
