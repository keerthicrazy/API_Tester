# API Tester Pro - Backend

## Overview

This is the backend package for API Tester Pro, providing a CORS wrapper server that allows frontend applications to make API calls without CORS issues.

## Features

- **CORS Wrapper Endpoint**: `POST /api/wrapper` - Handles all API requests with JSON payload
- **Health Check**: `GET /health` - Server health monitoring
- **Security**: URL validation, blocked hosts protection
- **Error Handling**: Comprehensive error handling and logging
- **Performance**: Optimized response times

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

## API Endpoints

### POST /api/wrapper

Main endpoint for handling API requests.

**Request Body:**
```json
{
  "url": "https://api.example.com/data",
  "method": "GET",
  "headers": {
    "Authorization": "Bearer token"
  },
  "body": {
    "key": "value"
  }
}
```

**Response:**
```json
{
  "success": true,
  "status": 200,
  "statusText": "OK",
  "headers": {},
  "data": {},
  "wrapperInfo": {
    "timestamp": "2025-08-05T12:00:00.000Z",
    "responseTime": 78,
    "targetUrl": "https://api.example.com/data",
    "method": "GET"
  }
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-08-05T12:00:00.000Z",
  "service": "CORS Wrapper Server",
  "version": "1.0.0",
  "environment": "production",
  "serverIP": "192.168.120.4"
}
```

## Configuration

The server configuration is in `config/config.js` and supports:

- Environment-based configuration (development/production)
- CORS settings
- Rate limiting
- Security headers

## Testing

Run the test suite:

```bash
# Test wrapper endpoint
node test-wrapper-endpoint.js

# Test HTTP methods
node test-proxy.js

# Test swagger import
node test-swagger-import.js

# Test frontend integration
node test-frontend-integration.js
```

## Environment Variables

- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 3001)

## Dependencies

- express: Web framework
- cors: CORS handling
- axios: HTTP client
- helmet: Security headers
- express-rate-limit: Rate limiting
- compression: Response compression