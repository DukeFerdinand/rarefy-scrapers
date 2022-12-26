import {Worker} from "worker_threads";
import {logger} from "../logger";

const workerCount = process.env.WORKER_COUNT_PER_JOB || 1

export const setupWorkers = () => {
    for (const workerType of ['crawler', 'processor']) {
        logger.info(`Setting up ${workerCount} ${workerType} worker(s)`);
        const fileName = __dirname + '/' + workerType + '.js'

        let count = 0;
        while (count < workerCount) {
            const workerId = count + 1

            // Make sure you use the compiled file name
            const worker = new Worker(fileName, {
                workerData: {
                    id: workerId
                }
            });

            worker.on('message', (message) => {
                logger.info(`${workerType}/${workerId}: ${message}`);
            });

            worker.on('error', (error) => {
                const message = typeof error === "object" ? JSON.stringify(error) : error
                logger.error(`${workerType}/${workerId}: ${message}`);
            });

            worker.on('exit', (code) => {
                if (code !== 0) {
                    logger.error(`${workerType}/${workerId}: exited with code ${code}`);
                } else {
                    logger.info(`${workerType}/${workerId} stopped with exit code ${code}`);
                }
            });

            count += 1
        }
    }

}