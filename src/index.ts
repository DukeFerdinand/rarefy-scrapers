import express from 'express';
import { PrismaClient } from '@prisma/client'
import {config} from 'dotenv';

import {logger} from "./logger";
import {setupWorkers} from "./workers/setup";
import {BuyeeJob, crawlerJobCreator, ScrapeTarget} from "./queue";
import {getSearchTerms} from "./db/getTerms";
import {verifyAuthToken} from "./utils/verifyAuthToken";

config();

if (process.env.NODE_ENV !== 'production') {
	import('dotenv').then((d) => d.config());
}

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.use(async (req, res, next) => {
	next()
});

app.use(async (req, res, next) => {
	const token = req.headers.authorization?.split(' ')[1];
	// get IP from request
	const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

	if (req.url === '/health' || req.url === '/') {
		logger.info(`${ip} ${req.method} - ${req.url}`);
		return next()
	}


	if (!token) {
		logger.info(`${ip} ${req.method} - ${req.url} with NO TOKEN`);

		return res.status(401).send('Unauthorized');
	}

	const machineUser = await verifyAuthToken(token);

	if (!machineUser) {
		logger.info(`${ip} ${req.method} - ${req.url} with INVALID TOKEN`);

		return res.status(401).send('Unauthorized');
	}

	logger.info(`${ip} ${req.method} / ${machineUser} - ${req.url} with token ${token}`);

	next();
});

app.get('/', (req, res) => {
	res.send('Hello, World!');
});

app.get('/health', async (req, res) => {
	await fetch('https://buyee.jp', {
		headers: {
			'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
		}
	}).then(html => html.text()).then(html => {
		console.log(html);
		if (html.includes('Site Maintenance')) {
			return res.status(500).send({
				error: 'Buyee is down, can\'t scrape'
			});
		}
	})
	res.send({ status: 'UP' });
});

app.post('/buyee', async function (req, res) {
	const terms = await getSearchTerms()
	if (terms.length !== 0) {
		for (const term of terms) {
			const job = crawlerJobCreator.createJob<BuyeeJob>({
				jobType: ScrapeTarget.BUYEE,
				terms: [term]
			});
			job.on("progress", (progress) => {
				logger.info(`Progress: ${progress}% for job ${job.id}`);
			})

			await job.save();
		}
		res.status(200).send('Buyee job(s) enqueued! :)');
	} else {
		res.status(200).send('No terms found to scrape :(');
	}



});

const port = process.env.PORT || 3000;
app.listen(port, () => {
	logger.info(`Server listening on port ${port}`);
	setupWorkers()
});
