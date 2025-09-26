import React from 'react';
import { AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import { getProxyHealthUrl, getProxySolutions } from '@/config/proxy';

interface CORSErrorDisplayProps {
  url: string;
  onRetry?: () => void;
}

export const CORSErrorDisplay: React.FC<CORSErrorDisplayProps> = ({ url, onRetry }) => {
  const solutions = getProxySolutions();

  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>CORS Error</AlertTitle>
        <AlertDescription>
          The request to <code className="bg-muted px-1 rounded">{url}</code> was blocked by CORS policy.
          This is a common issue when testing APIs from a browser.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Backend Proxy Solution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            This application uses a backend proxy server to handle CORS issues. 
            The proxy server acts as an intermediary between your browser and the target API.
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Status</Badge>
              <span className="text-sm">Checking proxy server...</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline">Health Check</Badge>
              <a 
                href={getProxyHealthUrl()} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                Check proxy health
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Troubleshooting Steps:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {solutions.map((solution, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 font-mono">{index + 1}.</span>
                  <span>{solution}</span>
                </li>
              ))}
            </ul>
          </div>

          {onRetry && (
            <Button 
              onClick={onRetry} 
              variant="outline" 
              size="sm"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Request
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 