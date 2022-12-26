import {Job} from "bee-queue";

import {crawlerJobConsumer} from '../queue'
import {checkBuyeeHealth} from "../utils/checkBuyeeHealth";
import {logger} from "../logger";
import {parentPort} from "worker_threads";
import {CrawlerJob} from "../functions/createCrawlerJobs";

parentPort?.postMessage("starting crawler worker");

crawlerJobConsumer.process(async (job: Job<CrawlerJob>) => {
	const {query, id} = job.data.query

	if (!await checkBuyeeHealth()) {
		logger.info(`Buyee is down, skipping job ${id}`);
		job.emit("failed", new Error("Buyee is down"));
		return;
	}

	logger.info(`Processing job ${job.id} for term ${id}`);

	job.emit('success', 'TEMP RESPONSE! :^)');
})