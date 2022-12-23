import type { SavedSearch } from "@prisma/client";
import Queue from 'bee-queue'

const QUEUE_NAME = 'scraper'

export enum JobType {
    BUYEE = 'buyee',
    MERCARI = 'mercari',
}

export interface BuyeeJob {
    jobType: JobType.BUYEE,
    terms: SavedSearch[]
}

export interface MercariJob {
    jobType: JobType.MERCARI,
    terms: SavedSearch[]
}

export type ScraperJob = BuyeeJob | MercariJob

export const jobCreator = new Queue(QUEUE_NAME, {
    removeOnSuccess: true,
    redis: {
        url: process.env.REDIS_URL,
    },
    isWorker: false,
});

export const jobConsumer = new Queue(QUEUE_NAME, {
    redis: {
        url: process.env.REDIS_URL
    }
});