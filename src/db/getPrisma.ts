import { PrismaClient } from '@prisma/client'
import {logger} from "../logger";

export const getPrisma = () => {
	const client = new PrismaClient()

	client.$use(async (params, next) =>{
		logger.info(`Prisma command: ${params.model}.${params.action}`)

		return next(params)
	})

	return client
};
