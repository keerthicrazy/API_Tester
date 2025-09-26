import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { SmartImport } from '@/components/SmartImport';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, Package } from 'lucide-react';

interface Endpoint {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  description?: string;
}

const CollectionTesting = () => {
  const [importedEndpoints, setImportedEndpoints] = useState<Endpoint[]>([]);

  const handleEndpointImport = (endpoint: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
  }) => {
    // This is handled by the SmartImport component internally
    console.log('Endpoint imported:', endpoint);
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
                <Package className="w-7 h-7 text-white" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Run API Collection Tests</h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">Import, Validate, Generate Code</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 gap-6">
          {/* Smart Import Section */}
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Upload className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
                  Import API Collection
                </span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">
                  Postman & OpenAPI
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SmartImport onEndpointSelected={handleEndpointImport} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CollectionTesting;
