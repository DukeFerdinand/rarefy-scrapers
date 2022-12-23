import {Worker} from "worker_threads";
import {logger} from "../logger";

const workerCount = process.env.WORKER_COUNT_PER_JOB || 1

export const setupWorkers = () => {
    logger.info(`Setting up ${workerCount} worker(s)`);
    let count = 0
    while (count < workerCount) {
        const workerId = count + 1

        // Make sure you use the compiled file name
        const worker = new Worker(__dirname + '/worker.js', {
            workerData: {
                id: workerId
            },
        });

        worker.on('message', (message) => {
            logger.info(`Received message from worker ${workerId}: ${message}`);
        });

        worker.on('error', (error) => {
            const message = typeof error === "object" ? JSON.stringify(error) : error
            logger.error(`Received error from worker ${workerId}: ${message}`);
        });

        worker.on('exit', (code) => {
            logger.info(`Worker ${workerId} stopped with exit code ${code}`);
        });

        count += 1
    }
}