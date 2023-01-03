import {initWorker} from "./crawler";
import {logger} from "../logger";

const workerCount = process.env.WORKER_COUNT_PER_JOB || 1

export const setupWorkers = () => {
    logger.info(`Initializing worker with concurrency: ${workerCount}`)
    initWorker(Number(workerCount))
    logger.info(`Initialized, waiting for jobs!`)
}