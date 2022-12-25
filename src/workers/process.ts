import {getS3Client} from "../db/s3";
import {isMainThread, parentPort} from "worker_threads";
import {processJobConsumer, ScrapeTarget} from "../queue";

// interface WorkerData {
//     jobType: ScrapeTarget;
//     files: string[];
// }

function formatBuyeeFileName(url: string) {
    return `buyee/${url.split('users/')[1]?.split('/')[1]}`
}

export const downloadAndProcessFiles = async (files: string[], fileNameFunction: (url: string) => string) => {
    await Promise.all(files.map(async (f) => {
        const s3Client = getS3Client()

        const file = await fetch(f, {
            headers: {
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0"
            }
        })

        const fileBuffer = Buffer.from(await file.arrayBuffer())

        const params = {
            Bucket: 'rarefy-cdn',
            Key: fileNameFunction(f),
            // Expires: 60 * 60 * 24 * 30, // 1 month
            Body: fileBuffer,
        }

        // await s3Client.upload(params).promise()

        return params.Key
    }));
}

if (!isMainThread) {
    parentPort?.postMessage(`Worker started`)
    processJobConsumer.process(async (job) => {
        parentPort?.postMessage(`processing job ${job.id}`)
    })
    // const start = Date.now()
    // parentPort?.postMessage(`Worker ${process.pid} started`);
    //
    // downloadAndProcessFiles(workerData.files, (url) => {
    //     switch (workerData.jobType) {
    //         case ScrapeTarget.BUYEE:
    //             return formatBuyeeFileName(url)
    //         default:
    //             parentPort?.emit('error', `Unknown job type: ${workerData.jobType}`)
    //             throw new Error(`Unknown job type ${workerData.jobType}`)
    //     }
    // }).then(() => {
    //     parentPort?.postMessage(`Worker ${process.pid} finished in ${Date.now() - start}ms`);
    //     parentPort?.emit('exit', 0)
    // }).catch((err) => {
    //     parentPort?.emit('error', err)
    // })
}