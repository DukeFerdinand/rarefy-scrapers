import playwright from 'playwright-firefox'

import {logger} from "../logger";
import {BuyeeJob} from "../queue";

const BASE_URL = "https://buyee.jp/item/search/query{{term}}"

export const scrapeBuyee = async (terms: BuyeeJob['terms']) => {
    logger.info(`Buyee scraper: scraping ${terms.length} terms`);

    const browser = await playwright.firefox.launch()
    for (const term of terms) {
        logger.info(`Buyee scraper: scraping ${term.query}`);
        const page = await browser.newPage()

        let url = BASE_URL.replace("{{term}}", term.query)

        // Add any url modifiers here
        if (term.vinylOnly) {
            url += "/category/22260"
        }

        await page.goto(url)
        const items = await page.$$('.itemList')
        logger.info(`Buyee scraper: found ${items.length} items for ${term.name}`);
        await page.close()
    }

}