import {parentPort} from "worker_threads";
import Queue from "bull";

import {CrawlerJob} from "../functions/createCrawlerJobs";
import {scrapeBuyee} from "../jobs/scrapeBuyee";
import {ApiClient} from "../api/client";

const crawlerQueue = new Queue<CrawlerJob>('crawler queue', process.env.REDIS_URL!)
const apiClient = new ApiClient(
	process.env.API_URL,
	{
		headers: {
			'Authorization': `Bearer ${process.env.API_KEY}`
		}
	}
)

async function worker() {
	parentPort?.postMessage('setting up bull')

	crawlerQueue.process(async (job, done) => {
		try {
			const jobId = job.id
			const savedSearch = job.data.query
			parentPort?.postMessage(`processing job ${jobId}, query: ${savedSearch.query}`)

			const results = await scrapeBuyee(savedSearch);

			await apiClient.post('/api/search_results', {
				searchId: savedSearch.id,
				results
			})

			parentPort?.postMessage(`job ${jobId} finished, ${results.length} results`)

			done(null, results)
		} catch (e) {
			console.error(e)
			parentPort?.emit('error', e)
			done(e as Error)
		}
	})

	crawlerQueue.on('error', (error) => {
		parentPort?.emit('error', error)
	})

	parentPort?.postMessage('worker ready')
}

worker().catch((e) => {
	parentPort?.emit('error', e)
	process.exit(1)
})
