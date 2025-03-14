import axios from "axios";
import * as cheerio from "cheerio";
import { URL } from "url";

const seenUrls: Record<string, boolean> = {};
const urlsToVisit: string[] = [];
let targetHost: string = "";

// Improved URL normalization function
const normalizeUrl = (link: string, baseUrl: string): string => {
    try {
        // Handle relative URLs properly
        const url = new URL(link, baseUrl);
        return url.href;
    } catch (error) {
        console.error("Invalid URL:", link);
        return "";
    }
};

// Check if URL has the same host as our target
const hasSameHost = (url: string): boolean => {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.hostname === targetHost;
    } catch (error) {
        return false;
    }
};

const crawl = async (url: string) => {
    try {
        console.log('Crawling:', url);
        
        // Skip already visited URLs
        if (seenUrls[url]) {
            console.log('Already visited:', url);
            return;
        }
        
        seenUrls[url] = true;
        
        // Fetch the page
        const response = await axios.get(url);
        const html = response.data;
        
        // Parse HTML with cheerio
        const $ = cheerio.load(html);
        
        // Extract scripts with src attributes
        const scriptSources: string[] = [];
        $('script').each((i, element) => {
            const src = $(element).attr('src');
            if(!src?.includes('mediatradecraft.com')) return;
            if (src) {
                const normalizedSrc = normalizeUrl(src, url);
                if (normalizedSrc) {
                        scriptSources.push(normalizedSrc);
                }
            }
        });
        
        console.log("Script sources found:", scriptSources.length);
        if (scriptSources.length > 0) {
            console.log(scriptSources);
        }
        
        // Find all links and add them to the queue if they're on the same host
        $('a').each((i, element) => {
            const href = $(element).attr('href');
            if (href) {
                const normalizedHref = normalizeUrl(href, url);
                if (normalizedHref && hasSameHost(normalizedHref) && !seenUrls[normalizedHref]) {
                    urlsToVisit.push(normalizedHref);
                }
            }
        });
        
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`Network error crawling ${url}:`, error.message);
        } else {
            console.error(`Error crawling ${url}:`, error);
        }
    }
};

// Main crawling function that processes the entire queue
const crawlAllPages = async (startUrl: string) => {
    try {
        // Set the target host from the start URL
        const urlObj = new URL(startUrl);
        targetHost = urlObj.hostname;
        console.log(`Starting crawl on host: ${targetHost}`);
        
        // Add the start URL to the queue
        urlsToVisit.push(startUrl);
        
        // Process all URLs in the queue
        while (urlsToVisit.length > 0) {
            const nextUrl = urlsToVisit.shift();
            if (nextUrl) {
                await crawl(nextUrl);
                // Optional: Add a small delay to avoid overwhelming the server
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        console.log("Crawling complete! Total pages visited:", Object.keys(seenUrls).length);
    } catch (error) {
        console.error("Error in crawl process:", error);
    }
};

// Start the crawling process
(async () => {
    await crawlAllPages("https://bibleminute.co");
})();