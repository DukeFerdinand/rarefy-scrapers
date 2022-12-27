import {config} from "dotenv";
import {crawlerJobCreator} from "../src/queue";
import {createCrawlerJobs} from "../src/functions/createCrawlerJobs";
import {checkBuyeeHealth} from "../src/utils/checkBuyeeHealth";

// env will be populated by GitHub Actions in "prod" environment
config()

async function main() {
	console.log("- Starting cron job");

	console.log("- Checking health of crawler targets");
	const health = await checkBuyeeHealth()

	if (!health) {
		console.log("- Service(s) down, skipping cron job");
		process.exit(1);
	}

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