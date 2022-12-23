import Queue from 'bee-queue'
export const buyeeQueue = new Queue('buyee', {
    redis: {
        url: process.env.REDIS_URL,
    }
});