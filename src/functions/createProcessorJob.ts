import {SearchResult} from '@prisma/client'
import {getSearchTerms} from "../db/getTerms";

export interface ProcessorJob {
	jobType: 'processor';
	target: string; // DB ID of the SearchResult
}
