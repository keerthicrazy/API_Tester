import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { FileText, Database, Edit3, CheckCircle } from 'lucide-react';
import { isFeatureEnabled } from '@/config';

interface SchemaBuilderProps {
    endpoint: any;
    openAPISchemas?: Record<string, any>;
    onSchemaGenerated: (schemas: any) => void;
    onClose: () => void;
}



const SchemaBuilder: React.FC<SchemaBuilderProps> = ({ 
    endpoint, 
    openAPISchemas, 
    onSchemaGenerated, 
    onClose 
}) => {
    // Response schema state
    const [schemaSource, setSchemaSource] = useState<'openapi' | 'inferred' | 'manual'>('inferred');
    const [selectedResponseSchema, setSelectedResponseSchema] = useState<string>('');
    const [manualResponseSchema, setManualResponseSchema] = useState<string>('');
    const [availableSchemas, setAvailableSchemas] = useState<Record<string, any>>({});
    


    useEffect(() => {
        if (openAPISchemas) {
            setAvailableSchemas(openAPISchemas);
        }
        
        // Auto-select 'inferred' if no OpenAPI schemas available
        if (!openAPISchemas || Object.keys(openAPISchemas).length === 0) {
            setSchemaSource('inferred');
        }
        
        // Load previously saved schema if it exists
        if (endpoint.responseSchema) {
            if (endpoint.schemaSource === 'openapi') {
                setSchemaSource('openapi');
                // Find and select the saved OpenAPI schema
                const method = endpoint.method.toUpperCase();
                const path = endpoint.path;
                const savedSchemaKey = Object.keys(openAPISchemas || {}).find(key => 
                    key.includes(`${method}_${path}_`) && key.includes('_Response')
                );
                if (savedSchemaKey) {
                    setSelectedResponseSchema(savedSchemaKey);
                }
            } else if (endpoint.schemaSource === 'inferred') {
                setSchemaSource('inferred');
            } else if (endpoint.schemaSource === 'manual') {
                setSchemaSource('manual');
                // Load the saved manual schema
                if (endpoint.responseSchema.data) {
                    setManualResponseSchema(JSON.stringify(endpoint.responseSchema.data, null, 2));
                }
            }
        }
        

    }, [openAPISchemas, endpoint]);

    const getSchemaOptions = (type: 'response') => {
        if (!availableSchemas) return [];
        
        const method = endpoint.method.toUpperCase();
        const path = endpoint.path;
        
        return Object.keys(availableSchemas).filter(schemaName => {
            return schemaName.includes(`${method}_${path}_`) && schemaName.includes('_Response');
        });
    };

    const handleGenerateSchema = () => {
        let responseSchema = null;

        switch (schemaSource) {
            case 'openapi':
                if (selectedResponseSchema && availableSchemas[selectedResponseSchema]) {
                    responseSchema = availableSchemas[selectedResponseSchema];
                }
                break;
                
            case 'inferred':
                // Use actual endpoint response data to infer schema
                responseSchema = endpoint.actualResponse?.data ? { source: 'inferred', data: endpoint.actualResponse.data } : null;
                break;
                
            case 'manual':
                try {
                    if (manualResponseSchema.trim()) {
                        responseSchema = { source: 'manual', data: JSON.parse(manualResponseSchema) };
                    }
                } catch (error) {
                    console.error('Invalid JSON in manual schema:', error);
                    return;
                }
                break;
        }

        // Generate schema (no error schema - now handled at collection level)
        onSchemaGenerated({
            response: responseSchema,
            error: null,
            source: schemaSource
        });
    };

    const renderSchemaPreview = (schema: any, type: string) => {
        if (!schema) return null;

        return (
            <div className="p-3 bg-gray-50 rounded border">
                <h5 className="font-medium text-sm mb-2">{type} Schema Preview:</h5>
                <pre className="text-xs overflow-auto max-h-32">
                    {JSON.stringify(schema, null, 2)}
                </pre>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold">Schema Configuration for {endpoint.name}</h2>
                                                {endpoint.responseSchema && (
                            <p className="text-sm text-green-600 mt-1 flex items-center gap-2">
                                ✅ Response schema configured
                                <span>({endpoint.schemaSource})</span>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                        setManualResponseSchema('');
                                        setSelectedResponseSchema('');
                                        
                                        // Clear the saved schemas
                                        onSchemaGenerated({
                                            response: null,
                                            error: null,
                                            source: 'none'
                                        });
                                    }}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    Clear Schema
                                </Button>
                            </p>
                        )}
                    </div>
                    <Button variant="outline" onClick={onClose}>
                        ✕
                    </Button>
                </div>

                {/* Schema Source Selection */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            Schema Source
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`grid gap-4 ${openAPISchemas && Object.keys(openAPISchemas).length > 0 && isFeatureEnabled('enableOpenAPISchemaExtraction') ? 'grid-cols-3' : 'grid-cols-2'}`}>
                            {openAPISchemas && Object.keys(openAPISchemas).length > 0 && isFeatureEnabled('enableOpenAPISchemaExtraction') && (
                                <Button 
                                    variant={schemaSource === 'openapi' ? 'default' : 'outline'}
                                    onClick={() => setSchemaSource('openapi')}
                                    className="flex flex-col items-center gap-2 h-auto py-4"
                                >
                                    <FileText className="h-6 w-6" />
                                    <span>OpenAPI</span>
                                    <Badge variant="secondary">{Object.keys(openAPISchemas).length} schemas</Badge>
                                </Button>
                            )}
                            
                            {isFeatureEnabled('enableSchemaInference') && (
                                <Button 
                                    variant={schemaSource === 'inferred' ? 'default' : 'outline'}
                                    onClick={() => setSchemaSource('inferred')}
                                    className="flex flex-col items-center gap-2 h-auto py-4"
                                >
                                    <Database className="h-6 w-6" />
                                    <span>Inferred</span>
                                    <Badge variant="secondary">Auto-detect</Badge>
                                </Button>
                            )}
                            
                            {isFeatureEnabled('enableManualSchemaDefinition') && (
                                <Button 
                                    variant={schemaSource === 'manual' ? 'default' : 'outline'}
                                    onClick={() => setSchemaSource('manual')}
                                    className="flex flex-col items-center gap-2 h-auto py-4"
                                >
                                    <Edit3 className="h-6 w-6" />
                                    <span>Manual</span>
                                    <Badge variant="secondary">Custom</Badge>
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Current Schema Preview */}
                {endpoint.responseSchema && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                Current Schema
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">{endpoint.schemaSource}</Badge>
                                    <span className="text-sm text-gray-600">Source: {endpoint.schemaSource}</span>
                                </div>
                                <div className="p-3 bg-gray-50 rounded border">
                                    <h5 className="font-medium text-sm mb-2">Saved Response Schema:</h5>
                                    <pre className="text-xs overflow-auto max-h-32">
                                        {JSON.stringify(endpoint.responseSchema.data || endpoint.responseSchema, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* OpenAPI Schema Selection */}
                {schemaSource === 'openapi' && openAPISchemas && isFeatureEnabled('enableOpenAPISchemaExtraction') && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Response Schema</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Select value={selectedResponseSchema} onValueChange={setSelectedResponseSchema}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Response Schema" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {getSchemaOptions('response').map(schemaName => (
                                            <SelectItem key={schemaName} value={schemaName}>
                                                {schemaName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                
                                {selectedResponseSchema && (
                                    renderSchemaPreview(availableSchemas[selectedResponseSchema], 'Response')
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Manual Schema Definition */}
                {schemaSource === 'manual' && isFeatureEnabled('enableManualSchemaDefinition') && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Response Schema</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Label htmlFor="manual-response-schema">Define Response Schema (JSON)</Label>
                                <Textarea
                                    id="manual-response-schema"
                                    value={manualResponseSchema}
                                    onChange={(e) => setManualResponseSchema(e.target.value)}
                                    placeholder="Enter JSON schema or sample data..."
                                    rows={6}
                                    className="mt-2"
                                />
                                <p className="text-sm text-gray-600 mt-1">
                                    Enter either a JSON schema or sample response data
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Inferred Schema Display */}
                {schemaSource === 'inferred' && isFeatureEnabled('enableSchemaInference') && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Inferred Schemas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {endpoint.actualResponse?.data && (
                                    <div>
                                        <h4 className="font-medium mb-2">Response Schema (Inferred)</h4>
                                        {renderSchemaPreview(endpoint.actualResponse.data, 'Response')}
                                    </div>
                                )}
                                
                                {!endpoint.actualResponse?.data && (
                                    <div className="text-center py-8 text-gray-500">
                                        <Database className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                                        <p>No data available to infer schemas.</p>
                                        <p className="text-sm">Try making an API call first or use manual schema definition.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}



                {/* Action Buttons */}
                <div className="flex justify-end gap-4 mt-6 pt-6 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleGenerateSchema}>
                        Generate Schema
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SchemaBuilder;
