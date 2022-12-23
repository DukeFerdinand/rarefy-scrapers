import Queue from 'bee-queue'

export const jobQueue = new Queue('scraper-queue', {
    redis: {
        url: process.env.REDIS_URL
    }
});