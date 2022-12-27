import {parentPort} from 'worker_threads'
import * as cheerio from 'cheerio'

import {logger} from "../logger";
import {BuyeeJob} from "../queue";
import {CrawlerJob} from "../functions/createCrawlerJobs";

const SEARCH_URL = "https://buyee.jp/item/search/query/{{term}}"

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
export interface BuyeeItemDetails {
    Quantity: string;
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

function buyeeDataToSearchResult(data: BuyeeItemDetails): void {
    // console.log(data)
    // return {
    //     title: data.title,
    //     price: data.price,
    //     currency: Currency.JPY,
    //     link: data.link,
    //     seller: data.seller,
    //     timeRemaining: data.timeRemaining,
    //     bids: data.bids,
    // }
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

export const scrapeBuyee = async (term: CrawlerJob['query']) => {
    parentPort?.postMessage(`scraping ${term.query}`)
    const searchResultsPage = formatBuyeeUrl(term)

    // Get the HTML of the search results page
    // ===================================================
    const html = await fetch(searchResultsPage, {
        headers: {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0"
        }
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
        return
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
        const auctionPage = anchorTitle.attr('href')
        const title = anchorTitle.text()

        // Get the auction page HTML
        // ===================================================
        const itemPage = await fetch(`https://buyee.jp${auctionPage}`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0"
            }
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

        // Rip all of the image urls from the page
        // ===================================================
        const images: string[] = []
        $itemPage("ul.slides").children("li").each((i, el) => {
            images.push($(el).attr('data-thumb') || '')
        })

        buyeeDataToSearchResult(itemDetails)

        // TODO: Save the scraped data to db before sending to queue
        // await processJobCreator.createJob({
        //     jobType: JobType.FILE_PROCESS,
        //     files: images,
        //     dbID: term.dbID,
        // })

        // TODO: Store images in S3 and return the S3 urls instead to avoid being blocked by buyee

        // const data = {
        //     title,
        //     auctionPage,
        //     itemDetails,
        //     images
        // }

        console.log("TODO: save to db")
    }
}
