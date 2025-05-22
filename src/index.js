const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { setupRoutes } = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const { createFolders } = require('./utils/fileSystem');
const WebSocket = require('ws');
const { setWebSocketServer } = require('./services/screenshotService');

// Create necessary folders for the application
createFolders();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Middleware
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

// Setup routes
setupRoutes(app);

// Error handling
app.use(errorHandler);

// Create WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Koble WebSocket til screenshotService
setWebSocketServer(wss);

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('WebSocket connection established');

  // Send status updates to client
  ws.on('message', (message) => {
    console.log('received: %s', message);
  });
});

// Upgrade HTTP server to handle WebSocket connections
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

module.exports = app;