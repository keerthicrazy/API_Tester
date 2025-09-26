// Configuration for the CORS Proxy Server
const config = {
  // Environment: 'development' or 'production'
  environment: process.env.ENV_MODE || process.env.NODE_ENV || 'production',
  
  // Server configuration
  port: Number(process.env.BACKEND_PORT) || Number(process.env.PORT) || 3001,
  
  // Environment-driven network configuration (no hardcoded IPs)
  development: {
    serverIP: process.env.BACKEND_IP || 'localhost',
    allowedOrigins: ['*'],
    consoleMessages: {
      serverRunning: '🚀 CORS Wrapper Server running on port',
      healthCheck: '📡 Health check: http://',
      wrapperEndpoint: '🔗 Wrapper endpoint: http://',
      corsEnabled: '🌐 CORS enabled for dynamic origins',
      startedAt: '⏰ Started at:'
    }
  },
  
  production: {
    serverIP: process.env.BACKEND_IP || '0.0.0.0',
    allowedOrigins: ['*'], // Allow all origins in production
    consoleMessages: {
      serverRunning: '🚀 CORS Wrapper Server running on port',
      healthCheck: '📡 Health check: http://',
      wrapperEndpoint: '🔗 Wrapper endpoint: http://',
      corsEnabled: '🌐 CORS enabled for dynamic origins',
      startedAt: '⏰ Started at:'
    }
  },
  
  // Get current configuration based on environment
  get current() {
    return this[this.environment] || this.development;
  },
  
  // Helper function to get server URL
  getServerURL(path = '') {
    const serverIP = this.current.serverIP;
    const base = `http://${serverIP}:${this.port}`;
    return path ? `${base}${path}` : base;
  },
  
  // Helper function to get console messages
  getConsoleMessages() {
    const messages = this.current.consoleMessages;
    const serverIP = this.current.serverIP;
    
    // Replace placeholders with actual values
    return {
      serverRunning: messages.serverRunning,
      healthCheck: `${messages.healthCheck}${this.current.serverIP}:${this.port}/health`,
      wrapperEndpoint: `${messages.wrapperEndpoint}${this.current.serverIP}:${this.port}/api/wrapper`,
      corsEnabled: messages.corsEnabled,
      startedAt: messages.startedAt
    };
  }
};

module.exports = config; 