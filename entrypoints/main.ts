import {config} from "dotenv";
config();

const main = async () => {
	const { logger } = await import("../src/logger");
	const {setupWorkers} = await import("../src/workers/setup");
	const {redisClient} = await import("../src/db/cache");

	logger.info(`Creating redis connection`);
	await redisClient.connect()

	logger.info("Setting up workers");
	setupWorkers();
}

main().catch(async (e) => {
	const { logger } = await import("../src/logger");
	logger.error("Error in main thread", e)
})