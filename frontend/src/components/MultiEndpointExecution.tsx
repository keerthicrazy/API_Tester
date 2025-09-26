import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Download, CheckCircle, AlertCircle, Clock, FileCode, Settings, Eye, Shield, Archive, ChevronDown, ToggleLeft, Clipboard, X, Database } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { proxyApiCall } from '@/api/proxy';
import { EndpointConfigModal } from './EndpointConfigModal';
import { EndpointValidationModal } from './EndpointValidationModal';
import { ResponsePanel } from './ResponsePanel';
import { TestReportPanel } from './TestReportPanel';
import { JiraIntegration } from './JiraIntegration';
import { BitbucketIntegration } from './BitbucketIntegration';
import { isFeatureEnabled } from '@/config';
// Removed standard code generator
import { BDDCodeGenerator as BDDGenerator } from '@/utils/bddCodeGenerator';
import { getMethodColor } from '@/lib/utils';
import SchemaBuilder from './SchemaBuilder';

import { ValidationRule, Endpoint } from '@/types/validation';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Result of executing a single endpoint
interface ExecutionResult {
  endpoint: Endpoint;                              // The endpoint that was executed
  status: 'success' | 'failed' | 'pending';        // Execution result
  response?: {                                      // Response data if successful
    status: number;                                 // HTTP status code
    data: any;                                      // Response body
    headers: Record<string, any>;                   // Response headers
    responseTime: number;                           // How long the request took
  };
  error?: string;                                   // Error message if failed
  validationResults?: ValidationRule[];             // Results of validation rules
  executionTime?: number;                           // When the endpoint was executed
}

// Props for the multi-endpoint execution component
interface MultiEndpointExecutionProps {
  endpoints: Endpoint[];                            // List of endpoints to test
  onCodeGeneration: (selectedEndpoints: Endpoint[]) => void;  // Callback when generating code
}

// Main component for testing multiple API endpoints at once
export const MultiEndpointExecution: React.FC<MultiEndpointExecutionProps> = ({
  endpoints,
  onCodeGeneration
}) => {
  // State for endpoint selection and execution
  const [selectedEndpoints, setSelectedEndpoints] = useState<string[]>([]);                    // Which endpoints are selected for testing
  const [customizedEndpoints, setCustomizedEndpoints] = useState<Record<string, Endpoint>>({}); // Customized endpoint configurations
  const [endpointValidations, setEndpointValidations] = useState<Record<string, ValidationRule[]>>({}); // Validation rules for each endpoint
  
  // State for execution process
  const [isExecuting, setIsExecuting] = useState(false);                                      // Are we currently running tests?
  const [executionProgress, setExecutionProgress] = useState({ current: 0, total: 0 });        // Progress bar state
  const [executionResults, setExecutionResults] = useState<ExecutionResult[]>([]);             // Results of all test executions
  
  // State for modals and UI
  const [configModalEndpoint, setConfigModalEndpoint] = useState<Endpoint | null>(null);        // Which endpoint to show in config modal
  const [validationModalEndpoint, setValidationModalEndpoint] = useState<Endpoint | null>(null); // Which endpoint to show in validation modal
  const [selectedResponseEndpoint, setSelectedResponseEndpoint] = useState<string | null>(null); // Which endpoint response to display
  const [endpointResponses, setEndpointResponses] = useState<Record<string, any>>({});          // Store responses for each endpoint
  
  // Settings and options
  const [onlySuccessfulTests, setOnlySuccessfulTests] = useState(true);                        // Only generate code for successful tests?
  const [applyDefaultValidation, setApplyDefaultValidation] = useState(false);                 // Apply default validation rules?
  
  // Schema Builder state - for configuring response schemas
  const [showSchemaBuilder, setShowSchemaBuilder] = useState(false);                            // Show schema configuration modal?
  const [schemaBuilderEndpoint, setSchemaBuilderEndpoint] = useState<Endpoint | null>(null);    // Which endpoint to configure schemas for
  const [openAPISchemas, setOpenAPISchemas] = useState<Record<string, any>>({});               // Available OpenAPI schemas
  
  // Collection-level error schema state
  const [collectionErrorSchema, setCollectionErrorSchema] = useState<{
    enabled: boolean;
    statusCode: string;
    errorStructure: string;
  }>({
    enabled: false,
    statusCode: '400',
    errorStructure: ''
  });
  
  // Collection-level error schema modal state
  const [showCollectionErrorSchema, setShowCollectionErrorSchema] = useState(false);
  
  const { toast } = useToast();

  // Handle checkbox selection for individual endpoints
  const handleEndpointSelection = (endpointId: string, checked: boolean) => {
    setSelectedEndpoints(prev => 
      checked 
        ? [...prev, endpointId]                    // Add endpoint to selection
        : prev.filter(id => id !== endpointId)     // Remove endpoint from selection
    );
  };

  // Select or deselect all endpoints at once
  const handleSelectAll = () => {
    setSelectedEndpoints(
      selectedEndpoints.length === endpoints.length 
        ? []                                        // If all selected, deselect all
        : endpoints.map(e => e.id)                  // If not all selected, select all
    );
  };

  // Get the effective endpoint config (customized or original)
  const getEffectiveEndpoint = (endpointId: string): Endpoint => {
    const customized = customizedEndpoints[endpointId];           // Check if endpoint has custom config
    const original = endpoints.find(e => e.id === endpointId)!;  // Get original endpoint
    
    return customized || original;                               // Return custom config if exists, otherwise original
  };

  const handleConfigureEndpoint = (endpoint: Endpoint) => {
    const effectiveEndpoint = getEffectiveEndpoint(endpoint.id);
    setConfigModalEndpoint(effectiveEndpoint);
  };

  const handleValidateEndpoint = (endpoint: Endpoint) => {
    setValidationModalEndpoint(endpoint);
  };

  const handleSaveEndpointConfig = (updatedEndpoint: Endpoint) => {
    setCustomizedEndpoints(prev => ({
      ...prev,
      [updatedEndpoint.id]: updatedEndpoint
    }));
    setConfigModalEndpoint(null);
    toast({
      title: "Configuration Saved",
      description: `Configuration for ${updatedEndpoint.name} has been saved.`,
    });
  };

  // Schema Builder handlers
  const handleOpenSchemaBuilder = (endpoint: Endpoint) => {
    setSchemaBuilderEndpoint(endpoint);
    setShowSchemaBuilder(true);
  };

  const handleSchemaGenerated = (schemas: any) => {
    if (schemaBuilderEndpoint) {
      if (schemas.response === null) {
        // Clear the schema
        const updatedEndpoint = {
          ...schemaBuilderEndpoint,
          responseSchema: undefined,
          schemaSource: undefined,
          errorSchema: undefined
        };
        
        setCustomizedEndpoints(prev => ({
          ...prev,
          [updatedEndpoint.id]: updatedEndpoint
        }));
        
        toast({
          title: "Schema Cleared",
          description: `Response and error schemas have been cleared for ${schemaBuilderEndpoint.name}.`,
        });
      } else {
        // Update the endpoint with the generated schemas
        const updatedEndpoint = {
          ...schemaBuilderEndpoint,
          responseSchema: schemas.response,
          schemaSource: schemas.source,
          errorSchema: schemas.error
        };
        
        setCustomizedEndpoints(prev => ({
          ...prev,
          [updatedEndpoint.id]: updatedEndpoint
        }));
        
        // Show appropriate toast message
        let description = `${schemas.source} response schema has been generated for ${schemaBuilderEndpoint.name}.`;
        if (schemas.error) {
          description += ` Error schema also configured.`;
        }
        
        toast({
          title: "Schema Generated",
          description: description,
        });
      }
      
      setShowSchemaBuilder(false);
      setSchemaBuilderEndpoint(null);
    }
  };

  const handleCloseSchemaBuilder = () => {
    setShowSchemaBuilder(false);
    setSchemaBuilderEndpoint(null);
  };

  const handleSaveValidationRules = (endpointId: string, rules: ValidationRule[]) => {
    setEndpointValidations(prev => ({
      ...prev,
      [endpointId]: rules
    }));
    
    toast({
      title: "Validation rules saved",
      description: `Added ${rules.length} validation rules`,
    });
  };

  const validateResponse = (response: any, rules: ValidationRule[]): ValidationRule[] => {
    return rules.map(rule => {
      let result: 'pass' | 'fail' = 'fail';
      let message = '';

      switch (rule.type) {
        case 'status':
          const expectedStatus = parseInt(rule.expectedValue || '200');
          result = response.status === expectedStatus ? 'pass' : 'fail';
          message = result === 'pass' 
            ? `Status ${response.status} matches expected ${expectedStatus}`
            : `Status ${response.status} does not match expected ${expectedStatus}`;
          break;

        case 'value':
          const actualValue = getNestedValue(response.data, rule.field || '');
          const expectedValue = rule.expectedValue;
          const condition = rule.condition || 'equals';
          
          let convertedExpected: any = expectedValue;
          if (expectedValue === 'true') convertedExpected = true;
          if (expectedValue === 'false') convertedExpected = false;
          
          let passed = false;
          switch (condition) {
            case 'equals':
              passed = actualValue == convertedExpected;
              break;
            case 'not_equals':
              passed = actualValue != convertedExpected;
              break;
            case 'contains':
              passed = String(actualValue).includes(String(expectedValue));
              break;
            case 'starts_with':
              passed = String(actualValue).startsWith(String(expectedValue));
              break;
            case 'ends_with':
              passed = String(actualValue).endsWith(String(expectedValue));
              break;
            default:
              passed = actualValue == convertedExpected;
          }
          
          result = passed ? 'pass' : 'fail';
          message = passed
            ? `${rule.field} ${condition} ${expectedValue}`
            : `${rule.field} is ${JSON.stringify(actualValue)}, expected ${condition} ${expectedValue}`;
          break;

        case 'existence':
          const value = getNestedValue(response.data, rule.field || '');
          const existenceCondition = rule.condition || 'is_not_empty';
          
          let exists = false;
          switch (existenceCondition) {
            case 'is_empty':
              exists = value === '' || value === null || value === undefined;
              break;
            case 'is_not_empty':
              exists = value !== '' && value !== null && value !== undefined;
              break;
            case 'is_null':
              exists = value === null || value === undefined;
              break;
            case 'is_not_null':
              exists = value !== null && value !== undefined;
              break;
            default:
              exists = value !== '' && value !== null && value !== undefined;
          }
          
          result = exists ? 'pass' : 'fail';
          message = exists
            ? `${rule.field} ${existenceCondition}`
            : `${rule.field} does not ${existenceCondition}`;
          break;
      }

      return { ...rule, result, message };
    });
  };

  const getNestedValue = (obj: any, path: string): any => {
    try {
      return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : undefined;
      }, obj);
    } catch {
      return undefined;
    }
  };

  const executeSelectedEndpoints = async () => {
    if (selectedEndpoints.length === 0) {
      toast({
        title: "No endpoints selected",
        description: "Please select at least one endpoint to execute",
        variant: "destructive",
      });
      return;
    }

    // Check if validation rules are required
    const endpointsWithoutValidation = selectedEndpoints.filter(endpointId => {
      const validationRules = endpointValidations[endpointId] || [];
      return validationRules.length === 0;
    });

    if (endpointsWithoutValidation.length > 0 && !applyDefaultValidation) {
      toast({
        title: "Validation rules required",
        description: "At least one validation rule is required to run the API. Enable 'Apply Default Validation' or add custom validation rules.",
        variant: "destructive",
      });
      return;
    }

    setIsExecuting(true);
    setExecutionResults([]);
    setEndpointResponses({});
    setExecutionProgress({ current: 0, total: selectedEndpoints.length });
    
    const results: ExecutionResult[] = [];
    const responses: Record<string, any> = {};

    for (let i = 0; i < selectedEndpoints.length; i++) {
      const endpointId = selectedEndpoints[i];
      setExecutionProgress({ current: i + 1, total: selectedEndpoints.length });
      const endpoint = getEffectiveEndpoint(endpointId);
      let validationRules = endpointValidations[endpointId] || [];
      
      // Apply default validation if enabled and no custom validation exists
      if (validationRules.length === 0 && applyDefaultValidation) {
        validationRules = [{
          id: `default-${endpointId}`,
          type: 'status',
          field: 'status',
          expectedValue: '200',
          result: 'pass',
          message: 'Default status code validation'
        }];
      }
      
      try {
        const startTime = performance.now();
        
        const response = await proxyApiCall({
          method: endpoint.method,
          url: endpoint.url,
          headers: endpoint.headers,
          body: endpoint.body,
        });
        
        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);

        // Store the response for display
        const apiResponse = {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers || {},
          data: response.data,
          responseTime,
        };
        responses[endpointId] = apiResponse;

        // Run validations if any are defined
        let validationResults: ValidationRule[] = [];
        if (validationRules.length > 0) {
          validationResults = validateResponse(response, validationRules);
        }

        const validationPassed = validationResults.filter(r => r.result === 'pass').length;
        const validationTotal = validationResults.length;

        results.push({
          endpoint,
          status: 'success',
          response: {
            status: response.status,
            data: response.data,
            headers: response.headers || {},
            responseTime: responseTime
          },
          validationResults,
        });

      } catch (error) {
        results.push({
          endpoint,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          validationResults: [],
        });
      }
    }

    setExecutionResults(results);
    setEndpointResponses(responses);
    setIsExecuting(false);

    const successCount = results.filter(r => r.status === 'success').length;
    const totalValidationsPassed = results.reduce((sum, r) => sum + (r.validationResults?.filter(v => v.result === 'pass').length || 0), 0);
    const totalValidations = results.reduce((sum, r) => sum + (r.validationResults?.length || 0), 0);
    
    toast({
      title: "Execution completed",
      description: `${successCount}/${results.length} requests succeeded. ${totalValidationsPassed}/${totalValidations} validations passed.`,
    });
  };

  // Removed standard/karate multi-endpoint generator (keeping BDD only)

  const handleCodeGeneration = () => {
    // Only generate code for successfully executed endpoints
    const successfulResults = executionResults.filter(result => result.status === 'success');
    
    if (successfulResults.length === 0) {
      toast({
        title: "No successful tests",
        description: "Please execute endpoints successfully before generating code",
        variant: "destructive",
      });
      return;
    }
    
    const successfulEndpointObjects = successfulResults.map(result => result.endpoint);
    onCodeGeneration(successfulEndpointObjects);
  };

  const handleBDDCodeGeneration = async () => {
    // Filter results based on toggle setting
    const eligibleResults = onlySuccessfulTests 
      ? executionResults.filter(result => result.status === 'success')
      : executionResults;
    
    const eligibleEndpoints = eligibleResults.map(result => result.endpoint.id);

    if (eligibleEndpoints.length === 0) {
      const message = onlySuccessfulTests 
        ? "Please execute endpoints successfully before generating BDD code"
        : "Please execute endpoints before generating BDD code";
      toast({
        title: "No eligible tests",
        description: message,
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Generating BDD code...",
        description: "Creating OCBC test framework code for selected endpoints",
      });

      const selectedEndpointData = endpoints
        .filter(e => eligibleEndpoints.includes(e.id))
        .map(endpoint => {
          const effectiveEndpoint = getEffectiveEndpoint(endpoint.id);
          const executionResult = executionResults.find(r => r.endpoint.id === endpoint.id);
          
          return {
            method: effectiveEndpoint.method,
            path: effectiveEndpoint.url, // Use URL as path
            name: effectiveEndpoint.name,
            description: effectiveEndpoint.description,
            requestBody: effectiveEndpoint.body ? JSON.parse(effectiveEndpoint.body) : undefined,
            responseBody: executionResult?.response?.data,
            actualResponse: executionResult?.response,
            validationRules: (endpointValidations[endpoint.id] || []).map(rule => ({
              type: rule.type,
              field: rule.field,
              expectedValue: rule.expectedValue || '',
            })),
            url: effectiveEndpoint.url,
            headers: effectiveEndpoint.headers,
            customizableFields: effectiveEndpoint.customizableFields, // Add customizableFields
            endpointName: effectiveEndpoint.endpointName, // Add endpointName for BDD generation
            errorSchema: effectiveEndpoint.errorSchema || (collectionErrorSchema.enabled ? collectionErrorSchema : undefined), // Use endpoint error schema or fall back to collection error schema
          };
        });

        // Generate BDD code
        const bddGenerator = new BDDGenerator();
        const code = bddGenerator.generateCode(selectedEndpointData, {
          endpointName: selectedEndpointData[0]?.endpointName || '',
          basePackage: 'com.ocbc.api'
        });
        
        // Create ZIP with generated code
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        
        // Add feature files
        code.featureFiles.forEach(file => {
          zip.file(`src/test/resources/features/${file.name}`, file.content);
        });

        // Add step definitions
        code.stepDefinitions.forEach(file => {
          zip.file(`src/test/java/com/example/api/steps/${file.name}`, file.content);
        });

        // Add service classes
        code.serviceClasses.forEach(file => {
          zip.file(`src/test/java/com/example/api/service/${file.name}`, file.content);
        });

        // Add POJOs
        code.pojos.forEach(file => {
          zip.file(`src/main/java/com/example/api/model/${file.name}`, file.content);
        });

        // Download ZIP
        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bdd-test-suite.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

      toast({
        title: "BDD Code Generated!",
        description: `Generated ${code.featureFiles.length} feature files, ${code.stepDefinitions.length} step definitions, ${code.serviceClasses.length} service classes, and ${code.pojos.length} POJOs.`,
      });
    } catch (error) {
      console.error('BDD code generation failed:', error);
      toast({
        title: "Generation failed",
        description: "Unable to generate BDD code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBulkHeadersApply = () => {
    // Function removed - no longer needed
  };

  const handleBulkHeadersClear = () => {
    // Function removed - no longer needed
  };

  const copyHeadersFromEndpoint = (endpoint: Endpoint) => {
    // Function removed - no longer needed
  };

  const getStatusIcon = (result: ExecutionResult) => {
    if (result.status === 'success') {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    return <AlertCircle className="w-4 h-4 text-red-600" />;
  };

  const getStatusBadge = (result: ExecutionResult) => {
    if (result.status === 'success' && result.response) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          {result.response.status}
        </Badge>
      );
    }
    if (result.status === 'failed') {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          Error
        </Badge>
      );
    }
    return null;
  };

  const getValidationBadge = (result: ExecutionResult) => {
    const validationTotal = result.validationResults?.length || 0;
    if (validationTotal === 0) return null;
    
    const validationPassed = result.validationResults?.filter(v => v.result === 'pass').length || 0;
    const allPassed = validationPassed === validationTotal;
    return (
      <Badge className={`${allPassed ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}>
        {validationPassed}/{validationTotal} validations
      </Badge>
    );
  };

  const hasCustomizations = (endpointId: string) => {
    return customizedEndpoints[endpointId] !== undefined;
  };

  const hasValidations = (endpointId: string) => {
    return endpointValidations[endpointId] && endpointValidations[endpointId].length > 0;
  };

  const handleViewResponse = (endpointId: string) => {
    setSelectedResponseEndpoint(endpointId);
  };

  if (endpoints.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <p>No endpoints imported yet. Use Smart Import to load API collections.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Panel - Endpoint Selection and Execution */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Play className="w-5 h-5 mr-2" />
                  Multi-Endpoint Execution
                </span>
                <Badge variant="outline">
                  {selectedEndpoints.length}/{endpoints.length} selected
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selection Controls */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedEndpoints.length === endpoints.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  
                  {/* Collection Error Schema Button */}
                  {isFeatureEnabled('enableCollectionSchema') && (
                    <Button
                      variant={collectionErrorSchema.enabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowCollectionErrorSchema(true)}
                      className={`flex items-center space-x-1 ${
                        collectionErrorSchema.enabled 
                          ? "bg-orange-600 hover:bg-orange-700 text-white" 
                          : ""
                      }`}
                    >
                      <Database className="w-3 h-3" />
                      <span>Collection Error Schema</span>
                      {collectionErrorSchema.enabled && (
                        <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800 text-xs">
                          {collectionErrorSchema.statusCode}
                        </Badge>
                      )}
                    </Button>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={executeSelectedEndpoints}
                    disabled={selectedEndpoints.length === 0 || isExecuting}
                    className="flex items-center"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    {isExecuting ? 'Running...' : 'Run Selected'}
                  </Button>
                  {/* Removed standard code generation button */}
                  {/* {isFeatureEnabled('bddCodeGeneration') && (
                    <Button
                      variant="outline"
                      onClick={handleBDDCodeGeneration}
                      disabled={executionResults.filter(r => r.status === 'success').length === 0}
                      className="flex items-center"
                    >
                      <Coffee className="w-4 h-4 mr-1" />
                      Generate BDD
                    </Button>
                  )} */}
                </div>
              </div>



              {/* Default Validation Toggle - show when endpoints are selected */}
              {selectedEndpoints.length > 0 && (
                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <ToggleLeft className="w-4 h-4 text-blue-600" />
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={applyDefaultValidation}
                      onCheckedChange={(checked) => setApplyDefaultValidation(checked as boolean)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <div>
                      <label className="text-sm font-medium text-gray-900 cursor-pointer">
                        Apply Default Validation
                      </label>
                      <p className="text-xs text-gray-600">
                        Automatically adds Status Code = 200 validation to APIs without custom validation rules
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Integration buttons - show after execution */}
              {executionResults.length > 0 && (
                <div className="flex gap-4">
                  <JiraIntegration 
                    results={executionResults}
                    collectionName="API Test Collection"
                  />
                  <BitbucketIntegration 
                    endpoints={selectedEndpoints.map(id => getEffectiveEndpoint(id))}
                    collectionName="API Test Collection"
                  />
                </div>
              )}

              {/* Endpoint List with improved scroll handling */}
              <div className="border rounded-lg overflow-hidden">
                <ScrollArea className="h-[400px]">
                  <div className="p-4 space-y-3">
                    {endpoints.map((endpoint) => {
                      const isSelected = selectedEndpoints.includes(endpoint.id);
                      const isCustomized = hasCustomizations(endpoint.id);
                      const hasValidationRules = hasValidations(endpoint.id);
                      const effectiveEndpoint = getEffectiveEndpoint(endpoint.id);
                      const hasResponse = endpointResponses[endpoint.id];
                      
                      return (
                        <div key={endpoint.id} className={`p-3 rounded-lg border ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => 
                                handleEndpointSelection(endpoint.id, checked as boolean)
                              }
                              className="mt-1"
                            />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge className={`font-mono text-xs border ${getMethodColor(effectiveEndpoint.method)}`}>
                                  {effectiveEndpoint.method}
                                </Badge>
                                <span className="font-medium">{effectiveEndpoint.name}</span>
                                {isCustomized && (
                                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                                    Modified
                                  </Badge>
                                )}
                                {hasValidationRules && (
                                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                    {endpointValidations[endpoint.id].length} rules
                                  </Badge>
                                )}
                                {(effectiveEndpoint as any).responseSchema && (
                                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                    Response Schema
                                  </Badge>
                                )}
                                {(effectiveEndpoint as any).errorSchema && (
                                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                                    Error Schema
                                  </Badge>
                                )}
                                {(effectiveEndpoint as any).customizableFields && (effectiveEndpoint as any).customizableFields.size > 0 && (
                                  <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                                    {`${(effectiveEndpoint as any).customizableFields.size} Fields`}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 truncate mb-2">{effectiveEndpoint.url}</p>
                              
                              {isSelected && (
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant={isCustomized ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleConfigureEndpoint(endpoint)}
                                    className={`flex items-center space-x-1 ${
                                      isCustomized 
                                        ? "bg-purple-600 hover:bg-purple-700 text-white" 
                                        : ""
                                    }`}
                                  >
                                    <Settings className="w-3 h-3" />
                                    <span>Configure</span>
                                  </Button>
                                  
                                  {isFeatureEnabled('enableCollectionSchema') && (
                                    <Button
                                      variant={((effectiveEndpoint as any).responseSchema || (effectiveEndpoint as any).errorSchema) ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => handleOpenSchemaBuilder(endpoint)}
                                      className={`flex items-center space-x-1 ${
                                        ((effectiveEndpoint as any).responseSchema || (effectiveEndpoint as any).errorSchema)
                                          ? "bg-green-600 hover:bg-green-700 text-white" 
                                          : ""
                                      }`}
                                    >
                                      <Database className="w-3 h-3" />
                                      <span>Schema</span>
                                    </Button>
                                  )}
                                  
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleValidateEndpoint(endpoint)}
                                    className="flex items-center space-x-1"
                                  >
                                    <Shield className="w-3 h-3" />
                                    <span>Validation</span>
                                  </Button>

                                  {hasResponse && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleViewResponse(endpoint.id)}
                                      className="flex items-center space-x-1"
                                    >
                                      <Eye className="w-3 h-3" />
                                      <span>View Response</span>
                                    </Button>
                                  )}
                                  
                                  {effectiveEndpoint.headers && typeof effectiveEndpoint.headers === 'object' && Object.keys(effectiveEndpoint.headers).length > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      {Object.keys(effectiveEndpoint.headers).length} headers
                                    </Badge>
                                  )}
                                  
                                  {effectiveEndpoint.body && (
                                    <Badge variant="outline" className="text-xs">
                                      Has body
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* Execution Result */}
                            {executionResults.find(r => r.endpoint.id === endpoint.id) && (
                              <div className="flex flex-col items-end space-y-1">
                                {(() => {
                                  const result = executionResults.find(r => r.endpoint.id === endpoint.id)!;
                                  return (
                                    <>
                                      <div className="flex items-center space-x-2">
                                        {getStatusIcon(result)}
                                        {getStatusBadge(result)}
                        {result.response?.responseTime && (
                          <Badge variant="outline" className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {result.response.responseTime}ms
                          </Badge>
                        )}
                                      </div>
                                      {getValidationBadge(result) && (
                                        <div>{getValidationBadge(result)}</div>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              {/* Test Code Generation Section - Collapsible (BDD only) */}
              {(executionResults.length > 0) && (isFeatureEnabled('bddCodeGeneration')) && (
                <div className="mt-4 space-y-4">
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Card className="border-2 border-dashed border-blue-200 bg-blue-50 cursor-pointer hover:bg-blue-100/50 transition-colors">
                         <CardHeader>
                           <CardTitle className="flex items-center justify-between">
                             <span className="flex items-center text-blue-800">
                               <FileCode className="w-5 h-5 mr-2" />
                               Generate Combined Test Suite
                             </span>
                             <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="bg-blue-100 text-blue-700">
                                  {onlySuccessfulTests 
                                    ? `${executionResults.filter(r => r.status === 'success').length}/${executionResults.length} successful`
                                    : `${executionResults.length} executed`
                                  }
                                </Badge>
                                <Badge variant="outline" className="bg-green-100 text-green-700">BDD</Badge>
                               <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                             </div>
                           </CardTitle>
                         </CardHeader>
                       </Card>
                     </CollapsibleTrigger>
                     <CollapsibleContent>
                       <Card className="border-2 border-dashed border-blue-200 bg-blue-50 mt-2">
                         <CardContent className="pt-6">
                           <div className="flex items-center justify-between mb-4">
                             <p className="text-sm text-blue-700">
                               Generate automated test code with their validation rules:
                             </p>
                             <div className="flex items-center space-x-2">
                               <ToggleLeft className="w-4 h-4 text-blue-600" />
                               <label className="text-xs text-blue-700">
                                 <input
                                   type="checkbox"
                                   checked={onlySuccessfulTests}
                                   onChange={(e) => setOnlySuccessfulTests(e.target.checked)}
                                   className="mr-1"
                                 />
                                 Only successful tests
                               </label>
                             </div>
                           </div>
                           
                            <div className="grid grid-cols-1 gap-4">
                              {isFeatureEnabled('bddCodeGeneration') && (
                               <Button
                                 onClick={handleBDDCodeGeneration}
                                 className="flex items-center justify-center h-20 flex-col space-y-2 bg-green-600 hover:bg-green-700"
                               >
                                 <div className="flex items-center">
                                    <Shield className="w-5 h-5 mr-2" />
                                   <span className="font-semibold">BDD Framework</span>
                                 </div>
                                 <div className="text-xs text-center">
                                   Feature + Step Definitions
                                 </div>
                                 <div className="flex items-center text-xs">
                                   <Archive className="w-3 h-3 mr-1" />
                                   ZIP download
                                 </div>
                               </Button>
                             )}
                           </div>

                            <div className="mt-4 p-3 bg-white rounded-md border">
                             <h4 className="text-sm font-medium mb-2">Generated Test Suite Will Include:</h4>
                             <ul className="text-xs text-gray-600 space-y-1">
                               <li>• Test files for {onlySuccessfulTests 
                                 ? executionResults.filter(r => r.status === 'success').length 
                                 : executionResults.length} {onlySuccessfulTests ? 'successful' : 'executed'} endpoints</li>
                               <li>• All configured validation rules per endpoint</li>
                               {isFeatureEnabled('bddCodeGeneration') && (
                                 <li>• BDD Feature files with Step Definitions</li>
                               )}
                               <li>• Ready-to-run test automation code</li>
                             </ul>
                           </div>
                         </CardContent>
                       </Card>
                     </CollapsibleContent>
                   </Collapsible>

                  {/* Test Report Panel */}
                  {isFeatureEnabled('reporting') && (
                    <TestReportPanel 
                      results={executionResults as any}
                      collectionName="API Collection Test"
                    />
                  )}
                </div>
              )}

              {isExecuting && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">
                    Executing endpoints... ({executionProgress.current}/{executionProgress.total})
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Response Viewer */}
        <div className="xl:col-span-1">
          {selectedResponseEndpoint && endpointResponses[selectedResponseEndpoint] ? (
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Response</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedResponseEndpoint(null)}
                  >
                    Close
                  </Button>
                </CardTitle>
                <div className="text-sm text-gray-600">
                  {endpoints.find(e => e.id === selectedResponseEndpoint)?.name}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ResponsePanel
                  response={endpointResponses[selectedResponseEndpoint]}
                  loading={false}
                  requestConfig={null}
                  validationRules={endpointValidations[selectedResponseEndpoint] as any || []}
                  showResponse={true}
                  showValidation={false}
                  showCodeGen={false}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="h-fit">
              <CardContent className="p-6">
                <div className="text-center text-gray-500">
                  <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">Click an endpoint view response</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Configuration Modal */}
      {configModalEndpoint && (
        <EndpointConfigModal
          endpoint={configModalEndpoint}
          isOpen={true}
          onClose={() => setConfigModalEndpoint(null)}
          onSave={handleSaveEndpointConfig}
        />
      )}

      {/* Validation Modal */}
      {validationModalEndpoint && (
        <EndpointValidationModal
          endpoint={validationModalEndpoint}
          existingRules={endpointValidations[validationModalEndpoint.id] || []}
          isOpen={true}
          onClose={() => setValidationModalEndpoint(null)}
          onSave={(rules) => handleSaveValidationRules(validationModalEndpoint.id, rules)}
        />
      )}

      {/* Schema Builder Modal */}
      {showSchemaBuilder && schemaBuilderEndpoint && (
        <SchemaBuilder
          endpoint={schemaBuilderEndpoint}
          openAPISchemas={openAPISchemas}
          onSchemaGenerated={handleSchemaGenerated}
          onClose={handleCloseSchemaBuilder}
        />
      )}

      {/* Collection Error Schema Modal */}
      {showCollectionErrorSchema && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">Collection Error Schema Configuration</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Configure error schema that will apply to all endpoints in this collection
                </p>
              </div>
              <Button variant="outline" onClick={() => setShowCollectionErrorSchema(false)}>
                ✕
              </Button>
            </div>

            <div className="space-y-6">
              {/* Enable Error Testing */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enable-collection-error-testing"
                  checked={collectionErrorSchema.enabled}
                  onCheckedChange={(checked) => setCollectionErrorSchema(prev => ({ ...prev, enabled: checked as boolean }))}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="enable-collection-error-testing" className="font-medium">
                  Enable Collection Error Testing
                </Label>
              </div>

              {collectionErrorSchema.enabled && (
                <div className="space-y-4 pl-6 border-l-2 border-orange-200">
                  {/* Status Code */}
                  <div>
                    <Label htmlFor="collection-error-status-code">Expected Error Status Code</Label>
                    <Select 
                      value={collectionErrorSchema.statusCode} 
                      onValueChange={(value) => setCollectionErrorSchema(prev => ({ ...prev, statusCode: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select status code" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="400">400 - Bad Request</SelectItem>
                        <SelectItem value="401">401 - Unauthorized</SelectItem>
                        <SelectItem value="403">403 - Forbidden</SelectItem>
                        <SelectItem value="404">404 - Not Found</SelectItem>
                        <SelectItem value="409">409 - Conflict</SelectItem>
                        <SelectItem value="422">422 - Unprocessable Entity</SelectItem>
                        <SelectItem value="500">500 - Internal Server Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Error Structure */}
                  <div>
                    <Label htmlFor="collection-error-structure">Error Response Structure (JSON)</Label>
                    <Textarea
                      id="collection-error-structure"
                      value={collectionErrorSchema.errorStructure}
                      onChange={(e) => setCollectionErrorSchema(prev => ({ ...prev, errorStructure: e.target.value }))}
                      placeholder="Enter error response JSON structure..."
                      rows={4}
                      className="mt-1"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Define the structure of error responses (e.g., error: message, statusCode: 400)
                    </p>
                  </div>
                </div>
              )}

              {/* Current Collection Error Schema Preview */}
              {collectionErrorSchema.enabled && (
                <div className="mt-4 p-3 bg-orange-50 rounded border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-sm text-orange-800">Collection Error Schema:</h5>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setCollectionErrorSchema({ enabled: false, statusCode: '400', errorStructure: '' })}
                      className="text-orange-600 hover:text-orange-700 text-xs"
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="text-xs text-orange-700">
                    <div><strong>Status Code:</strong> {collectionErrorSchema.statusCode}</div>
                    {collectionErrorSchema.errorStructure && (
                      <div><strong>Structure:</strong> {collectionErrorSchema.errorStructure}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-6 pt-6 border-t">
              <Button variant="outline" onClick={() => setShowCollectionErrorSchema(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowCollectionErrorSchema(false)}>
                Save Collection Error Schema
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
