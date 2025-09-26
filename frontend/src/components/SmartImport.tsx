import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, CheckCircle, List, Settings, Shield, Play, Globe, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { parseImportedFile, parseSwaggerFromURL } from '@/utils/fileParser';
import { MultiEndpointExecution } from './MultiEndpointExecution';
import { proxyApiCall } from '@/api/proxy';
import { ValidationRule } from '@/types/validation';
import { isFeatureEnabled } from '@/config';
import { getMethodColor } from '@/lib/utils';
import { getProxyHealthUrl } from '@/config/proxy';

interface Endpoint {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  description?: string;
}


interface SmartImportProps {
  onEndpointSelected: (endpoint: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
  }) => void;
}

export const SmartImport: React.FC<SmartImportProps> = ({ onEndpointSelected }) => {
  const [importType, setImportType] = useState<string>('');
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);

  const [isUploading, setIsUploading] = useState(false);
  const [fileLoaded, setFileLoaded] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  
  // URL import state
  const [swaggerUrl, setSwaggerUrl] = useState<string>('');
  const [isUrlImporting, setIsUrlImporting] = useState(false);
  const [urlImportError, setUrlImportError] = useState<string>('');
  
  // Modal states
  const [configModalEndpoint, setConfigModalEndpoint] = useState<Endpoint | null>(null);
  const [validationModalEndpoint, setValidationModalEndpoint] = useState<Endpoint | null>(null);
  
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setFileLoaded(false);
    setUrlImportError('');
    
    try {
      const text = await file.text();
      const parsedEndpoints = await parseImportedFile(text, file.name);
      
      setEndpoints(parsedEndpoints);
      setFileLoaded(true);
      setFileName(file.name);
      
      toast({
        title: "File imported successfully",
        description: `Found ${parsedEndpoints.length} endpoints`,
      });
    } catch (error) {
      console.error('File parsing error:', error);
      setFileLoaded(false);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to parse the file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlImport = async () => {
    if (!swaggerUrl.trim()) {
      setUrlImportError('Please enter a valid Swagger/OpenAPI URL');
      return;
    }

    setIsUrlImporting(true);
    setUrlImportError('');
    setFileLoaded(false);
    
    try {
      console.log(`🔄 Starting Swagger import from URL: ${swaggerUrl.trim()}`);
      
      const parsedEndpoints = await parseSwaggerFromURL(swaggerUrl.trim());
      
      setEndpoints(parsedEndpoints);
      setFileLoaded(true);
      setFileName(`Swagger from ${new URL(swaggerUrl).hostname}`);
      
      toast({
        title: "Swagger imported successfully",
        description: `Found ${parsedEndpoints.length} endpoints from ${new URL(swaggerUrl).hostname}`,
      });
    } catch (error) {
      console.error('URL import error:', error);
      setFileLoaded(false);
      
      let errorMessage = "Failed to import from URL";
      let isProxyError = false;
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check if it's a proxy-related error
        if (error.message.includes('proxy') || 
            error.message.includes('Failed to fetch') ||
            error.message.includes('NetworkError')) {
          isProxyError = true;
          errorMessage = `Proxy server error: ${error.message}`;
        }
      }
      
      setUrlImportError(errorMessage);
      
      toast({
        title: isProxyError ? "Proxy Server Error" : "URL import failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // If it's a proxy error, provide additional help
      if (isProxyError) {
        console.log('🔧 Proxy error detected. Please ensure:');
        console.log('1. Backend proxy server is running: cd backend && node server.js');
        console.log(`2. Proxy server is accessible at ${getProxyHealthUrl()}`);
        console.log('3. No firewall is blocking the connection');
      }
    } finally {
      setIsUrlImporting(false);
    }
  };



  const handleCodeGeneration = (selectedEndpoints: Endpoint[]) => {
    toast({
      title: "Code generation requested",
      description: `Ready to generate test code for ${selectedEndpoints.length} endpoints`,
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Smart Import</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="import-type">Import Type</Label>
            <Select value={importType} onValueChange={setImportType}>
              <SelectTrigger>
                <SelectValue placeholder="Select import type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="postman">Postman Collection</SelectItem>
                <SelectItem value="swagger">Swagger/OpenAPI</SelectItem>
                <SelectItem value="swagger-url">Import Swagger via URL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {importType === 'swagger-url' && (
            <div className="space-y-2">
              <Label htmlFor="swagger-url">Swagger/OpenAPI URL</Label>
              <div className="flex space-x-2">
                <Input
                  id="swagger-url"
                  placeholder="https://example.com/api/swagger.json"
                  value={swaggerUrl}
                  onChange={(e) => setSwaggerUrl(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleUrlImport}
                  disabled={isUrlImporting || !swaggerUrl.trim()}
                  className="flex items-center space-x-1"
                >
                  {isUrlImporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1"></div>
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4" />
                      <span>Import</span>
                    </>
                  )}
                </Button>
              </div>
              {urlImportError && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{urlImportError}</span>
                </div>
              )}
              <p className="text-xs text-gray-500">
                Enter a URL to a Swagger/OpenAPI specification (JSON or YAML)
              </p>
            </div>
          )}

          {(importType === 'postman' || importType === 'swagger') && (
            <div className="space-y-2">
              <Label htmlFor="file-upload">Upload File</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="file-upload"
                  type="file"
                  accept={importType === 'postman' ? '.json' : '.json,.yaml,.yml'}
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="flex-1"
                />
                {fileLoaded && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">Loaded</span>
                  </div>
                )}
              </div>
              {fileLoaded && fileName && (
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span className="flex items-center space-x-1">
                    <FileText className="w-3 h-3" />
                    <span>{fileName}</span>
                  </span>
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <List className="w-3 h-3" />
                    <span>{endpoints.length} endpoints</span>
                  </Badge>
                </div>
              )}
              <p className="text-xs text-gray-500">
                {importType === 'postman' 
                  ? 'Supports Postman Collection v2.0 and v2.1 (.json)'
                  : 'Supports OpenAPI 3.x and Swagger 2.0 (.json, .yaml, .yml)'
                }
              </p>
            </div>
          )}

          {endpoints.length > 0 && (
            <MultiEndpointExecution 
              endpoints={endpoints}
              onCodeGeneration={handleCodeGeneration}
            />
          )}

          {isUploading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Parsing file...</span>
            </div>
          )}
        </CardContent>
      </Card>


    </>
  );
};
