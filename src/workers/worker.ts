import { isMainThread, parentPort, workerData } from "worker_threads";
import type { DoneCallback, Job } from "bee-queue";

import { logger } from "../logger";
import { jobConsumer, JobType, ScraperJob } from "../queue";
import {scrapeBuyee} from "../jobs/scrapeBuyee";

logger.info(`Starting worker thread ${workerData.id}`);


// Run the queue in the worker thread only so we can export from here if required
if (!isMainThread) {
    jobConsumer.process(function (job: Job<ScraperJob>, done: DoneCallback<unknown>) {
        parentPort?.postMessage("Handling job")

        const startTimestamp = Date.now();
        logger.info(`Worker ${workerData.id}: processing job ${job.id}`);

        // do some work with "job.data" and then call done()
        switch (job.data.jobType) {
            case JobType.BUYEE:
                logger.info(`Worker ${workerData.id}: identified buyee job`);

                scrapeBuyee(job.data.terms).then(() => {
                    logger.info(`Worker ${workerData.id}: job ${job.id} took ${Date.now() - startTimestamp}ms`);
                    return done(null, 'TEMP RESPONSE! :^)');
                }).catch((err: Error) => {
                    logger.error(`Worker ${workerData.id}: job ${job.id} failed with error: ${err.message}`);
                    return done(err);
                });

                break;
            default:
                logger.error(`Worker ${workerData.id}: job ${job.id} failed with error: unknown job type`);
                return done(new Error("Unknown job type"));
        }
    });
} else {
    console.error('can\'t run in main thread');
}