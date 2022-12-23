import Queue from 'bee-queue'

const QUEUE_NAME = 'scraper'

export const jobCreator = new Queue(QUEUE_NAME, {
    removeOnSuccess: true,
    redis: {
        url: process.env.REDIS_URL,
    },
    isWorker: false,
});

export const jobConsumer = new Queue(QUEUE_NAME, {
    redis: {
        url: process.env.REDIS_URL
    }
});