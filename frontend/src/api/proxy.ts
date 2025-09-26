// Backend Wrapper Integration for Collection Testing
// All API calls go through the backend wrapper server
import { getProxyServerUrl } from '@/config/proxy';

const BACKEND_WRAPPER = `${getProxyServerUrl()}/api/wrapper`;

export async function proxyApiCall(config: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
}) {
    try {
        console.log(`🚀 Collection API Request: ${config.method} ${config.url}`);

        // Use backend wrapper for all requests
        const wrapperUrl = BACKEND_WRAPPER;

        console.log(`🛡️ Using backend wrapper: ${wrapperUrl}`);

        const startTime = Date.now();

        // Prepare wrapper payload
        const wrapperPayload = {
            url: config.url,
            method: config.method,
            headers: config.headers,
            body: config.body ? JSON.parse(config.body) : undefined
        };

        const response = await fetch(wrapperUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(wrapperPayload),
        });

        const endTime = Date.now();

        if (!response.ok) {
            console.log(`⚠️ Backend wrapper failed: ${response.status} ${response.statusText}`);
            throw new Error(`Backend wrapper failed: ${response.status} ${response.statusText}`);
        }

        console.log(`✅ Backend wrapper successful! (${endTime - startTime}ms)`);

        const responseData = await response.json();

        // Handle backend wrapper response format
        if (responseData.success) {
            return {
                status: responseData.status,
                statusText: responseData.statusText,
                headers: responseData.headers || {},
                data: responseData.data,
            };
        } else {
            return {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                data: responseData,
            };
        }

    } catch (error) {
        console.log(`❌ Backend wrapper error: ${error instanceof Error ? error.message : 'Unknown error'}`);

        // Check if it's a CORS error
        if (error instanceof Error && error.message.includes('CORS')) {
            throw new Error(`CORS error: The request was blocked due to CORS policy. Please check if the target API allows cross-origin requests.`);
        }

        throw new Error(`Backend wrapper failed. Please ensure the wrapper server is running on ${getProxyServerUrl()}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
