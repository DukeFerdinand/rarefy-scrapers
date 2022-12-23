import {isMainThread, workerData, parentPort} from 'worker_threads'
import type {Job, DoneCallback} from 'bee-queue'

import {logger} from "../logger";
import {jobQueue} from "../queue";

logger.info(`Starting worker thread ${workerData.id}`);


// Run the queue in the worker thread only so we can export from here if required
if (!isMainThread) {
    jobQueue.process(function (job: Job<object>, done: DoneCallback<unknown>) {
        parentPort?.postMessage("Handling job")
        const startTimestamp = Date.now();
        logger.info(`Worker ${workerData.id}: processing job ${job.id}`);
        // do some work with "job.data" and then call done()
        logger.info(`Worker ${workerData.id}: job ${job.id} took ${Date.now() - startTimestamp}ms`);
        return done(null, 'TEMP RESPONSE! :^)');
    });
} else {
    console.log('main')
}