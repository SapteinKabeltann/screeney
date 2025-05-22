const express = require('express');
const path = require('path');
const { screenshotController } = require('./controllers/screenshotController');
const { validateUrl } = require('./middleware/validators');

/**
 * Setup all application routes
 * @param {express.Application} app - Express application
 */
function setupRoutes(app) {
  // API Routes
  const apiRouter = express.Router();
  
  // Screenshot routes
  apiRouter.post('/capture', validateUrl, screenshotController.captureScreenshots);
  apiRouter.get('/status/:jobId', screenshotController.getJobStatus);
  apiRouter.get('/screenshots/:jobId', screenshotController.getScreenshots);
  apiRouter.get('/download/:jobId', screenshotController.downloadScreenshots);
  apiRouter.get('/download/:jobId/:filename', screenshotController.downloadSingleScreenshot);
  
  // Register API routes
  app.use('/api', apiRouter);
  
  // Frontend routes
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });
  
  // Catch-all route for non-existent routes
  app.use('*', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, '../public/404.html'));
  });
}

module.exports = { setupRoutes };