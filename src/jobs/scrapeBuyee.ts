import playwright from 'playwright-firefox'

import {logger} from "../logger";
import {BuyeeJob} from "../queue";

const BASE_URL = "https://buyee.jp/item/search/query/{{term}}"

enum Currency {
    USD = "USD",
    EUR = "EUR",
    GBP = "GBP",
    JPY = "JPY",
    BRL = "BRL",
}

interface BuyeeSearchResult {
    title: string,
    price: number, // Yen
    currency: Currency,
    link: string,
    seller: string,
    timeRemaining: string,
    bids: number,
}

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

        console.log(url)

        url += "?translationType=1&suggest=1"

        await page.goto(url)
        const items = await page.$$('.itemCard')

        if (items) {
            logger.info(`Buyee scraper: found ${items.length} items for ${term.query}`);
            const scrapedItems: BuyeeSearchResult[] = []
            for (const item of items) {
                const searchResult: BuyeeSearchResult = {
                    currency: Currency.JPY,
                } as BuyeeSearchResult

                const {title, href} = await item.$eval('.itemCard__itemName > a', (el) => {
                    return {
                        title: el.textContent?.trim() || "",
                        href: el.getAttribute('href') || ''
                    }
                })

                const price = await item.$eval('.g-price', (el) => {
                    return parseInt(el.textContent?.replace(/[^0-9]/g, "") || "0")
                })

                scrapedItems.push({
                    ...searchResult,
                    title,
                    link: href,
                    price,
                })
            }

            console.log(scrapedItems)
        } else {
            logger.info(`Buyee scraper: found no items for ${term.query}`);
        }
        await page.close()
    }

}