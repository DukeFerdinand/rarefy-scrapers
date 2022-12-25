import { isMainThread, parentPort } from "worker_threads";
import type { DoneCallback, Job } from "bee-queue";

import { scrapeJobConsumer, ScrapeTarget, ScraperJob } from "../queue";
import {scrapeBuyee} from "../jobs/scrapeBuyee";


// Run the queue in the worker thread only so we can export from here if required
if (!isMainThread) {
    parentPort?.postMessage(`Worker started`);
    scrapeJobConsumer.process(function (job: Job<ScraperJob>, done: DoneCallback<unknown>) {
        parentPort?.postMessage("Handling job")

        const startTimestamp = Date.now();
        parentPort?.postMessage( `processing job ${job.id}`)

        // do some work with "job.data" and then call done()
        switch (job.data.jobType) {
            case ScrapeTarget.BUYEE:
                parentPort?.postMessage(`identified job as type ${ScrapeTarget.BUYEE}`)

                scrapeBuyee(job.data.terms).then(() => {
                    parentPort?.postMessage(`job ${job.id} took ${Date.now() - startTimestamp}ms`);
                    return done(null, 'TEMP RESPONSE! :^)');
                }).catch((err: Error) => {
                    parentPort?.emit('error', `job ${job.id} failed with error: ${err.message}`);
                    return done(err);
                });

                break;
            default:
                parentPort?.emit('error', `job ${job.id} failed with error: unknown job type ${job.data.jobType}`);
                return done(new Error("Unknown job type"));
        }
    });
} else {
    console.error('can\'t run in main thread');
}