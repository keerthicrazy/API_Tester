
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Clipboard, X, FileText, Database, Settings } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface Endpoint {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  description?: string;
  customizableFields?: Set<string>;
  endpointName?: string;  // Custom endpoint name for BDD generation
}

interface EndpointConfigModalProps {
  endpoint: Endpoint;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedEndpoint: Endpoint) => void;
}

export const EndpointConfigModal: React.FC<EndpointConfigModalProps> = ({
  endpoint,
  isOpen,
  onClose,
  onSave
}) => {
  const [config, setConfig] = useState<Endpoint>(endpoint);
  const [headerEntries, setHeaderEntries] = useState<Array<{key: string, value: string}>>(() => 
    Object.entries(endpoint.headers).map(([key, value]) => ({ key, value }))
  );
  const [showBulkHeaders, setShowBulkHeaders] = useState(false);
  const [bulkHeadersText, setBulkHeadersText] = useState('');
  const [showBulkBody, setShowBulkBody] = useState(false);
  const [bulkBodyText, setBulkBodyText] = useState('');
  const [customizableFields, setCustomizableFields] = useState<Set<string>>(
    endpoint.customizableFields || new Set()
  );
  const [showFieldConfig, setShowFieldConfig] = useState(false);

  // Update state when endpoint changes
  useEffect(() => {
    console.log('Endpoint changed, updating state:', endpoint);
    setConfig(endpoint);
    setHeaderEntries(Object.entries(endpoint.headers).map(([key, value]) => ({ key, value })));
    setCustomizableFields(endpoint.customizableFields || new Set());
    console.log('Updated customizableFields:', endpoint.customizableFields);
  }, [endpoint]);

  const handleSave = () => {
    const updatedHeaders = headerEntries.reduce((acc, entry) => {
      if (entry.key.trim()) {
        acc[entry.key.trim()] = entry.value.trim();
      }
      return acc;
    }, {} as Record<string, string>);

    const updatedEndpoint = {
      ...config,
      headers: updatedHeaders,
      customizableFields: customizableFields
    };

    onSave(updatedEndpoint);
    onClose();
  };

  const addHeaderEntry = () => {
    setHeaderEntries([...headerEntries, { key: '', value: '' }]);
  };

  const removeHeaderEntry = (index: number) => {
    setHeaderEntries(headerEntries.filter((_, i) => i !== index));
  };

  const updateHeaderEntry = (index: number, field: 'key' | 'value', value: string) => {
    const updated = headerEntries.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    );
    setHeaderEntries(updated);
  };

  const handleBulkHeadersApply = () => {
    const newHeaders: Record<string, string> = {};
    bulkHeadersText.split('\n').forEach(line => {
      const [key, value] = line.split(':').map(s => s.trim());
      if (key && value) {
        newHeaders[key] = value;
      }
    });
    setHeaderEntries(Object.entries(newHeaders).map(([key, value]) => ({ key, value })));
    setBulkHeadersText('');
    setShowBulkHeaders(false);
  };

  const handleBulkHeadersClear = () => {
    setBulkHeadersText('');
  };

  const handleBulkBodyApply = () => {
    try {
      const parsedBody = JSON.parse(bulkBodyText);
      setConfig({ ...config, body: JSON.stringify(parsedBody, null, 2) });
      setBulkBodyText('');
      setShowBulkBody(false);
    } catch (e) {
      alert('Invalid JSON in bulk body input. Please check your syntax.');
    }
  };

  const handleBulkBodyClear = () => {
    setBulkBodyText('');
  };

  const handleFormatJson = () => {
    try {
      const parsedBody = JSON.parse(bulkBodyText);
      setBulkBodyText(JSON.stringify(parsedBody, null, 2));
    } catch (e) {
      alert('Invalid JSON in bulk body input. Cannot format.');
    }
  };

  const handleSampleBody = () => {
    const samples = [
      '{"name": "John Doe", "email": "john@example.com", "age": 30}',
      '{"title": "Sample Post", "content": "This is the post content", "author": "John Doe"}',
      '{"username": "johndoe", "password": "secure123", "email": "john@example.com"}',
      '{"product": "Sample Product", "price": 29.99, "category": "electronics"}'
    ];
    
    const randomSample = samples[Math.floor(Math.random() * samples.length)];
    setBulkBodyText(randomSample);
    setShowBulkBody(true);
  };

  const isValidJson = (str: string) => {
    if (!str.trim()) return true;
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  };

  const handleFormatMainBody = () => {
    try {
      const parsedBody = JSON.parse(config.body || '');
      setConfig({ ...config, body: JSON.stringify(parsedBody, null, 2) });
    } catch (e) {
      alert('Invalid JSON in main body input. Cannot format.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Badge variant="outline" className="font-mono">
              {config.method}
            </Badge>
            <span>Configure Endpoint</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="method">Method</Label>
                  <Select
                    value={config.method}
                    onValueChange={(value) => setConfig({ ...config, method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                      <SelectItem value="HEAD">HEAD</SelectItem>
                      <SelectItem value="OPTIONS">OPTIONS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3 space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    value={config.url}
                    onChange={(e) => setConfig({ ...config, url: e.target.value })}
                    placeholder="https://api.example.com/endpoint"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name (Optional)</Label>
                <Input
                  id="name"
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  placeholder="Endpoint name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endpointName">Endpoint Name for BDD</Label>
                <Input
                  id="endpointName"
                  value={config.endpointName || ''}
                  onChange={(e) => setConfig({ ...config, endpointName: e.target.value })}
                  placeholder="Enter custom endpoint name (optional)"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use auto-generated names, or enter a custom name for consistent BDD code naming
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Headers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Headers</span>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulkHeaders(!showBulkHeaders)}
                    className="flex items-center space-x-1"
                  >
                    <Clipboard className="w-3 h-3" />
                    <span>{showBulkHeaders ? 'Hide' : 'Bulk Edit'}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addHeaderEntry}
                    className="flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Header</span>
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Bulk Header Input */}
              {showBulkHeaders && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="space-y-3">
                    <div className="text-sm text-blue-800">
                      <strong>Bulk Header Input:</strong> Paste headers in format: Header-Name: Header-Value
                    </div>
                    <Textarea
                      placeholder={`Authorization: Bearer xyz123
Content-Type: application/json
X-Custom-Header: test`}
                      value={bulkHeadersText}
                      onChange={(e) => setBulkHeadersText(e.target.value)}
                      className="min-h-[120px] font-mono text-sm"
                    />
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
                        onClick={handleBulkHeadersClear}
                        className="flex items-center space-x-1"
                      >
                        <X className="w-3 h-3" />
                        <span>Clear</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {headerEntries.map((entry, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      placeholder="Header name"
                      value={entry.key}
                      onChange={(e) => updateHeaderEntry(index, 'key', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Header value"
                      value={entry.value}
                      onChange={(e) => updateHeaderEntry(index, 'value', e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeHeaderEntry(index)}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {headerEntries.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No headers configured. Click "Add Header" to add one.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Request Body */}
          {['POST', 'PUT', 'PATCH'].includes(config.method) ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Request Body</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulkBody(!showBulkBody)}
                    className="flex items-center space-x-1"
                  >
                    <Clipboard className="w-3 h-3" />
                    <span>{showBulkBody ? 'Hide' : 'Bulk Edit'}</span>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Bulk Body Input */}
                {showBulkBody && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="space-y-3">
                      <div className="text-sm text-green-800">
                        <strong>Bulk Body Input:</strong> Paste JSON request body content
                      </div>
                      <Textarea
                        placeholder='{"name": "John Doe", "email": "john@example.com", "age": 30}'
                        value={bulkBodyText}
                        onChange={(e) => setBulkBodyText(e.target.value)}
                        className="min-h-[120px] font-mono text-sm"
                      />
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={handleBulkBodyApply}
                          className="flex items-center space-x-1"
                        >
                          <Clipboard className="w-3 h-3" />
                          <span>Apply Body</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleBulkBodyClear}
                          className="flex items-center space-x-1"
                        >
                          <X className="w-3 h-3" />
                          <span>Clear</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleFormatJson}
                          className="flex items-center space-x-1"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Format JSON</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSampleBody}
                          className="flex items-center space-x-1"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Sample</span>
                        </Button>
                      </div>
                      {bulkBodyText && !isValidJson(bulkBodyText) && (
                        <p className="text-sm text-red-600">
                          ⚠️ Invalid JSON format. Please check your syntax.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Body Content</Label>
                    <div className="flex space-x-2">
                      {config.body && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfig({ ...config, body: '' })}
                          className="flex items-center space-x-1"
                        >
                          <X className="w-3 h-3" />
                          <span>Clear</span>
                        </Button>
                      )}
                      {config.body && isValidJson(config.body) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleFormatMainBody}
                          className="flex items-center space-x-1"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Format JSON</span>
                        </Button>
                      )}
                    </div>
                  </div>
                  <Textarea
                    value={config.body || ''}
                    onChange={(e) => setConfig({ ...config, body: e.target.value })}
                    placeholder="Request body (JSON, XML, or plain text)"
                    className="min-h-[120px] font-mono text-sm"
                  />
                  {config.body && !isValidJson(config.body) && (
                    <p className="text-sm text-amber-600">
                      ⚠️ Note: Body content is not valid JSON
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Request Body
                  <Badge variant="secondary" className="text-xs">
                    Not supported for {config.method} requests
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-gray-50 rounded-md border-2 border-dashed border-gray-200">
                  <p className="text-sm text-gray-600 text-center">
                    {config.method} requests cannot have a request body according to HTTP standards.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Request Body Field Configuration - Only for POST/PUT/PATCH */}
          {['POST', 'PUT', 'PATCH'].includes(config.method) && config.body && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <span>Request Body Field Configuration</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFieldConfig(!showFieldConfig)}
                    className="flex items-center space-x-1"
                  >
                    <Settings className="w-3 h-3" />
                    <span>{showFieldConfig ? 'Hide' : 'Configure Fields'}</span>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {showFieldConfig ? (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      <strong>Configure field behavior for BDD generation:</strong>
                      <br />
                      🔵 <strong>Parameterized:</strong> Field appears in Examples table as &lt;fieldName&gt;
                      <br />
                      🟢 <strong>Default:</strong> Field uses fixed value in step definitions
                    </div>
                    
                    {/* Field Configuration */}
                    {(() => {
                      try {
                        const requestBody = JSON.parse(config.body);
                        const fields = Object.keys(requestBody);
                        
                        if (fields.length === 0) {
                          return (
                            <div className="text-sm text-muted-foreground text-center py-4">
                              No fields detected in request body.
                            </div>
                          );
                        }
                        
                        return (
                          <div className="space-y-3">
                            {fields.map(field => {
                              const isConfigured = customizableFields.has(field);
                              return (
                                <div key={field} className={`flex items-center justify-between p-3 rounded-md border-2 ${
                                  isConfigured ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                                }`}>
                                  <div className="flex items-center space-x-3">
                                    <Checkbox
                                      id={`field-${field}`}
                                      checked={isConfigured}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setCustomizableFields(prev => new Set([...prev, field]));
                                        } else {
                                          setCustomizableFields(prev => {
                                            const newSet = new Set(prev);
                                            newSet.delete(field);
                                            return newSet;
                                          });
                                        }
                                      }}
                                    />
                                    <Label htmlFor={`field-${field}`} className={`text-sm font-medium ${
                                      isConfigured ? 'text-blue-800' : 'text-gray-700'
                                    }`}>
                                      {field}
                                    </Label>
                                    <span className="text-xs text-gray-500">
                                      Default: {typeof requestBody[field] === 'object' 
                                        ? JSON.stringify(requestBody[field]) 
                                        : typeof requestBody[field] === 'string' 
                                          ? `"${requestBody[field]}"` 
                                          : requestBody[field]}
                                    </span>
                                  </div>
                                  
                                  <Badge variant={isConfigured ? "default" : "secondary"} className={
                                    isConfigured ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
                                  }>
                                    {isConfigured ? "🔵 Parameterized" : "🟢 Default"}
                                  </Badge>
                                </div>
                              );
                            })}
                          </div>
                        );
                      } catch (e) {
                        return (
                          <div className="text-sm text-muted-foreground text-center py-4">
                            Invalid JSON in request body. Please fix the JSON format first.
                          </div>
                        );
                      }
                    })()}
                    
                    {/* Summary */}
                    {customizableFields.size > 0 && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="text-sm font-medium text-blue-800 mb-2">
                          ✅ Configured Fields for Parameterization:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Array.from(customizableFields).map(field => (
                            <Badge key={field} variant="secondary" className="bg-blue-100 text-blue-700">
                              {field}
                            </Badge>
                          ))}
                        </div>
                        <div className="text-xs text-blue-600 mt-2">
                          These fields will appear in the Examples table during BDD code generation.
                        </div>
                      </div>
                    )}
                    
                    {/* Reset Button */}
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCustomizableFields(new Set())}
                        className="text-xs"
                      >
                        Reset All Fields
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Current Configuration Status */}
                    {customizableFields.size > 0 && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="text-sm font-medium text-blue-800 mb-2">
                          🔵 Currently Configured Fields ({customizableFields.size}):
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Array.from(customizableFields).map(field => (
                            <Badge key={field} variant="secondary" className="bg-blue-100 text-blue-700">
                              {field}
                            </Badge>
                          ))}
                        </div>
                        <div className="text-xs text-blue-600 mt-2">
                          These fields are already configured for parameterization in BDD generation.
                        </div>
                      </div>
                    )}
                    
                    <div className="text-center py-4">
                      <div className="text-sm text-muted-foreground mb-2">
                        Configure which request body fields should be parameterized in BDD generation
                      </div>
                      <div className="text-xs text-blue-500">
                        💡 <strong>Tip:</strong> Parameterized fields will appear in Examples table, default fields will use fixed values
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
