import {config} from "dotenv";
import {crawlerJobCreator} from "../src/queue";
import {createCrawlerJobs} from "../src/functions/createCrawlerJobs";

// env will be populated by GitHub Actions in "prod" environment
config()

async function main() {
	console.log("- Starting cron job");
	const crawlerJobs = await createCrawlerJobs()
	console.log(`- Creating ${crawlerJobs.length} crawler jobs`);

	for (const job of crawlerJobs) {
		await crawlerJobCreator.createJob(job).save()
	}

	console.log("- Finished cron job");
	process.exit(0)
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});