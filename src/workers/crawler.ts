import {Job} from "bee-queue";
import {parentPort} from "worker_threads";

import {crawlerJobConsumer} from '../queue'
import {logger} from "../logger";
import {CrawlerJob} from "../functions/createCrawlerJobs";
import {BuyeeSearchResult, scrapeBuyee} from "../jobs/scrapeBuyee";
import {ApiClient} from "../api/client";


export const initWorker = (concurrency: number = 3) => {
	const apiClient = new ApiClient(
		process.env.API_URL,
		{
			headers: {
				'Authorization': `Bearer ${process.env.API_TOKEN}`
			}
		}
	)
	crawlerJobConsumer.on("error", (e) => {
		logger.error(e)
		parentPort?.emit("messageerror", e)
	})

	crawlerJobConsumer.on("succeeded", (res: Job<BuyeeSearchResult[]>) => {
		console.log(res)
	})

	crawlerJobConsumer.process(concurrency, async (job: Job<CrawlerJob>) => {
		const {query, id} = job.data.query;
		logger.info(`Processing job ${job.id} for term ${query}`);

		const results = await scrapeBuyee(job.data.query);

		logger.info(`Processing ${results.length} results`)

		await apiClient.post(`/api/search_results`, {
			searchId: id,
			data: results,
		})

		job.emit('succeeded', results)
	})
}
