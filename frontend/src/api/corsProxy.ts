// Backend CORS Proxy Integration
// All API requests go through the backend proxy server

import {getProxyBase, getProxySolutions} from '@/config/proxy';

const BACKEND_PROXY = getProxyBase();

/**
 * Unified API request function using backend wrapper
 */
export async function fetchWithCORS(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const {method = 'GET', headers = {}, body} = options;

    console.log(`🚀 API Request: ${method} ${url}`);

    // Use new wrapper endpoint
    const wrapperUrl = BACKEND_PROXY;

    console.log(`🛡️ Using backend wrapper: ${wrapperUrl}`);

    const startTime = Date.now();

    try {
        // Prepare wrapper payload
        const wrapperPayload = {
            url,
            method,
            headers,
            body: body ? JSON.parse(body as string) : undefined
        };

        const response = await fetch(wrapperUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(wrapperPayload),
        });

        const endTime = Date.now();

        if (response.ok) {
            console.log(`✅ Backend wrapper successful! (${endTime - startTime}ms)`);

            // Parse wrapper response
            const wrapperResponse = await response.json();

            if (wrapperResponse.success) {
                console.log(`📊 Response status: ${wrapperResponse.status} ${wrapperResponse.statusText}`);

                // Create a new Response object with the wrapper data
                const responseData = JSON.stringify(wrapperResponse.data);
                const newResponse = new Response(responseData, {
                    status: wrapperResponse.status,
                    statusText: wrapperResponse.statusText,
                    headers: new Headers(wrapperResponse.headers)
                });

                return newResponse;
            } else {
                console.log(`⚠️ Backend wrapper failed: ${wrapperResponse.error}`);
                throw new Error(wrapperResponse.message || wrapperResponse.error);
            }
        } else {
            console.log(`⚠️ Backend wrapper failed: ${response.status} ${response.statusText}`);
            throw new Error(`Backend wrapper failed: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        const endTime = Date.now();
        console.log(`❌ Backend wrapper error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.log(`⏱️ Request time: ${endTime - startTime}ms`);

        // Provide more specific error messages
        let errorMessage = 'Backend wrapper failed';
        let solutions = getProxySolutions();

        if (error instanceof Error) {
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                errorMessage = 'Cannot connect to wrapper server';
                solutions = [
                    'Start the wrapper server: cd backend && node server.js',
                    'Check if the server is running on port 3001',
                    'Verify no firewall is blocking the connection',
                    'Try restarting the wrapper server'
                ];
            } else if (error.message.includes('CORS')) {
                errorMessage = 'CORS error - wrapper server not responding';
                solutions = [
                    'Ensure the wrapper server is running and accessible',
                    'Check wrapper server logs for errors',
                    'Verify the wrapper server is configured correctly'
                ];
            }
        }

        throw new Error(`${errorMessage}. Please ensure the wrapper server is running. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Legacy CORSProxy class for backward compatibility
 */
export class CORSProxy {
    static async makeRequest(config: any): Promise<Response> {
        return fetchWithCORS(config.targetUrl, {
            method: config.method,
            headers: config.headers,
            body: config.body,
        });
    }

    static isLikelyCORSBlocked(url: string): boolean {
        // Always use backend wrapper, so this is always false
        return false;
    }

    static getCORSErrorMessage(url: string): string {
        return `Backend wrapper error for ${url}. Please ensure the wrapper server is running.`;
    }

    static getCORSSolutions(): string[] {
        return getProxySolutions();
    }
} 