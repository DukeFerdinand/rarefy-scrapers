import {Job} from "bee-queue";

import {crawlerJobConsumer} from '../queue'
import {logger} from "../logger";
import {parentPort} from "worker_threads";
import {CrawlerJob} from "../functions/createCrawlerJobs";
import {scrapeBuyee} from "../jobs/scrapeBuyee";

parentPort?.postMessage("starting crawler worker");

crawlerJobConsumer.process(async (job: Job<CrawlerJob>) => {
	console.log("Processing job", job.id);
	const {id} = job.data.query;

	logger.info(`Processing job ${job.id} for term ${id}`);

	await scrapeBuyee(job.data.query);

	job.emit('success', 'TEMP RESPONSE! :^)');
	parentPort?.postMessage("finished job " + job.id);
})