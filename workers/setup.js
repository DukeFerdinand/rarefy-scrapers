import {Worker} from "worker_threads";
import {logger} from "../logger/index.js";

export const setupWorkers = () => {
    logger.info(`Setting up workers`);
    const worker = new Worker('./workers/buyee.js', {
        workerData: {
            id: 1
        }
    });
    worker.on('message', (message) => {
        logger.info(`Received message from worker: ${message}`);
    });

    worker.on('error', (error) => {
        const message = typeof error === "object" ? JSON.stringify(error) : error
        logger.error(`Received error from worker: ${message}`);
    });

    worker.on('exit', (code) => {
        logger.info(`Worker stopped with exit code ${code}`);
    });
}