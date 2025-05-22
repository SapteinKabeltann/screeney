const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const JSZip = require('jszip');
const sanitize = require('sanitize-filename');
const { captureScreenshots } = require('../services/screenshotService');
const { getUrlDomain } = require('../utils/urlUtils');

// Store job status in memory (in a real app, use a database)
const jobs = new Map();

const screenshotController = {
  /**
   * Initiate the screenshot capture process
   */
  captureScreenshots: async (req, res) => {
    try {
      const { url } = req.body;
      const jobId = uuidv4();
      const domain = getUrlDomain(url);
      
      // Create a new job and store its status
      jobs.set(jobId, {
        status: 'processing',
        url,
        domain,
        startTime: new Date(),
        screenshots: [],
        error: null
      });
      
      // Send immediate response to client
      res.status(202).json({ 
        jobId, 
        message: 'Screenshot capture initiated',
        status: 'processing'
      });
      
      // Start the capture process asynchronously
      captureScreenshots(url, jobId)
        .then(results => {
          const job = jobs.get(jobId);
          job.status = 'completed';
          job.screenshots = results.screenshots;
          job.endTime = new Date();
          jobs.set(jobId, job);
        })
        .catch(error => {
          const job = jobs.get(jobId);
          job.status = 'failed';
          job.error = error.message;
          job.endTime = new Date();
          jobs.set(jobId, job);
          console.error(`Job ${jobId} failed:`, error);
        });
    } catch (error) {
      res.status(500).json({ error: 'Failed to initiate screenshot capture' });
    }
  },
  
  /**
   * Get the status of a screenshot job
   */
  getJobStatus: (req, res) => {
    const { jobId } = req.params;
    
    if (!jobs.has(jobId)) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const job = jobs.get(jobId);
    res.json({
      jobId,
      status: job.status,
      url: job.url,
      domain: job.domain,
      screenshotsCount: job.screenshots.length,
      startTime: job.startTime,
      endTime: job.endTime || null,
      error: job.error
    });
  },
  
  /**
   * Get all screenshots for a job
   */
  getScreenshots: (req, res) => {
    const { jobId } = req.params;
    
    if (!jobs.has(jobId)) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const job = jobs.get(jobId);
    
    if (job.status !== 'completed') {
      return res.json({
        status: job.status,
        screenshots: []
      });
    }
    
    res.json({
      status: job.status,
      url: job.url,
      domain: job.domain,
      screenshots: job.screenshots.map(screenshot => ({
        id: screenshot.id,
        title: screenshot.title,
        path: screenshot.path,
        url: screenshot.url,
        thumbnailUrl: `/screenshots/${jobId}/thumbnails/${path.basename(screenshot.path)}`
      }))
    });
  },
  
  /**
   * Download all screenshots as a ZIP file
   */
  downloadScreenshots: async (req, res) => {
    try {
      const { jobId } = req.params;
      
      if (!jobs.has(jobId)) {
        return res.status(404).json({ error: 'Job not found' });
      }
      
      const job = jobs.get(jobId);
      
      if (job.status !== 'completed') {
        return res.status(400).json({ error: 'Screenshots are not ready yet' });
      }
      
      const zip = new JSZip();
      
      // Add each screenshot to the ZIP
      for (const screenshot of job.screenshots) {
        const imageData = fs.readFileSync(path.join(__dirname, '../../', screenshot.path));
        const filename = sanitize(`${screenshot.title || 'screenshot'}-${screenshot.id}.png`);
        zip.file(filename, imageData);
      }
      
      // Generate the ZIP file
      const zipData = await zip.generateAsync({ type: 'nodebuffer' });
      
      // Set headers for download
      res.setHeader('Content-Disposition', `attachment; filename=${sanitize(job.domain)}-screenshots.zip`);
      res.setHeader('Content-Type', 'application/zip');
      
      // Send the ZIP file
      res.send(zipData);
    } catch (error) {
      console.error('Error generating ZIP file:', error);
      res.status(500).json({ error: 'Failed to generate ZIP file' });
    }
  },
  
  /**
   * Download a single screenshot
   */
  downloadSingleScreenshot: (req, res) => {
    try {
      const { jobId, filename } = req.params;
      
      if (!jobs.has(jobId)) {
        return res.status(404).json({ error: 'Job not found' });
      }
      
      const job = jobs.get(jobId);
      
      if (job.status !== 'completed') {
        return res.status(400).json({ error: 'Screenshots are not ready yet' });
      }
      
      const screenshot = job.screenshots.find(s => path.basename(s.path) === filename);
      
      if (!screenshot) {
        return res.status(404).json({ error: 'Screenshot not found' });
      }
      
      const filePath = path.join(__dirname, '../../', screenshot.path);
      
      // Set headers for download
      res.setHeader('Content-Disposition', `attachment; filename=${sanitize(screenshot.title || 'screenshot')}.png`);
      res.setHeader('Content-Type', 'image/png');
      
      // Send the file
      res.sendFile(filePath);
    } catch (error) {
      console.error('Error downloading screenshot:', error);
      res.status(500).json({ error: 'Failed to download screenshot' });
    }
  }
};

module.exports = { screenshotController };