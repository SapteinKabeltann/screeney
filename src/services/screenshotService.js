const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const cheerio = require('cheerio');
const sharp = require('sharp');
const { getUrlDomain, normalizeUrl, isValidUrl } = require('../utils/urlUtils');
const { ensureDirectoryExists } = require('../utils/fileSystem');
const WebSocket = require('ws');

let wss;

// Funksjon for å sette WebSocket server
function setWebSocketServer(wsServer) {
  wss = wsServer;
}

/**
 * Send WebSocket-melding til alle tilkoblede klienter
 * @param {Object} data - Data som skal sendes
 */
function broadcastMessage(data) {
  if (wss) {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }
}

/**
 * Behandle et enkelt endepunkt - ta screenshot og send oppdateringer
 */
async function processEndpoint(url, page, context, jobId, screenshotsDir, thumbnailsDir) {
  // Send melding om at vi starter med dette endepunktet
  broadcastMessage({
    type: 'newEndpoint',
    url: url,
    status: 'processing'
  });

  try {
    // Set viewport for consistent screenshots
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // Navigate to the URL
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 90000
    });
    
    // Get the page title
    const title = await page.title();
    
    // Take a screenshot
    const screenshotId = uuidv4();
    const hdPath = path.join(screenshotsDir, 'hd', `${screenshotId}.png`);
    const thumbnailPath = path.join(thumbnailsDir, `${screenshotId}.png`);
    
    await page.screenshot({ path: hdPath, fullPage: true });
    
    // Create a thumbnail with smaller size
    const thumbnailPage = await context.newPage();
    await thumbnailPage.setViewportSize({ width: 1280, height: 800 });
    await thumbnailPage.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Take a full page screenshot and then scale it down
    const fullPageBuffer = await thumbnailPage.screenshot({ 
      fullPage: true,
      type: 'jpeg'
    });

    // Use sharp to resize the image
    await sharp(fullPageBuffer)
      .resize(320, 240, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .jpeg({ quality: 60 })
      .toFile(thumbnailPath);

    await thumbnailPage.close();
    
    const screenshot = {
      id: screenshotId,
      title: title,
      url: url,
      hdPath: hdPath,
      thumbnailPath: thumbnailPath
    };

    // Send melding om at screenshotten er tatt
    broadcastMessage({
      type: 'screenshotTaken',
      url: url,
      title: title,
      id: screenshotId,
      status: 'completed',
      screenshot: {
        ...screenshot,
        thumbnailUrl: `/screenshots/${jobId}/thumbnails/${screenshotId}.png`,
        fullImageUrl: `/screenshots/${jobId}/hd/${screenshotId}.png`
      }
    });

    return {
      screenshot,
      html: await page.content()
    };
  } catch (error) {
    console.error(`Error processing ${url}:`, error);
    broadcastMessage({
      type: 'endpointError',
      url: url,
      error: error.message
    });
    return { error };
  }
}

/**
 * Capture screenshots of a website and its endpoints
 * @param {string} startUrl - The URL to start crawling from
 * @param {string} jobId - Unique identifier for the screenshot job
 * @param {number} pageLimit - Optional limit for number of pages to capture
 * @returns {Promise<Object>} - Object containing results of the screenshot process
 */
async function captureScreenshots(startUrl, jobId, pageLimit = null) {
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
    const hdDir = path.join(screenshotsDir, 'hd');
    const thumbnailsDir = path.join(screenshotsDir, 'thumbnails');
    
    ensureDirectoryExists(screenshotsDir);
    ensureDirectoryExists(hdDir);
    ensureDirectoryExists(thumbnailsDir);
    
    // Keep track of visited URLs to avoid duplicates
    const visitedUrls = new Set();
    const pendingUrls = [normalizedUrl];
    const screenshots = [];
    
    // Use pageLimit if provided, otherwise default to MAX_PAGES
    const maxPages = pageLimit || MAX_PAGES;
    
    // Process URLs in queue
    while (pendingUrls.length > 0 && visitedUrls.size < maxPages) {
      const currentUrl = pendingUrls.shift();
      
      if (visitedUrls.has(currentUrl) || !isValidUrl(currentUrl)) {
        continue;
      }
      
      visitedUrls.add(currentUrl);
      
      // Prosesser dette endepunktet fullstendig før vi går videre
      const result = await processEndpoint(
        currentUrl, 
        page, 
        context, 
        jobId, 
        screenshotsDir, 
        thumbnailsDir
      );
      
      if (result.error) {
        continue;
      }

      screenshots.push(result.screenshot);
      
      // If we've reached the page limit, stop crawling for more URLs
      if (screenshots.length >= maxPages) {
        break;
      }
      
      // Extract links to other pages on the same domain
      const $ = cheerio.load(result.html);
      
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
          console.warn(`Skipping invalid URL: ${href}`);
        }
      });
    }
    
    // Send complete message when all screenshots are taken
    broadcastMessage({
      type: 'complete',
      message: 'All screenshots captured',
      totalPages: screenshots.length,
      limitReached: screenshots.length >= maxPages
    });
    
    return {
      url: startUrl,
      domain,
      screenshots,
      totalPages: screenshots.length,
      limitReached: screenshots.length >= maxPages
    };
  } finally {
    await browser.close();
  }
}

module.exports = {
  captureScreenshots,
  setWebSocketServer
};