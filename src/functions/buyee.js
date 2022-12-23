import playwright from "playwright-firefox";
import { logger } from "../logger";

const BUYEE_URL = "https://buyee.jp/item/search/query/{{term}}/category/22260";

/**
 *
 * @param {import('playwright-core').Page} page
 * @param {string} searchTerm
 * @returns
 */
async function scrapeSearchTerm(page, searchTerm) {
	await page.goto(BUYEE_URL.replace('{{term}}', searchTerm));
	return await page.title();
}

/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export default async function handler(req, res) {
	const start = Date.now();

	try {
		const browser = await playwright.firefox.launch({
			headless: true,
			timeout: 60 * 1000 // 60 seconds, limit of Vercel functions
		});
		const page = await browser.newPage();

		logger.info(`Browser launched in ${Date.now() - start}ms`);

		const body = req.body;
		const titles = [];

		if (!body?.terms) {
			logger.info(`400 Buyee scraper - No terms provided`);
			return res.status(400).json({errorMessage: 'Missing terms'});
		}

		for (const term of body.terms) {
			const title = await scrapeSearchTerm(page, term.term);
			titles.push(title);

			logger.info(`Scraped ${term.term} in ${Date.now() - start}ms`);
		}

		await browser.close();

		logger.info(`Browser closed in ${Date.now() - start}ms`);

		res.status(200).json({ success: true, titles });
	} catch (err) {
    // @ts-ignore
    res.status(500).json({ statusCode: 500, message: err.message });
  }

	logger.info(`Total scrape time: ${Date.now() - start}ms`);
}
