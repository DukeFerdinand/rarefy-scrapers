import {SavedSearch} from '@prisma/client'
import {getSearchTerms} from "../db/getTerms";

export interface CrawlerJob {
	jobType: 'crawler',
	query: SavedSearch,
}

export const createCrawlerJobs = async (): Promise<CrawlerJob[]> => {
	const searchTerms = await getSearchTerms();
	return searchTerms.map((term) => {
		return {
			jobType: 'crawler',
			query: term
		};
	});
}