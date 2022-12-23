import {isMainThread, workerData, parentPort} from 'worker_threads'
import type {Job, DoneCallback} from 'bee-queue'

import {logger} from "../logger";
import {jobConsumer} from "../queue";

logger.info(`Starting worker thread ${workerData.id}`);


// Run the queue in the worker thread only so we can export from here if required
if (!isMainThread) {
    jobConsumer.process(function (job: Job<{someData: 'someData'}>, done: DoneCallback<unknown>) {
        parentPort?.postMessage("Handling job")
        job.progress(50)
        const startTimestamp = Date.now();
        logger.info(`Worker ${workerData.id}: processing job ${job.id}`);
        logger.info(`job data: ${JSON.stringify(job.data)}`);
        // do some work with "job.data" and then call done()
        logger.info(`Worker ${workerData.id}: job ${job.id} took ${Date.now() - startTimestamp}ms`);
        return done(null, 'TEMP RESPONSE! :^)');
    });
} else {
    console.error('can\'t run in main thread');
}