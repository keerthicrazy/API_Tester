import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { BDDCodeGenerator } from '@/components/BDDCodeGenerator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileCode, Zap } from 'lucide-react';
import { Endpoint as BddEndpoint } from '@/utils/bddCodeGenerator';
import { RequestPanel } from '@/components/RequestPanel';
import { ResponsePanel } from '@/components/ResponsePanel';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { isFeatureEnabled } from '@/config';
import { fetchWithCORS } from '@/api/corsProxy';
import { getProxySolutions } from '@/config/proxy';

const QuickTesting = () => {
  const [endpoints, setEndpoints] = useState<BddEndpoint[]>([]);

  // State replicated from Index manual mode
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [validationRules, setValidationRules] = useState<any[]>([]);
  const [requestConfig, setRequestConfig] = useState<any>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<any>(null);

  const handleRequest = async (requestData: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
  }) => {
    setLoading(true);
    setRequestConfig(requestData);
    try {
      const fetchOptions: RequestInit = {
        method: requestData.method,
        headers: {
          'Content-Type': 'application/json',
          ...requestData.headers,
        },
      };

      if (requestData.body && ['POST', 'PUT', 'PATCH'].includes(requestData.method)) {
        fetchOptions.body = requestData.body;
      }

      let response;
      try {
        response = await fetchWithCORS(requestData.url, fetchOptions);
      } catch (error) {
        setResponse({
          status: 0,
          statusText: 'Backend Proxy Error',
          headers: {},
          data: {
            error: `Backend proxy failed for ${requestData.url}`,
            solutions: getProxySolutions(),
            originalError: error instanceof Error ? error.message : 'Unknown error'
          },
          responseTime: Date.now(),
        });
        setLoading(false);
        return;
      }

      const responseData = await response.text();

      let parsedData;
      try {
        parsedData = JSON.parse(responseData);
      } catch {
        parsedData = responseData;
      }

      const apiResponse = {
        status: parsedData.success ? parsedData.status : response.status,
        statusText: parsedData.success ? parsedData.statusText : response.statusText,
        headers: parsedData.success ? parsedData.headers : Object.fromEntries(response.headers.entries()),
        data: parsedData.success ? parsedData.data : parsedData,
        responseTime: parsedData.success ? parsedData.responseTime : Date.now(),
      };

      setResponse(apiResponse);
      setExecutionResult({
        status: apiResponse.status >= 200 && apiResponse.status < 300 ? 'success' : 'failed',
        response: apiResponse,
      });

      // Build BDD endpoint for generator
      try {
        const urlObj = new URL(requestData.url);
        const path = urlObj.pathname || requestData.url;
        const nameFromPath = path.split('/').filter(Boolean).slice(-1)[0] || 'endpoint';
        const requiresBody = ['POST', 'PUT', 'PATCH'].includes(requestData.method.toUpperCase());
        const requestBody = requiresBody && requestData.body ? (() => { try { return JSON.parse(requestData.body!); } catch { return requestData.body; } })() : undefined;

        const bddEndpoint: BddEndpoint = {
          method: requestData.method.toUpperCase(),
          path,
          name: nameFromPath,
          description: `${requestData.method.toUpperCase()} ${path}`,
          requestBody,
          responseBody: apiResponse.data,
          url: requestData.url,
          headers: requestData.headers || {},
          actualResponse: {
            status: apiResponse.status,
            data: apiResponse.data,
            headers: apiResponse.headers,
            responseTime: apiResponse.responseTime,
          },
          validationRules: [],
        };
        setEndpoints([bddEndpoint]);
      } catch {
        // Fallback: minimal endpoint if URL parsing fails
        setEndpoints([{
          method: requestData.method.toUpperCase(),
          path: requestData.url,
          name: 'endpoint',
          description: `${requestData.method.toUpperCase()} ${requestData.url}`,
          responseBody: apiResponse.data,
          url: requestData.url,
          headers: requestData.headers || {},
          actualResponse: {
            status: apiResponse.status,
            data: apiResponse.data,
            headers: apiResponse.headers,
            responseTime: apiResponse.responseTime,
          },
          validationRules: [],
        } as BddEndpoint]);
      }
    } catch (error) {
      setResponse({
        status: 500,
        statusText: 'Request Failed',
        headers: {},
        data: { error: error instanceof Error ? error.message : 'Unknown error' },
        responseTime: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      <Header />
      
      {/* Hero Section */}
      <div className="border-b bg-white/90 backdrop-blur-sm shadow-sm dark:bg-slate-800/90 dark:border-slate-700">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Quick API Testing</h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">Test Single APIs & Generate BDD Code</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 gap-6">
          {/* Single API Testing Interface */}
          <div id="testing-interface" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Quick API Testing</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Configure your API request manually and test it
              </p>
              <RequestPanel
                onApiCall={handleRequest}
                loading={loading}
                selectedEndpoint={selectedEndpoint}
              />
            </Card>
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Response</h2>
                <ErrorBoundary>
                  <ResponsePanel
                    response={response}
                    loading={loading}
                    requestConfig={requestConfig}
                    validationRules={validationRules}
                    onValidationRulesChange={setValidationRules}
                    showResponse={true}
                    showValidation={true}
                    showCodeGen={isFeatureEnabled('testCodeGeneration')}
                    executionResult={executionResult}
                  />
                </ErrorBoundary>
              </Card>
            </div>
          </div>

          {/* BDD Code Generator - Only show after API request
          {response && (
            <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <FileCode className="w-6 h-6 mr-2 text-green-600 dark:text-green-400" />
                    BDD Code Generation
                  </span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700">
                    Gherkin + Java
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BDDCodeGenerator endpoints={endpoints} />
              </CardContent>
            </Card>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default QuickTesting;
