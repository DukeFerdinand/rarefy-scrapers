import {logger} from "../logger";
import {BuyeeJob} from "../queue";

export const scrapeBuyee = async (terms: BuyeeJob['terms']) => {
    logger.info(`Buyee scraper: scraping ${terms.length} terms`);
}