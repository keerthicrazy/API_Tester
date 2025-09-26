import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileCode, Download, Settings, Code, FileText, Database, Layers, Copy, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isFeatureEnabled } from '@/config';
import { BDDCodeGenerator as BDDGenerator, Endpoint, GeneratedCode } from '@/utils/bddCodeGenerator';
import JSZip from 'jszip';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';


// Props for the BDD code generator component
interface BDDCodeGeneratorProps {
  endpoints: Endpoint[];  // List of API endpoints to generate code for
}

// Main component that generates BDD test code from API endpoints
export const BDDCodeGenerator: React.FC<BDDCodeGeneratorProps> = ({ endpoints }) => {
  // State for generated code and UI
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);  // The generated BDD code
  const [isGenerating, setIsGenerating] = useState(false);                         // Loading state while generating
  const [copyStates, setCopyStates] = useState<Record<string, boolean>>({});      // Which copy buttons are clicked
  
  // State for request body field customization
  const [customizableFields, setCustomizableFields] = useState<Record<string, Set<string>>>({});  // Which fields can be customized
  const [showFieldConfig, setShowFieldConfig] = useState(false);                                 // Show field configuration modal
  
  // State for error schema configuration
  const [showErrorSchema, setShowErrorSchema] = useState(false);                                 // Show error schema modal
  const [errorSchema, setErrorSchema] = useState<{
    statusCode: string;        // Expected error status code (e.g., 400, 404)
    errorStructure: string;    // JSON structure of error response
    enabled: boolean;          // Whether to generate error test cases
  }>({
    statusCode: '400',
    errorStructure: '',
    enabled: false
  });
  

  
  // Configuration for code generation
  const [config, setConfig] = useState({
    basePackage: 'com.ocbc.api',    // Java package name
    endpointName: '',                // Default endpoint name for generated classes (empty)
    useLombok: true,                 // Use Lombok annotations for cleaner code
    generatePOJOs: false,            // POJOs are embedded in service classes
    generateServiceClasses: true,    // Create service classes for API calls
    generateStepDefinitions: true,   // Create Cucumber step definitions
    generateFeatureFiles: true,      // Create Gherkin feature files
  });
  const { toast } = useToast();

  // Copies generated code to clipboard with visual feedback
  const copyToClipboard = async (text: string, fileName: string, buttonId?: string) => {
    try {
      // Show button is clicked (visual feedback)
      if (buttonId) {
        setCopyStates(prev => ({ ...prev, [buttonId]: true }));
      }

      // Try modern clipboard API first (works in secure contexts)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        toast({
          title: "Copied to clipboard",
          description: `${fileName} copied successfully`,
        });
      } else {
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
              description: `${fileName} copied successfully`,
            });
          } else {
            throw new Error('execCommand failed');
          }
        } catch (err) {
          throw new Error('Copy failed');
        } finally {
          document.body.removeChild(textArea);
        }
      }

      // Reset button state after 1 second
      if (buttonId) {
        setTimeout(() => {
          setCopyStates(prev => ({ ...prev, [buttonId]: false }));
        }, 1000);
      }
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please copy manually or check browser permissions",
        variant: "destructive",
      });
      // Reset button state on error
      if (buttonId) {
        setCopyStates(prev => ({ ...prev, [buttonId]: false }));
      }
    }
  };

  // Reset all field configurations
  const resetAllFields = () => {
    setCustomizableFields({});
    toast({
      title: "Fields Reset",
      description: "All field configurations have been reset to default values.",
    });
  };

  // Check if BDD feature is enabled
  if (!isFeatureEnabled('bddCodeGeneration')) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            BDD Framework Code Generation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Badge variant="secondary" className="mb-4">
              Feature Disabled
            </Badge>
            <p className="text-muted-foreground">
              BDD code generation is currently disabled. Enable it in the configuration to generate OCBC test framework code.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleGenerateCode = async () => {
    if (endpoints.length === 0) {
      toast({
        title: "No endpoints available",
        description: "Please import or add some API endpoints first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Apply customizable fields and error schema to endpoints
      const endpointsWithCustomFields = endpoints.map(endpoint => {
        const endpointKey = `${endpoint.method}-${endpoint.path}`;
        const customFields = customizableFields[endpointKey];
        
        return {
          ...endpoint,
          customizableFields: customFields || new Set(),
          errorSchema: errorSchema.enabled ? {
            enabled: errorSchema.enabled,
            statusCode: errorSchema.statusCode,
            errorStructure: errorSchema.errorStructure
          } : undefined
        };
      });

      const generator = new BDDGenerator();
      const code = generator.generateCode(endpointsWithCustomFields, {
        endpointName: config.endpointName,
        basePackage: config.basePackage
      });
      setGeneratedCode(code);
      
      toast({
        title: "OCBC BDD Code Generated",
        description: `Generated ${code.featureFiles.length} feature files, ${code.stepDefinitions.length} step definitions, ${code.serviceClasses.length} service classes with embedded POJOs.`,
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate OCBC BDD code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadAll = () => {
    if (!generatedCode) return;

    const allFiles = [
      ...generatedCode.featureFiles,
      ...generatedCode.stepDefinitions,
      ...generatedCode.serviceClasses,
    ];

    const zip = new JSZip();
    
    // Add feature files to features folder
    generatedCode.featureFiles.forEach(file => {
      zip.file(`src/test/resources/features/${file.name}`, file.content);
    });

    // Add step definitions to steps folder
    generatedCode.stepDefinitions.forEach(file => {
      zip.file(`src/test/java/${config.basePackage.replace(/\./g, '/')}/steps/${file.name}`, file.content);
    });

    // Add service classes to service folder (POJOs are embedded)
    generatedCode.serviceClasses.forEach(file => {
      zip.file(`src/test/java/${config.basePackage.replace(/\./g, '/')}/service/${file.name}`, file.content);
    });

    // Generate and download
    zip.generateAsync({ type: 'blob' }).then(content => {
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ocbc-bdd-framework-code.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    toast({
      title: "Download Complete",
      description: "OCBC BDD framework code has been downloaded as a ZIP file.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCode className="h-5 w-5" />
          BDD Framework Code Generation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <h3 className="text-sm font-medium">Package Configuration</h3>
            </div>
            
            {/* Configure Request Fields Button - Always visible */}
            <div className="flex items-center gap-2">
              <Button
                variant={Object.keys(customizableFields).length > 0 ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFieldConfig(true)}
                className={`flex items-center space-x-1 ${
                  Object.keys(customizableFields).length > 0 
                    ? "bg-green-600 hover:bg-green-700 text-white" 
                    : ""
                }`}
              >
                <Database className="w-3 h-3" />
                <span>Configure Request Fields</span>
              </Button>
              
              {/* Error Schema Button */}
              <Button
                variant={errorSchema.enabled ? "default" : "outline"}
                size="sm"
                onClick={() => setShowErrorSchema(true)}
                className={`flex items-center space-x-1 ${
                  errorSchema.enabled 
                    ? "bg-green-600 hover:bg-green-700 text-white" 
                    : ""
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Error Schema</span>
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="basePackage">Base Package</Label>
              <Input
                id="basePackage"
                value={config.basePackage}
                onChange={(e) => setConfig({ ...config, basePackage: e.target.value })}
                placeholder="com.ocbc.api"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endpointName">Endpoint Name</Label>
              <Input
                id="endpointName"
                value={config.endpointName}
                onChange={(e) => setConfig({ ...config, endpointName: e.target.value })}
                placeholder="Enter custom endpoint name (optional)"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use auto-generated names, or enter a custom name for consistent naming
              </p>
            </div>
          </div>
        </div>



        {/* No Field Configuration Message */}
        {Object.keys(customizableFields).length === 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <h3 className="text-sm font-medium">Field Configuration</h3>
            </div>
            
            <div className="p-3 border rounded-lg bg-gray-50">
              <div className="text-xs text-muted-foreground text-center">
                <p className="mb-1">No field configuration set yet.</p>
                <p>Click "Configure Request Fields" to set up which request body fields should be parameterized vs. use default values.</p>
                <p className="mt-1 text-xs">
                  💡 <strong>Tip:</strong> Configure fields before making API calls to ensure proper BDD code generation.
                </p>
              </div>
            </div>
          </div>
        )}



        {/* Generate Button */}
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleGenerateCode}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <FileCode className="h-4 w-4" />
                Generate Code
              </>
            )}
          </Button>
          
          {generatedCode && (
            <>
              <Button 
                onClick={handleDownloadAll}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download All
              </Button>
            </>
          )}
        </div>

        {/* Generated Code Preview */}
        {generatedCode && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <h3 className="text-sm font-medium">Generated Code Preview</h3>
            </div>

            <Tabs defaultValue="features" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="features" className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Features ({generatedCode.featureFiles.length})
                </TabsTrigger>
                <TabsTrigger value="steps" className="flex items-center gap-1">
                  <Code className="h-3 w-3" />
                  Steps ({generatedCode.stepDefinitions.length})
                </TabsTrigger>
                <TabsTrigger value="services" className="flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  Services ({generatedCode.serviceClasses.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="features" className="mt-4">
                <div className="border rounded-md overflow-hidden">
                  <div className="flex items-center justify-between p-3 border-b bg-muted/50">
                    <span className="text-sm font-medium">Feature Files</span>
                  </div>
                  <ScrollArea className="h-80 w-full">
                    <div className="p-4 space-y-4">
                      {generatedCode.featureFiles.map((file, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">{file.name}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(file.content, file.name, `copyFeatureFileButton-${index}`)}
                              className="h-6 px-2 text-xs hover:bg-muted"
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              {copyStates[`copyFeatureFileButton-${index}`] ? 'Copied!' : 'Copy'}
                            </Button>
                          </div>
                          <div className="bg-muted rounded-md overflow-hidden">
                            <pre className="text-xs p-4 overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words max-w-full font-mono">
                              <code className="block">{file.content}</code>
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>

              <TabsContent value="steps" className="mt-4">
                <div className="border rounded-md overflow-hidden">
                  <div className="flex items-center justify-between p-3 border-b bg-muted/50">
                    <span className="text-sm font-medium">Step Definitions</span>
                  </div>
                  <ScrollArea className="h-80 w-full">
                    <div className="p-4 space-y-4">
                      {generatedCode.stepDefinitions.map((file, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">{file.name}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(file.content, file.name, `copyStepDefinitionButton-${index}`)}
                              className="h-6 px-2 text-xs hover:bg-muted"
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              {copyStates[`copyStepDefinitionButton-${index}`] ? 'Copied!' : 'Copy'}
                            </Button>
                          </div>
                          <div className="bg-muted rounded-md overflow-hidden">
                            <pre className="text-xs p-4 overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words max-w-full font-mono">
                              <code className="block">{file.content}</code>
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>

              <TabsContent value="services" className="mt-4">
                <div className="border rounded-md overflow-hidden">
                  <div className="flex items-center justify-between p-3 border-b bg-muted/50">
                    <span className="text-sm font-medium">Service Classes</span>
                  </div>
                  <ScrollArea className="h-80 w-full">
                    <div className="p-4 space-y-4">
                      {generatedCode.serviceClasses.map((file, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">{file.name}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(file.content, file.name, `copyServiceClassButton-${index}`)}
                              className="h-6 px-2 text-xs hover:bg-muted"
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              {copyStates[`copyServiceClassButton-${index}`] ? 'Copied!' : 'Copy'}
                            </Button>
                          </div>
                          <div className="bg-muted rounded-md overflow-hidden">
                            <pre className="text-xs p-4 overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words max-w-full font-mono">
                              <code className="block">{file.content}</code>
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Field Configuration Modal */}
        <Dialog open={showFieldConfig} onOpenChange={setShowFieldConfig}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Configure Request Body Fields</DialogTitle>
              <DialogDescription className="text-sm">
                Choose which fields should be parameterized in the feature file vs. use default values in step definitions.
                You can configure fields for common API patterns or specific endpoints.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Actual Endpoints Section */}
              {endpoints.some(endpoint => ['POST', 'PUT', 'PATCH'].includes(endpoint.method.toUpperCase())) && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <h3 className="text-sm font-medium">Actual Endpoints</h3>
                  </div>
                  
                  {endpoints.map((endpoint, index) => {
                    if (!['POST', 'PUT', 'PATCH'].includes(endpoint.method.toUpperCase())) return null;
                    
                    const requestFields = endpoint.requestBody ? Object.keys(endpoint.requestBody) : [];
                    
                    return (
                      <div key={index} className="space-y-3 p-4 border rounded-lg">
                        <div className="font-medium text-sm">
                          {endpoint.method.toUpperCase()} {endpoint.path}
                        </div>
                        
                        {requestFields.length > 0 ? (
                          <div className="space-y-2">
                            {requestFields.map(field => (
                              <div key={field} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                <div className="flex items-center space-x-3">
                                  <Checkbox
                                    id={`${endpoint.method}-${endpoint.path}-${field}`}
                                    checked={(() => {
                                      const endpointKey = `${endpoint.method}-${endpoint.path}`;
                                      return customizableFields[endpointKey]?.has(field) || false;
                                    })()}
                                    onCheckedChange={(checked) => {
                                      const endpointKey = `${endpoint.method}-${endpoint.path}`;
                                      
                                      setCustomizableFields(prev => {
                                        const newFields = { ...prev };
                                        if (!newFields[endpointKey]) {
                                          newFields[endpointKey] = new Set();
                                        }
                                        
                                        if (checked) {
                                          newFields[endpointKey].add(field);
                                        } else {
                                          newFields[endpointKey].delete(field);
                                        }
                                        
                                        return newFields;
                                      });
                                    }}
                                  />
                                  <Label 
                                    htmlFor={`${endpoint.method}-${endpoint.path}-${field}`} 
                                    className="text-sm font-medium"
                                  >
                                    {field}
                                  </Label>
                                  <span className="text-xs text-gray-500">
                                    Default: {typeof endpoint.requestBody[field] === 'object' 
                                      ? JSON.stringify(endpoint.requestBody[field]) 
                                      : endpoint.requestBody[field]}
                                  </span>
                                </div>
                                
                                <Badge variant={(() => {
                                  const endpointKey = `${endpoint.method}-${endpoint.path}`;
                                  return customizableFields[endpointKey]?.has(field) ? "default" : "secondary";
                                })()}>
                                  {(() => {
                                    const endpointKey = `${endpoint.method}-${endpoint.path}`;
                                    return customizableFields[endpointKey]?.has(field) ? "🔵 Parameterized" : "🟢 Default";
                                  })()}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground text-center py-4">
                            No request body fields detected for this endpoint.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* No Endpoints Message */}
              {!endpoints.some(endpoint => ['POST', 'PUT', 'PATCH'].includes(endpoint.method.toUpperCase())) && (
                <div className="p-4 border rounded-lg bg-amber-50">
                  <div className="text-sm text-amber-800 text-center">
                    <p className="mb-2">No POST/PUT/PATCH endpoints with request bodies found yet.</p>
                    <p>You can still configure sample patterns above, or import a collection with POST endpoints to configure actual fields.</p>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={resetAllFields}>
                Reset All
              </Button>
              <Button onClick={() => setShowFieldConfig(false)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Error Schema Modal */}
        <Dialog open={showErrorSchema} onOpenChange={setShowErrorSchema}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Configure Error Schema for BDD Generation
              </DialogTitle>
              <DialogDescription className="text-sm">
                Define error response structure to generate error test scenarios alongside success scenarios.
                This will create comprehensive BDD tests covering both positive and negative cases.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Error Schema Configuration */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <h3 className="text-sm font-medium">Error Response Configuration</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {/* Enable Error Schema */}
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="enable-error-schema"
                      checked={errorSchema.enabled}
                      onCheckedChange={(checked) => {
                        setErrorSchema(prev => ({ ...prev, enabled: checked as boolean }));
                      }}
                    />
                    <Label htmlFor="enable-error-schema" className="text-sm font-medium">
                      Enable Error Schema Validation
                    </Label>
                  </div>
                  
                  {/* Error Status Code */}
                  <div className="space-y-2">
                    <Label htmlFor="error-status-code">Expected Error Status Code</Label>
                    <Input
                      id="error-status-code"
                      value={errorSchema.statusCode}
                      onChange={(e) => setErrorSchema(prev => ({ ...prev, statusCode: e.target.value }))}
                      placeholder="400"
                      disabled={!errorSchema.enabled}
                    />
                    <div className="text-xs text-muted-foreground">
                      Common error codes: 400 (Bad Request), 401 (Unauthorized), 422 (Validation Error)
                    </div>
                  </div>
                  
                  {/* Error Response Structure */}
                  <div className="space-y-2">
                    <Label htmlFor="error-structure">Error Response Structure (JSON)</Label>
                    <textarea
                      id="error-structure"
                      value={errorSchema.errorStructure}
                      onChange={(e) => setErrorSchema(prev => ({ ...prev, errorStructure: e.target.value }))}
                      placeholder={`{
  "error": "validation_failed",
  "message": "Invalid input data",
  "details": {
    "field": "email",
    "reason": "Invalid email format"
  }
}`}
                      className="w-full h-32 p-3 border rounded-md font-mono text-sm resize-none"
                      disabled={!errorSchema.enabled}
                    />
                    <div className="text-xs text-muted-foreground">
                      Define the expected error response structure. This will be used to generate error POJOs and validation steps.
                    </div>
                  </div>
                  

                </div>
              </div>
              
              {/* Preview Section */}
              {errorSchema.enabled && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    <h3 className="text-sm font-medium">Generated Error Test Preview</h3>
                  </div>
                  
                  <div className="p-3 border rounded-lg bg-red-50">
                    <div className="text-xs text-red-800">
                      <strong>Error Test Scenario:</strong>
                      <br />
                      • Status Code: {errorSchema.statusCode}
                      <br />
                      • Error Structure: {errorSchema.errorStructure ? 'Custom POJO' : 'Basic validation'}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setErrorSchema({
                  statusCode: '400',
                  errorStructure: '',
                  enabled: false
                });
              }}>
                Reset
              </Button>
              <Button onClick={() => setShowErrorSchema(false)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}; 