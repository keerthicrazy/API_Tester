// Environment-aware proxy configuration for frontend

// Extend Window interface for custom properties
declare global {
    interface Window {
        PROXY_PORT?: string;
    }
}

// Get the current hostname and port from the browser
const getCurrentHost = () => {
    const hostname = window.location.hostname;
    const port = window.location.port;
    return {hostname, port};
};

// Determine if we're in development or production
const isDevelopment = () => {
    // Prefer ENV_MODE when provided
    const envMode = (import.meta as any).env?.ENV_MODE || (window as any).ENV_MODE;
    if (envMode) return envMode === 'development';
    const {hostname} = getCurrentHost();
    return hostname === 'localhost' || hostname === '127.0.0.1';
};

// Get the proxy server hostname (same as current hostname for production)
const getProxyHostname = () => {
    // Use env when available; fallback to current hostname/local
    const envAny = (import.meta as any).env || {};
    const envHost = envAny.VITE_BACKEND_IP || envAny.BACKEND_IP || (window as any).BACKEND_IP;
    if (envHost) return envHost;
    const {hostname} = getCurrentHost();
    return isDevelopment() ? 'localhost' : hostname;
};

// Get the proxy server port (configurable via environment variable)
const getProxyPort = () => {
    // Prefer env variables (Vite exposes only VITE_*)
    const envAny = (import.meta as any).env || {};
    const envPort = envAny.VITE_BACKEND_PORT || envAny.BACKEND_PORT || (window as any).BACKEND_PORT || (window as any).PROXY_PORT;
    if (envPort) return String(envPort);
    return '3001';
};

export const getProxyBase = () => {
    const hostname = getProxyHostname();
    const port = getProxyPort();
    return `http://${hostname}:${port}/api/wrapper`;
};

export const getProxyHealthUrl = () => {
    const hostname = getProxyHostname();
    const port = getProxyPort();
    return `http://${hostname}:${port}/health`;
};

export const getProxyServerUrl = () => {
    const hostname = getProxyHostname();
    const port = getProxyPort();
    return `http://${hostname}:${port}`;
};

export const getProxySolutions = () => {
    const serverUrl = getProxyServerUrl();
    return [
        `Ensure the proxy server is running: cd backend && node server.js`,
        `Check if the proxy server is accessible at ${serverUrl}/health`,
        `Verify the proxy server is running on port ${getProxyPort()}`,
        `Check network connectivity to ${serverUrl}`,
        `Restart the backend proxy server if needed`
    ];
};

// Export environment info for debugging
export const getEnvironmentInfo = () => {
    const {hostname, port} = getCurrentHost();
    return {
        isDevelopment: isDevelopment(),
        currentHostname: hostname,
        currentPort: port,
        proxyHostname: getProxyHostname(),
        proxyPort: getProxyPort(),
        proxyUrl: getProxyServerUrl()
    };
}; 