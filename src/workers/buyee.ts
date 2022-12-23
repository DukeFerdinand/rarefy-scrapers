import {isMainThread, workerData} from 'worker_threads'
import type {Job, DoneCallback} from 'bee-queue'

import {logger} from "../logger";
import {buyeeQueue} from "../queue";

logger.info(`Starting worker thread ${workerData.id}`);


// Run the queue in the worker thread only so we can export from here if required
if (!isMainThread) {
    buyeeQueue.process(function (job: Job<object>, done: DoneCallback<unknown>) {
        const startTimestamp = Date.now();
        logger.info(`Processing job ${job.id}`);
        // do some work with "job.data" and then call done()
        logger.info(`Job ${job.id} took ${Date.now() - startTimestamp}ms`);
        return done(null, 'TEMP RESPONSE! :^)');
    });
} else {
    console.log('main')
}