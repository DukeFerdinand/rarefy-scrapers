import {parentPort} from 'worker_threads'
import * as cheerio from 'cheerio'

import {logger} from "../logger";
import {BuyeeJob} from "../queue";
import {CrawlerJob} from "../functions/createCrawlerJobs";
import {getS3Client} from "../db/s3";

const SEARCH_URL = "https://buyee.jp/item/search/query/{{term}}"

const defaultHeaders = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0"
}

export interface BuyeeSearchResult {
    title: string;
    currentPrice: string;
    startingPrice: string;
    startDate: Date;
    endDate: Date;
    updatedAt: Date;
    url: string;
    bids: number;
    images: string[]
}

export interface BuyeeItemDetails {
    Quantity: string;
    // This has a TON of white space for some reason...
    "Opening Price": string;
    "Number of Bids": string;
    "Opening Time　(JST)": string;
    "Closing Time　(JST)": string;
    "Current Time　(JST)": string;
    "Auction ID": string;
    "Item Condition": string;
    "Shipping Paid By": string;

    // the below are weirdly formatted, I'm ignoring them for now

    // Early FinishIf this is set as "Yes", the seller can terminate the auction earlier than the ending time.The winner will be the highest bidder at the point of the auction is terminated.: string;
    // Automatic ExtensionIf this is set as "Yes" and when there is higher bid placed within the 5 minutes  of the ending time, the originally set ending time will be extended 5 minutes.It'll be continuously extended everytime the highest bid is renewed.: string;
    // Bidder Rating RestrictionIf this is set as "Yes", the seller sets the restrictions (based on the bidder's review score) of the bidders who can/cannot place bids.: string;
}

const formatBuyeeUrl = (term: BuyeeJob['terms'][number]) => {
    let url = SEARCH_URL.replace("{{term}}", term.query)

    // Add any url modifiers here
    if (term.vinylOnly) {
        url += "/category/22260"
    }

    // this is to avoid making them mad at us scraping their site :)
    // BUYEE JUST GIVE ME AN API! :(
    url += "?translationType=1&suggest=1"

    return url
}

export const scrapeBuyee = async (term: CrawlerJob['query']): Promise<BuyeeSearchResult[]> => {
    parentPort?.postMessage(`scraping ${term.query}`)
    const searchResultsPage = formatBuyeeUrl(term)

    // Get the HTML of the search results page
    // ===================================================
    const html = await fetch(searchResultsPage, {
        headers: defaultHeaders
    })

    // Load it into cheerio
    // ===================================================
    const $ = cheerio.load(await html.text())
    // Get the cards
    const items = $(".itemCard")

    // Missing cards means error or no results, TODO: handle no results vs error
    // ===================================================
    if (items.length === 0) {
        parentPort?.postMessage(`no results for ${term.query}`)
        return []
    }

    parentPort?.postMessage(`found ${items.length} results for term ${term.query}`);

    // Loop through the cards, making a request for each
    // one to get the details from the auction page HTML
    // ===================================================
    const results: BuyeeSearchResult[] = []
    for (const item of items.toArray()) {
        const $item = $(item)

        // Basic info from the card
        // ===================================================
        const anchorTitle = $item.find(".itemCard__itemName a")
        // This will be used to gather further details
        const auctionPage = anchorTitle.attr('href')
        const title = anchorTitle.text().trim()
        const currentPrice = $item.find(".g-price__outer span.g-price").text().trim()

        // Get the auction page HTML
        // ===================================================
        logger.info(`Visiting -> ${auctionPage}`)
        const fullUrl = `https://buyee.jp${auctionPage}`;
        const itemPage = await fetch(`https://buyee.jp${auctionPage}`, {
            headers: defaultHeaders
        });

        // Load it into cheerio
        // ===================================================
        const $itemPage = cheerio.load(await itemPage.text())
        const $itemDetailWrapper = $itemPage("#itemDetail_data").first()
        const $itemDetails = $itemDetailWrapper.find("li")

        // Loop through the details and build an object
        // ===================================================
        const itemDetails = {} as BuyeeItemDetails
        $itemDetails.each((i, el) => {
            const $el = $(el)
            const label = $el.find('em').text().trim() as keyof BuyeeItemDetails
            const value = $el.find('span').text()?.trim()

            if (label && value) {
                itemDetails[label] = value
            } else {
                logger.warn(`Buyee scraper: found label without value: ${label}`)
            }
        })

        // Rip all the image urls from the page
        // ===================================================
        const images: string[] = []
        $itemPage("ul.slides").children("li").each((i, el) => {
            images.push($(el).attr('data-thumb') || '')
        })


        // Get image data and upload to S3
        // ===================================================
        // We may push more images later, but for now it's easier to process one
        const firstImageUrl = images[0]
        const fileName = firstImageUrl.split('/users/')[1].split('/')[1]

        const imageData = await fetch(firstImageUrl, {
            headers: defaultHeaders
        }).then(res => res.arrayBuffer())

        const s3Client = getS3Client()
        await s3Client.putObject({
            Bucket: 'rarefy-cdn',
            Body: Buffer.from(imageData),
            Key: fileName,
            ACL: 'public-read'
        })

        const imageUrl = `https://rarefy-cdn.us-east-1.linodeobjects.com/${fileName}`

        // Use details from loop to build proper return
        // ===================================================
        const result: BuyeeSearchResult = {
            title,
            currentPrice,
            startingPrice: itemDetails["Opening Price"].split('  ')[0],
            startDate: new Date(itemDetails["Opening Time　(JST)"]),
            endDate: new Date(itemDetails["Closing Time　(JST)"]),
            updatedAt: new Date(itemDetails["Current Time　(JST)"]),
            url: fullUrl,
            bids: Number(itemDetails["Number of Bids"]),
            images: [imageUrl]
        }

        results.push(result)
    }

    logger.info(`Finished Scraping -> ${term.query}`)

    return results
}
