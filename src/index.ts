import express from 'express';
import { PrismaClient } from '@prisma/client'
import {config} from 'dotenv';

import {logger} from "./logger";
import {setupWorkers} from "./workers/setup";

config();

if (process.env.NODE_ENV !== 'production') {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	import('dotenv').then((d) => d.config());
}

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.use(async (req, res, next) => {
	await next()
});

app.use(async (req, res, next) => {
	const token = req.headers.authorization?.split(' ')[1];
	// get IP from request
	const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;


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
	res.status(200).send('OK');
});

app.listen(3000, () => {
	console.log('Server listening on port 3000');
	setupWorkers()
});
