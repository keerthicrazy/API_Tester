
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Clock, Globe, CheckCircle, AlertCircle, Copy, ExternalLink, GitBranch } from 'lucide-react';
import { ResponseValidation } from './ResponseValidation';
import { useToast } from '@/hooks/use-toast';
import { BDDCodeGenerator } from './BDDCodeGenerator';
import { ValidationRule } from '@/types/validation';
import { JiraIntegration } from './JiraIntegration';
import { BitbucketIntegration } from './BitbucketIntegration';
import { isFeatureEnabled } from '@/config';
import { CORSErrorDisplay } from './CORSErrorDisplay';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ComingSoon } from '@/components/ui/coming-soon';

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  responseTime: number;
  success?: boolean; // For wrapper responses
}

interface ResponsePanelProps {
  response: ApiResponse | null;
  loading: boolean;
  requestConfig?: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
  } | null;
  validationRules?: ValidationRule[];
  onValidationRulesChange?: (rules: ValidationRule[]) => void;
  showResponse?: boolean;
  showValidation?: boolean;
  showCodeGen?: boolean;
  executionResult?: any;
}

export const ResponsePanel: React.FC<ResponsePanelProps> = ({ 
  response, 
  loading, 
  requestConfig = null,
  validationRules = [],
  onValidationRulesChange,
  showResponse = true,
  showValidation = true,
  showCodeGen = true,
  executionResult
}) => {
  const { toast } = useToast();

  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };



  const validateResponseData = (response: any): boolean => {
    if (response && typeof response === 'object') {
      // If it's a wrapper response (has success, status, data properties)
      if (response.success !== undefined && response.data !== undefined) {
        return true;
      }
      
      // If it's a direct API response (has status, data properties)
      if (response.status !== undefined && response.data !== undefined) {
        return true;
      }
    }
    
    return false;
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        toast({
          title: "Copied to clipboard",
          description: `${type} copied successfully`,
        });
        return;
      }
      
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          toast({
            title: "Copied to clipboard",
            description: `${type} copied successfully`,
          });
        } else {
          throw new Error('execCommand failed');
        }
      } catch (err) {
        throw new Error('Copy failed');
      } finally {
        document.body.removeChild(textArea);
      }
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please copy manually or check browser permissions",
        variant: "destructive",
      });
    }
  };

  const copyResponseBody = () => {
    if (response) {
      let responseData;
      
      // Handle both wrapper and direct response structures
      if (response.success !== undefined && response.data !== undefined) {
        // Wrapper response structure
        responseData = response.data;
      } else if (response.data !== undefined) {
        // Direct API response structure
        responseData = response.data;
      } else {
        // Fallback to entire response object
        responseData = response;
      }
      
      if (responseData) {
        const responseText = formatJson(responseData);
        copyToClipboard(responseText, "Response body");
      } else {
        toast({
          title: "No response data",
          description: "Cannot copy response body due to CORS restrictions or network errors",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "No response data",
        description: "Cannot copy response body due to CORS restrictions or network errors",
        variant: "destructive",
      });
    }
  };

  const copyHeaders = () => {
    if (response && response.headers && typeof response.headers === 'object' && Object.keys(response.headers).length > 0) {
      const headersText = Object.entries(response.headers)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      copyToClipboard(headersText, "Response headers");
    } else {
      toast({
        title: "No headers available",
        description: "Cannot copy headers due to CORS restrictions or network errors",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sending Request</h3>
          <p className="text-gray-500">Please wait while we process your API call...</p>
        </div>
      </div>
    );
  }

  if (!response && showResponse) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Test APIs</h3>
          <p className="text-gray-500 mb-6">Configure your request in the left panel and click "Call Request" to see the response here.</p>
          <div className="space-y-2 text-sm text-gray-400">
            <p>• Import from Postman/OpenAPI</p>
            <p>• Add validation rules</p>
            <p>• Generate test code</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Integration buttons - show after successful execution, positioned at the top */}
      {executionResult && executionResult.status === 'success' && requestConfig && (
        <div className="flex gap-4 p-6 pb-0">
          {isFeatureEnabled('jiraIntegration') && (
            <JiraIntegration 
              results={[executionResult]}
              collectionName="Quick Test"
            />
          )}
          {isFeatureEnabled('bitbucketIntegration') && (
            <BitbucketIntegration 
              endpoints={[{
                id: '1',
                name: `${requestConfig.method} ${requestConfig.url}`,
                method: requestConfig.method,
                url: requestConfig.url,
                headers: requestConfig.headers,
                body: requestConfig.body
              }]} 
              collectionName="Quick Test"
            />
          )}
        </div>
      )}

      {/* Response Content */}
      {showResponse && response && validateResponseData(response) ? (
        <div className="flex-1 p-6">
          <Tabs defaultValue="body" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="body">Response Body</TabsTrigger>
              <TabsTrigger value="headers">Headers ({response.headers && typeof response.headers === 'object' ? Object.keys(response.headers).length : 0})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="body" className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900">Response Body</h4>
                  {response && (
                    <span 
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                        response.status >= 200 && response.status < 300 
                          ? "bg-green-100 text-green-800 border-green-300" 
                          : "bg-red-100 text-red-800 border-red-300"
                      }`}
                    >
                      {response.status} {response.statusText}
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyResponseBody}
                  className="flex items-center hover:bg-blue-50"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy JSON
                </Button>
              </div>
              {/* Enhanced response body display for large content with improved scroll handling */}
              <div className="flex-1 border rounded-lg bg-gray-50/50 overflow-hidden">
                <ScrollArea className="h-[400px] p-4">
                  {response.status === 0 && response.data?.error ? (
                    <CORSErrorDisplay 
                      url={requestConfig?.url || 'Unknown URL'} 
                    />
                  ) : response.success !== undefined ? (
                    // Wrapper response structure
                    <pre className="text-sm font-mono bg-white p-4 rounded border overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words max-w-full">
                      {formatJson(response.data)}
                    </pre>
                  ) : (
                    // Direct API response structure
                    <pre className="text-sm font-mono bg-white p-4 rounded border overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words max-w-full">
                      {formatJson(response.data)}
                    </pre>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>
            
            <TabsContent value="headers" className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Response Headers</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyHeaders}
                  className="flex items-center hover:bg-blue-50"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy Headers
                </Button>
              </div>
              {/* Fixed height scrollable container for headers with improved scroll handling */}
              <div className="flex-1 border rounded-lg bg-gray-50/50 overflow-hidden">
                <ScrollArea className="h-[400px] p-4">
                  {response.headers && typeof response.headers === 'object' && Object.entries(response.headers).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(response.headers).map(([key, value]) => (
                        <div key={key} className="flex flex-col space-y-1 p-3 bg-white rounded border-l-4 border-l-blue-200">
                          <code className="font-mono text-sm font-semibold text-blue-700 break-all">
                            {key}
                          </code>
                          <code className="font-mono text-sm text-gray-600 break-all whitespace-pre-wrap overflow-x-auto">
                            {value}
                          </code>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <p>No headers available</p>
                      <p className="text-sm mt-2">This may be due to CORS restrictions or network errors</p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : showResponse && response && !validateResponseData(response) ? (
        <div className="flex-1 p-6">
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Invalid Response Data</h3>
            <p className="text-sm mb-2">The response data is not in the expected format.</p>
            <p className="text-xs text-gray-400">
              This might be due to network errors, CORS issues, or malformed API responses.
            </p>
          </div>
        </div>
      ) : null}

      {/* Validation Section - Collapsible by default, positioned at the bottom */}
      {showValidation && (
        <Collapsible defaultOpen={false} className="p-6">
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Validation Rules
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <ResponseValidation 
              response={response} 
              validationRules={validationRules}
              onRulesChange={onValidationRulesChange} 
            />
          </CollapsibleContent>
        </Collapsible>
      )}



      {/* BDD Code Generation Panel - Collapsible by default, positioned at the bottom */}
      {isFeatureEnabled('bddCodeGeneration') && requestConfig && response && response.status >= 200 && response.status < 300 && validationRules && validationRules.length > 0 && (
        <Collapsible defaultOpen={false} className="p-6">
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                BDD Code Generation
                <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                  {validationRules.length}
                </span>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            {isFeatureEnabled('enableCodeGeneration') ? (
              (() => {
                // Create the endpoint object with proper structure
                const endpoint = {
                  method: requestConfig.method,
                  path: new URL(requestConfig.url).pathname,
                  name: `${requestConfig.method.toLowerCase()}_${new URL(requestConfig.url).pathname.replace(/\//g, '_').replace(/^_|_$/g, '')}`,
                  description: `${requestConfig.method.toUpperCase()} ${new URL(requestConfig.url).pathname}`,
                  requestBody: requestConfig.body ? (() => {
                    try {
                      return JSON.parse(requestConfig.body);
                    } catch (e) {
                      console.warn('Failed to parse request body:', e);
                      return undefined;
                    }
                  })() : undefined,
                  responseBody: response?.data || response,
                  headers: requestConfig.headers || {},
                  // Add validation rules to match the expected structure
                  validationRules: validationRules || [],
                  // Add actual response data for better POJO generation
                  actualResponse: {
                    status: response?.status || 200,
                    data: response?.data || response,
                    headers: response?.headers || {},
                    responseTime: 0 // We don't have this info for single API calls
                  }
                };
                
                // Debug logging
                console.log('🔍 Single API Endpoint for BDD Generation:', endpoint);
                console.log('📋 Method:', endpoint.method);
                console.log('📋 Has Request Body:', !!endpoint.requestBody);
                console.log('📋 Has Response Body:', !!endpoint.responseBody);
                console.log('📋 Validation Rules:', endpoint.validationRules);
                console.log('📋 Response Status:', endpoint.actualResponse.status);
                
                return (
                  <BDDCodeGenerator 
                    endpoints={[endpoint]}
                  />
                );
              })()
            ) : (
              <ComingSoon 
                title="Generate Combined Test Suite"
                description="Generate comprehensive test suites for your API endpoints"
                featureName="Test Suite"
                variant="compact"
              />
            )}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};
