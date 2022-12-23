import express from 'express';
import { PrismaClient } from '@prisma/client'
import {config} from 'dotenv';

import {logger} from "./logger";
import {setupWorkers} from "./workers/setup";
import {jobCreator} from "./queue";
import {getSearchTerms} from "./db/getTerms";

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

	const storedToken = await prisma.accessToken.findUnique({
		where: {
			token
		},
		include: {
			MachineUser: {
				select: {
					commonName: true
				}
			}
		}
	})


	if (!storedToken || storedToken.revoked) {
		logger.info(`${ip} ${req.method} - ${req.url} with revoked or missing token ${token}`);

		return res.status(401).send('Unauthorized');
	}

	logger.info(`${ip} ${req.method} - ${req.url} with token ${token}`);

	next();
});

app.get('/', (req, res) => {
	res.send('Hello, World!');
});

app.get('/health', (req, res) => {
	res.send({ status: 'UP' });
});

app.post('/buyee', async function (req, res) {
	const terms = await getSearchTerms()
	if (terms.length) {
		const job = jobCreator.createJob({someData: 'someData'});
		job.progress(() => {
			logger.info(`Job ${job.id} progress: ${job.progress}%`);
		})

		await job.save();
		res.status(200).send('Buyee job(s) enqueued! :)');
	} else {
		res.status(200).send('Nothing to do! :(');
	}



});

const port = process.env.PORT || 3000;
app.listen(port, () => {
	logger.info(`Server listening on port ${port}`);
	setupWorkers()
});
