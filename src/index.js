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

// Create necessary folders for the application
createFolders();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "blob:"],
      "script-src": ["'self'", "'unsafe-inline'"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', limiter);

// Middleware
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, '../public')));

// Setup routes
setupRoutes(app);

// Error handling middleware (should be after routes)
app.use(errorHandler);

// Create WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('WebSocket connection established');

  // Send status updates to client
  ws.on('message', (message) => {
    console.log('received: %s', message);
  });

  // Example: Send a message to the client
  ws.send(JSON.stringify({ status: 'connected' }));
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