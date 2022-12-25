import type { SavedSearch } from "@prisma/client";
import Queue from 'bee-queue'

const SCRAPER_QUEUE = 'scraper'
const PROCESSOR_QUEUE = 'processor'

export enum ScrapeTarget {
    BUYEE = 'buyee',
    MERCARI = 'mercari',
}

export interface BuyeeJob {
    jobType: ScrapeTarget.BUYEE,
    terms: SavedSearch[]
}

export interface MercariJob {
    jobType: ScrapeTarget.MERCARI,
    terms: SavedSearch[]
}

export type ScraperJob = BuyeeJob | MercariJob

export enum JobType {
    SCRAPE = 'scrape',
    FILE_PROCESS = 'fileProcess',
}

const jobCreatorConfig = {
    removeOnSuccess: true,
    redis: {
        url: process.env.REDIS_URL,
    },
    isWorker: false,
}

export const scrapeJobCreator = new Queue(SCRAPER_QUEUE, {
    removeOnSuccess: true,
    redis: {
        url: process.env.REDIS_URL,
    },
    isWorker: false,
});

export const processJobCreator = new Queue(PROCESSOR_QUEUE, jobCreatorConfig)

const jobConsumerConfig = {
    redis: {
        url: process.env.REDIS_URL
    }
}

export const scrapeJobConsumer = new Queue(SCRAPER_QUEUE, jobConsumerConfig);

export const processJobConsumer = new Queue(PROCESSOR_QUEUE, jobConsumerConfig)
