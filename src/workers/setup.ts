import {Worker} from 'worker_threads'
import {logger} from "../logger";

const workerCount = process.env.WORKER_COUNT_PER_JOB || 1

export const setupWorkers = () => {
    logger.info(`Initializing worker with concurrency: ${workerCount}`)

    let createdCount = 0
    while (createdCount < workerCount) {
        const workerId = createdCount + 1
        const worker = new Worker(`${__dirname }/crawler.js`)

        worker.on('message', (message) => {
            logger.info(`worker ${workerId}: ${message}`)
        })

        worker.on('error', (e) => {
            logger.error(`worker ${workerId} error: ${e}`)
        })

        worker.on('exit', (code) => {
            if (code !== 0) {
                logger.error(`worker ${workerId} stopped with exit code ${code}`)
            }
        })

        createdCount++
    }
}