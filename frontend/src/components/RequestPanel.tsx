
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X, Send, Zap, Copy, Clipboard, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getMethodColor } from '@/lib/utils';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface RequestPanelProps {
  onApiCall: (config: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
  }) => void;
  loading: boolean;
  selectedEndpoint?: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
    name?: string;
    description?: string;
  };
}

interface Header {
  key: string;
  value: string;
}

const HTTP_METHODS = [
  { value: 'GET', color: getMethodColor('GET') },
  { value: 'POST', color: getMethodColor('POST') },
  { value: 'PUT', color: getMethodColor('PUT') },
  { value: 'DELETE', color: getMethodColor('DELETE') },
  { value: 'PATCH', color: getMethodColor('PATCH') },
  { value: 'HEAD', color: getMethodColor('HEAD') },
  { value: 'OPTIONS', color: getMethodColor('OPTIONS') },
];

export const RequestPanel: React.FC<RequestPanelProps> = ({ onApiCall, loading, selectedEndpoint }) => {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState<Header[]>([{ key: '', value: '' }]);
  const [body, setBody] = useState('');
  const [bulkHeadersText, setBulkHeadersText] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [jsonValidation, setJsonValidation] = useState<{
    isValid: boolean;
    error?: string;
    suggestions?: string[];
  }>({ isValid: true });
  const { toast } = useToast();

  // Auto-populate form when selectedEndpoint changes
  useEffect(() => {
    if (selectedEndpoint) {
      setMethod(selectedEndpoint.method);
      setUrl(selectedEndpoint.url);
      
      // Convert headers object to array format
      const headerArray = Object.entries(selectedEndpoint.headers || {}).map(([key, value]) => ({
        key,
        value
      }));
      
      // Always ensure at least one empty header row
      setHeaders(headerArray.length > 0 ? [...headerArray, { key: '', value: '' }] : [{ key: '', value: '' }]);
      
      setBody(selectedEndpoint.body || '');
    }
  }, [selectedEndpoint]);

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const updatedHeaders = headers.map((header, i) => 
      i === index ? { ...header, [field]: value } : header
    );
    setHeaders(updatedHeaders);
  };

  const parseBulkHeaders = (text: string): Header[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const parsedHeaders: Header[] = [];
    
    lines.forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        if (key && value) {
          parsedHeaders.push({ key, value });
        }
      }
    });
    
    return parsedHeaders;
  };

  const handleBulkHeadersApply = () => {
    const parsedHeaders = parseBulkHeaders(bulkHeadersText);
    if (parsedHeaders.length > 0) {
      setHeaders([...parsedHeaders, { key: '', value: '' }]);
      setShowBulkInput(false);
      setBulkHeadersText('');
      toast({
        title: "Headers imported",
        description: `Successfully parsed ${parsedHeaders.length} headers`,
      });
    } else {
      toast({
        title: "No valid headers found",
        description: "Please check the format: Header-Name: Header-Value",
        variant: "destructive",
      });
    }
  };

  const handleBulkHeadersCancel = () => {
    setShowBulkInput(false);
    setBulkHeadersText('');
  };

  // JSON validation function
  const validateJson = (jsonString: string) => {
    if (!jsonString.trim()) {
      return { isValid: true };
    }

    try {
      JSON.parse(jsonString);
      return { isValid: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid JSON';
      let suggestions: string[] = [];

      // Provide helpful suggestions based on common errors
      if (errorMessage.includes('Unexpected token')) {
        suggestions = [
          'Check for missing quotes around property names',
          'Ensure all strings are properly quoted',
          'Remove trailing commas',
          'Check for extra characters after JSON'
        ];
      } else if (errorMessage.includes('Unexpected end')) {
        suggestions = [
          'Check for missing closing braces or brackets',
          'Ensure the JSON is complete'
        ];
      } else if (errorMessage.includes('null')) {
        suggestions = [
          'Use null instead of "null" for null values',
          'Check for extra quotes around null'
        ];
      } else if (errorMessage.includes('Unexpected number')) {
        suggestions = [
          'Check for invalid number formats',
          'Ensure numbers are not quoted'
        ];
      }

      return {
        isValid: false,
        error: errorMessage,
        suggestions
      };
    }
  };

  // Validate JSON when body changes
  useEffect(() => {
    if (['POST', 'PUT', 'PATCH'].includes(method) && body.trim()) {
      const validation = validateJson(body);
      setJsonValidation(validation);
    } else {
      setJsonValidation({ isValid: true });
    }
  }, [body, method]);

  // Format JSON function
  const formatJson = () => {
    if (!body.trim()) return;
    
    try {
      const parsed = JSON.parse(body);
      const formatted = JSON.stringify(parsed, null, 2);
      setBody(formatted);
      toast({
        title: "JSON Formatted",
        description: "JSON has been formatted and indented for better readability.",
      });
    } catch (error) {
      toast({
        title: "Cannot Format JSON",
        description: "Please fix JSON syntax errors before formatting.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = () => {
    if (!url.trim()) return;

    // Check if JSON is valid before submitting
    if (['POST', 'PUT', 'PATCH'].includes(method) && body.trim() && !jsonValidation.isValid) {
      toast({
        title: "Invalid JSON",
        description: "Please fix the JSON syntax errors before sending the request.",
        variant: "destructive",
      });
      return;
    }

    const headersObject = headers.reduce((acc, header) => {
      if (header.key.trim() && header.value.trim()) {
        acc[header.key.trim()] = header.value.trim();
      }
      return acc;
    }, {} as Record<string, string>);

    // Don't send body for GET requests
    const shouldSendBody = method !== 'GET' && body.trim();
    
    onApiCall({
      method,
      url: url.trim(),
      headers: headersObject,
      body: shouldSendBody ? body.trim() : undefined,
    });
  };

  const getMethodColorLocal = (methodValue: string) => {
    return HTTP_METHODS.find(m => m.value === methodValue)?.color || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const validHeaders = headers.filter(h => h.key.trim() && h.value.trim());

  return (
    <div className="space-y-6">
      {/* Request Configuration */}
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center text-xl">
              <Zap className="w-6 h-6 mr-2 text-blue-600" />
              Request Configuration
            </span>
            {(url || validHeaders.length > 0 || body) && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Ready
              </Badge>
            )}
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Configure your HTTP request manually with full control over all parameters
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Method and URL */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Request Details</Label>
            <div className="flex space-x-3">
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="w-32 h-12 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HTTP_METHODS.map((httpMethod) => {
                    const supportsBody = ['POST', 'PUT', 'PATCH'].includes(httpMethod.value);
                    return (
                      <SelectItem key={httpMethod.value} value={httpMethod.value}>
                        <div className="flex items-center justify-between w-full">
                          <Badge className={`${httpMethod.color} border text-xs font-semibold`}>
                            {httpMethod.value}
                          </Badge>
                          {!supportsBody && (
                            <span className="text-xs text-gray-500 ml-2">No body</span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Input
                placeholder="https://api.example.com/endpoint"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 h-12 text-base font-mono"
              />
            </div>
          </div>

          {/* Request Details Tabs */}
          <Tabs defaultValue="headers" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100">
              <TabsTrigger value="headers" className="flex items-center space-x-2">
                <span>Headers</span>
                {validHeaders.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {validHeaders.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="body" className="flex items-center space-x-2">
                <span>Body</span>
                {body.trim() && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    JSON
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="headers" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700">HTTP Headers</Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBulkInput(true)}
                      className="flex items-center space-x-1"
                    >
                      <Clipboard className="w-3 h-3" />
                      <span>Bulk Input</span>
                    </Button>
                  </div>
                </div>

                {/* Bulk Header Input */}
                {showBulkInput && (
                  <Card className="border-2 border-blue-200 bg-blue-50/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        Bulk Header Input (Postman-style)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">
                          Paste headers in format: Header-Name: Header-Value
                        </Label>
                        <Textarea
                          placeholder={`Authorization: Bearer xyz123
Content-Type: application/json
X-Custom-Header: test`}
                          value={bulkHeadersText}
                          onChange={(e) => setBulkHeadersText(e.target.value)}
                          className="min-h-[120px] font-mono text-sm"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={handleBulkHeadersApply}
                          className="flex items-center space-x-1"
                        >
                                                <Clipboard className="w-3 h-3" />
                      <span>Apply Headers</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleBulkHeadersCancel}
                          className="flex items-center space-x-1"
                        >
                          <X className="w-3 h-3" />
                          <span>Cancel</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Individual Header Input */}
                {headers.map((header, index) => (
                  <div key={index} className="flex space-x-2 items-center">
                    <Input
                      placeholder="Header name (e.g., Authorization)"
                      value={header.key}
                      onChange={(e) => updateHeader(index, 'key', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Header value"
                      value={header.value}
                      onChange={(e) => updateHeader(index, 'value', e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeHeader(index)}
                      disabled={headers.length === 1}
                      className="px-3 hover:bg-red-50 hover:border-red-200"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  onClick={addHeader} 
                  className="w-full border-dashed border-2 hover:bg-blue-50 hover:border-blue-300"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Header
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="body" className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="request-body" className="text-sm font-medium text-gray-700">
                  Request Body (JSON)
                  {method === 'GET' && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Not supported for GET requests
                    </Badge>
                  )}
                  {['POST', 'PUT', 'PATCH'].includes(method) && body.trim() && (
                    <div className="inline-flex items-center ml-2">
                      {jsonValidation.isValid ? (
                        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Valid JSON
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Invalid JSON
                        </Badge>
                      )}
                    </div>
                  )}
                </Label>
                <Textarea
                  id="request-body"
                  placeholder={
                    method === 'GET' 
                      ? 'GET requests do not support request bodies'
                      : `{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30
}`
                  }
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  disabled={method === 'GET'}
                  className={`min-h-[200px] font-mono text-sm border-2 ${
                    method === 'GET' 
                      ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' 
                      : jsonValidation.isValid 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                  }`}
                />
                
                {/* JSON Validation Feedback */}
                {['POST', 'PUT', 'PATCH'].includes(method) && body.trim() && (
                  <div className={`p-3 rounded-md ${
                    jsonValidation.isValid 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    {jsonValidation.isValid ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-green-800">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">Valid JSON format</span>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={formatJson}
                              className="h-6 px-2 text-green-600 hover:bg-green-100"
                            >
                              Format JSON
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setBody('')}
                              className="h-6 px-2 text-gray-600 hover:bg-gray-100"
                            >
                              Clear Body
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center text-red-800">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          <span className="text-sm font-medium">JSON Syntax Error</span>
                        </div>
                        <p className="text-sm text-red-700">{jsonValidation.error}</p>
                        {jsonValidation.suggestions && jsonValidation.suggestions.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-red-600 mb-1">Suggestions:</p>
                            <ul className="text-xs text-red-600 space-y-1">
                              {jsonValidation.suggestions.map((suggestion, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="mr-2">•</span>
                                  <span>{suggestion}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {method === 'GET' && (
                  <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded-md">
                    ⚠️ <strong>Note:</strong> GET requests cannot have a request body according to HTTP standards. 
                    The body field has been disabled for this method.
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit} 
            disabled={!url.trim() || loading}
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg font-medium shadow-lg"
            size="lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Sending Request...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Send Request
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
