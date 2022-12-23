import {logger} from "../logger/index.js";
import {buyeeQueue} from "../queue.js";
import {isMainThread, workerData} from 'worker_threads'

// Run the queue in the worker thread only so we can export from here if required
if (!isMainThread) {
    logger.info(`Starting worker thread ${workerData.id}`);
    buyeeQueue.process(function (job, done) {
        const startTimestamp = Date.now();
        logger.info(`Processing job ${job.id}`);
        // do some work with "job.data" and then call done()
        logger.info(`Job ${job.id} took ${Date.now() - startTimestamp}ms`);
        return done(null, job.data.x + job.data.y);
    });
}