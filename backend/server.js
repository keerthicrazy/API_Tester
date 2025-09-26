const express = require('express');
const cors = require('cors');
const axios = require('axios');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const https = require('https');
const config = require('./config/config');

const app = express();
const PORT = config.port;

// Security middleware
app.use(helmet());
app.use(compression());

// Dynamic CORS configuration
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Enhanced body parsing middleware with support for different content types
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for debugging
    req.rawBody = buf;
  }
}));

// Add support for URL-encoded form data
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for debugging
    req.rawBody = buf;
  }
}));

// Add support for raw body (for non-JSON content types)
app.use(express.raw({ 
  type: ['text/*', 'application/xml', 'application/x-www-form-urlencoded'],
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for debugging
    req.rawBody = buf;
  }
}));

// Handle JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Body parsing error:', err.message);
    console.error('Raw body:', req.rawBody ? req.rawBody.toString() : 'No raw body');
    console.error('Content-Type:', req.headers['content-type']);
    
    // Try to provide more helpful error messages
    let errorMessage = 'The request body could not be parsed';
    let suggestions = [];
    
    if (err.message.includes('Unexpected token')) {
      errorMessage = 'Invalid JSON format in request body';
      suggestions = [
        'Check for missing quotes around property names',
        'Ensure all strings are properly quoted',
        'Remove trailing commas',
        'Check for extra characters after JSON'
      ];
    } else if (err.message.includes('Unexpected end')) {
      errorMessage = 'Incomplete JSON in request body';
      suggestions = [
        'Check for missing closing braces or brackets',
        'Ensure the JSON is complete'
      ];
    } else if (err.message.includes('null')) {
      errorMessage = 'Invalid JSON: null value not properly formatted';
      suggestions = [
        'Use null instead of "null" for null values',
        'Check for extra quotes around null'
      ];
    }
    
    return res.status(400).json({
      success: false,
      error: 'Invalid request body',
      message: errorMessage,
      details: err.message,
      suggestions,
      receivedBody: req.rawBody ? req.rawBody.toString() : null,
      contentType: req.headers['content-type']
    });
  }
  next(err);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'CORS Wrapper Server',
    version: '1.0.0',
    environment: config.environment,
    serverIP: typeof config.current.serverIP === 'function' ? config.current.serverIP() : config.current.serverIP
  });
});

// API Wrapper endpoint for frontend proxy calls
app.post('/api/wrapper', async (req, res) => {
  const { url, method, headers, body } = req.body;

  // Validate required fields
  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: url',
      message: 'Please provide a target URL in the request body',
    });
  }

  if (!method) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: method',
      message: 'Please provide an HTTP method (GET, POST, PUT, DELETE, etc.)',
    });
  }

  // Validate URL format
  let targetUrl;
  try {
    targetUrl = new URL(url);
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid URL format',
      message: 'Please provide a valid URL',
      receivedUrl: url,
    });
  }

  // Block localhost and company IP based on environment
  const blockedHosts = ['127.0.0.1'];
  if (config.environment === 'development') {
    blockedHosts.push('localhost');
  } else {
    blockedHosts.push('10.106.246.81');
  }

  if (blockedHosts.includes(targetUrl.hostname)) {
    return res.status(400).json({
      success: false,
      error: 'Blocked hostname',
      message: `Cannot proxy requests to ${targetUrl.hostname} for security reasons`,
    });
  }

  console.log(`🌐 API Wrapper: ${method} request to: ${targetUrl.href}`);
  console.log(`📋 Request headers:`, headers);
  console.log(`📦 Request body:`, body);

  const httpsAgent = new https.Agent({ rejectUnauthorized: false });

  const axiosConfig = {
    method: method.toUpperCase(),
    url: targetUrl.href,
    httpsAgent,
    headers: {
      'User-Agent': 'API-Tester-Pro-Wrapper/1.0.0',
      'Accept': '*/*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache',
    },
    timeout: 60000,
    maxRedirects: 5,
    validateStatus: () => true,
  };

  // Add custom headers if provided
  if (headers && typeof headers === 'object') {
    Object.keys(headers).forEach((header) => {
      axiosConfig.headers[header] = headers[header];
    });
  }

  // Add request body for methods that support it
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase()) && body !== undefined) {
    axiosConfig.data = body;
  }

  try {
    const startTime = Date.now();
    const response = await axios(axiosConfig);
    const endTime = Date.now();

    console.log(
      `API Wrapper successful: ${response.status} ${response.statusText} (${endTime - startTime}ms) - Target URL: ${targetUrl.href}`
    );

    // Extract response headers
    const responseHeaders = {};
    Object.keys(response.headers).forEach((header) => {
      if (!['content-encoding', 'transfer-encoding', 'connection'].includes(header.toLowerCase())) {
        responseHeaders[header] = response.headers[header];
      }
    });

    // Return the full response
    res.json({
      success: true,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      data: response.data,
      wrapperInfo: {
        timestamp: new Date().toISOString(),
        responseTime: endTime - startTime,
        targetUrl: targetUrl.href,
        method: method.toUpperCase(),
      },
    });
  } catch (error) {
    console.error(`API Wrapper error: ${error.message} - Target URL: ${targetUrl.href}`);
    
    // Handle different types of errors
    let statusCode = 500;
    let errorMessage = error.message;
    
    if (error.code === 'ENOTFOUND') {
      statusCode = 404;
      errorMessage = 'Target URL not found';
    } else if (error.code === 'ECONNREFUSED') {
      statusCode = 503;
      errorMessage = 'Connection refused by target server';
    } else if (error.code === 'ETIMEDOUT') {
      statusCode = 504;
      errorMessage = 'Request timeout';
    } else if (error.response) {
      // Forward the actual response status from the target server
      statusCode = error.response.status;
      errorMessage = error.response.statusText || error.message;
    }

    res.status(statusCode).json({
      success: false,
      error: 'API Wrapper request failed',
      message: errorMessage,
      status: statusCode,
      timestamp: new Date().toISOString(),
      targetUrl: targetUrl.href,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: 'The requested endpoint does not exist',
    availableEndpoints: ['/health', '/api/wrapper'],
  });
});

// Start server
const messages = config.getConsoleMessages();
app.listen(PORT, '0.0.0.0', () => {
  const serverIP = typeof config.current.serverIP === 'function' ? config.current.serverIP() : config.current.serverIP;
  
  console.log(`${messages.serverRunning} ${PORT}`);
  console.log(`${messages.healthCheck}`);
  console.log(`${messages.wrapperEndpoint}`);
  console.log(`${messages.corsEnabled}`);
  console.log(`${messages.startedAt} ${new Date().toISOString()}`);
  console.log(`🌍 Environment: ${config.environment}`);
  console.log(`🏠 Server IP: ${serverIP}`);
});

module.exports = app; 