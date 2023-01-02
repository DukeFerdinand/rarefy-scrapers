import {Job} from "bee-queue";
import {parentPort} from "worker_threads";
import uuid from 'uuid'

import {crawlerJobConsumer} from '../queue'
import {logger} from "../logger";
import {CrawlerJob} from "../functions/createCrawlerJobs";
import {BuyeeItemDetails, BuyeeSearchResult, scrapeBuyee} from "../jobs/scrapeBuyee";
import {getPrisma} from "../db/getPrisma";


export const initWorker = (concurrency: number = 3) => {
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

		const prisma = getPrisma()

		await prisma.searchResult.create({
			data: {
				id: uuid.v4(),
				...results[0],
				searchId: id
			}
		})

		logger.warn("WROTE ONE TO DB!")

		// const res = await getPrisma().searchResult.createMany({
		// 	skipDuplicates: true,
		// 	data: results.map(r => ({
		// 		...r,
		// 		id: uuid.v4(),
		// 		searchId: id
		// 	}))
		// })

		// for (const result of results) {
		// 	logger.info("Is the loop even running?")
		// 	const prismaResult = await prisma.searchResult.upsert({
		// 		where: {
		// 			url: result.url
		// 		},
		// 		create: {
		// 			...result,
		// 			id: uuid.v4(),
		// 			searchId: id
		// 		},
		// 		update: {
		// 			currentPrice: result.currentPrice,
		// 			updatedAt: result.updatedAt
		// 		}
		// 	})
		// }

		job.emit('succeeded', results)
	})
}
