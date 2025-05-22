const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const cheerio = require('cheerio');
const { getUrlDomain, normalizeUrl, isValidUrl } = require('../utils/urlUtils');
const { ensureDirectoryExists } = require('../utils/fileSystem');

/**
 * Capture screenshots of a website and its endpoints
 * @param {string} startUrl - The URL to start crawling from
 * @param {string} jobId - Unique identifier for the screenshot job
 * @returns {Promise<Object>} - Object containing results of the screenshot process
 */
async function captureScreenshots(startUrl, jobId) {
  const browser = await chromium.launch({
    headless: true
  });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const normalizedUrl = normalizeUrl(startUrl);
    const domain = getUrlDomain(normalizedUrl);
    const baseUrl = new URL(normalizedUrl).origin;
    
    // Create directories for screenshots
    const screenshotsDir = path.join('public', 'screenshots', jobId);
    const thumbnailsDir = path.join(screenshotsDir, 'thumbnails');
    
    ensureDirectoryExists(screenshotsDir);
    ensureDirectoryExists(thumbnailsDir);
    
    // Keep track of visited URLs to avoid duplicates
    const visitedUrls = new Set();
    const pendingUrls = [normalizedUrl];
    const screenshots = [];
    
    // Limit the number of pages to crawl to avoid excessive processing
    const MAX_PAGES = 10;
    let pageCount = 0;
    
    // Process URLs in queue
    while (pendingUrls.length > 0 && pageCount < MAX_PAGES) {
      const currentUrl = pendingUrls.shift();
      
      if (visitedUrls.has(currentUrl) || !isValidUrl(currentUrl)) {
        continue;
      }
      
      visitedUrls.add(currentUrl);
      pageCount++;
      
      try {
        // Set viewport for consistent screenshots
        await page.setViewportSize({ width: 1280, height: 800 });
        
        // Navigate to the URL
        await page.goto(currentUrl, { 
          waitUntil: 'networkidle',
          timeout: 90000
        });
        
        // Get the page title
        const title = await page.title();
        
        // Take a screenshot
        const screenshotId = uuidv4();
        const screenshotPath = path.join(screenshotsDir, `${screenshotId}.png`);
        const thumbnailPath = path.join(thumbnailsDir, `${screenshotId}.png`);
        
        await page.screenshot({ path: screenshotPath, fullPage: true });
        
        // Create a thumbnail
        const thumbnailPage = await context.newPage();
        await thumbnailPage.setViewportSize({ width: 1280, height: 800 });
        await thumbnailPage.goto(currentUrl, { waitUntil: 'networkidle', timeout: 30000 });
        await thumbnailPage.screenshot({ path: thumbnailPath });
        await thumbnailPage.close();
        
        // Add to results
        screenshots.push({
          id: screenshotId,
          title: title,
          url: currentUrl,
          path: screenshotPath,
          thumbnailPath: thumbnailPath
        });
        
        // Extract links to other pages on the same domain
        const html = await page.content();
        const $ = cheerio.load(html);
        
        $('a').each((_, element) => {
          const href = $(element).attr('href');
          if (!href) return;
          
          try {
            let resolvedUrl;
            
            // Handle relative URLs
            if (href.startsWith('/')) {
              resolvedUrl = `${baseUrl}${href}`;
            } else if (href.startsWith('http')) {
              resolvedUrl = href;
            } else if (!href.startsWith('#') && !href.startsWith('javascript:') && !href.startsWith('mailto:')) {
              resolvedUrl = new URL(href, currentUrl).href;
            } else {
              return;
            }
            
            // Only add URLs from the same domain that we haven't visited yet
            if (getUrlDomain(resolvedUrl) === domain && 
                !visitedUrls.has(resolvedUrl) && 
                !pendingUrls.includes(resolvedUrl)) {
              pendingUrls.push(resolvedUrl);
            }
          } catch (error) {
            // Skip invalid URLs
            console.warn(`Skipping invalid URL: ${href}`);
          }
        });
      } catch (error) {
        if (error.name === 'TimeoutError') {
          console.warn(`Timeout error for ${currentUrl}, skipping to next URL.`);
          continue;
        }
        console.error(`Error processing ${currentUrl}:`, error);
      }
    }
    
    return {
      url: startUrl,
      domain,
      screenshots
    };
  } finally {
    await browser.close();
  }
}

module.exports = {
  captureScreenshots
};