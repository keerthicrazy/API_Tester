import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {Package, Zap} from "lucide-react";
import {Header} from "@/components/Header";
import {RequestPanel} from "@/components/RequestPanel";
import {ResponsePanel} from "@/components/ResponsePanel";
import {SmartImport} from "@/components/SmartImport";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {ValidationRule} from "@/types/validation";
import {isFeatureEnabled} from "@/config";
import {fetchWithCORS} from "@/api/corsProxy";
import {ErrorBoundary} from "@/components/ErrorBoundary";
import {getMethodColor} from "@/lib/utils";
import {getProxySolutions} from "@/config/proxy";

const Index = () => {
    const navigate = useNavigate();
    const [response, setResponse] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [validationRules, setValidationRules] = useState<ValidationRule[]>([]);
    const [requestConfig, setRequestConfig] = useState<any>(null);
    const [executionResult, setExecutionResult] = useState<any>(null);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [importedEndpoints, setImportedEndpoints] = useState<any[]>([]);
    const [selectedEndpoint, setSelectedEndpoint] = useState<any>(null);
    const [selectedMode, setSelectedMode] = useState<'manual' | 'import' | null>(null);

    // Reset function for Quick Testing state
    const resetQuickTestingState = () => {
        setResponse(null);
        setLoading(false);
        setValidationRules([]);
        setRequestConfig(null);
        setExecutionResult(null);
        setSelectedEndpoint(null);
    };

    // Helper function to get nested values from objects
    const getNestedValue = (obj: any, path: string): any => {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    };

    const handleEndpointImport = (endpoint: {
        method: string;
        url: string;
        headers: Record<string, string>;
        body?: string;
        name?: string;
        description?: string;
    }) => {
        setImportedEndpoints(prev => [...prev, {...endpoint, id: Date.now().toString()}]);
        console.log('Endpoint imported:', endpoint);
    };

    const handleEndpointSelect = (endpoint: any) => {
        setSelectedEndpoint(endpoint);
        // This will be handled by the RequestPanel's internal state management
    };

    const handleRequest = async (requestData: {
        method: string;
        url: string;
        headers: Record<string, string>;
        body?: string;
    }) => {
        setLoading(true);
        setRequestConfig(requestData);
        try {
            // Make the API request
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
                // Handle backend proxy errors
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

            // Handle backend proxy response format
            const apiResponse = {
                status: parsedData.success ? parsedData.status : response.status,
                statusText: parsedData.success ? parsedData.statusText : response.statusText,
                headers: parsedData.success ? parsedData.headers : Object.fromEntries(response.headers.entries()),
                data: parsedData.success ? parsedData.data : parsedData,
                responseTime: parsedData.success ? parsedData.proxyInfo?.responseTime || Date.now() : Date.now(),
            };

            setResponse(apiResponse);

            // Validate rules against response
            const validatedRules = validationRules.map(rule => {
                let result: 'pass' | 'fail' = 'pass';
                let message = '';

                try {
                    switch (rule.type) {
                        case 'status':
                            result = apiResponse.status.toString() === rule.expectedValue ? 'pass' : 'fail';
                            message = result === 'pass'
                                ? `Status code ${apiResponse.status} matches expected ${rule.expectedValue}`
                                : `Status code ${apiResponse.status} does not match expected ${rule.expectedValue}`;
                            break;
                        case 'value':
                            const actualValue = getNestedValue(apiResponse.data, rule.field || '');
                            const expectedValue = rule.expectedValue;
                            
                            // Handle boolean conversion
                            let convertedExpected: any = expectedValue;
                            if (expectedValue === 'true') convertedExpected = true;
                            if (expectedValue === 'false') convertedExpected = false;
                            
                            const valueMatches = actualValue == convertedExpected;
                            result = valueMatches ? 'pass' : 'fail';
                            message = valueMatches
                                ? `${rule.field} equals ${expectedValue}`
                                : `${rule.field} is ${JSON.stringify(actualValue)}, expected ${expectedValue}`;
                            break;
                        case 'existence':
                            const value = getNestedValue(apiResponse.data, rule.field || '');
                            const condition = rule.condition as any;
                            
                            let exists = false;
                            switch (condition) {
                                case 'is_empty':
                                    exists = value === '' || value === null || value === undefined;
                                    break;
                                case 'is_not_empty':
                                    exists = value !== '' && value !== null && value !== undefined;
                                    break;
                                case 'is_null':
                                    exists = value === null;
                                    break;
                                case 'is_not_null':
                                    exists = value !== null;
                                    break;
                                default:
                                    exists = value !== undefined && value !== null;
                            }
                            
                            result = exists ? 'pass' : 'fail';
                            message = exists
                                ? `${rule.field} ${condition?.replace('_', ' ')}`
                                : `${rule.field} does not ${condition?.replace('_', ' ')}`;
                            break;
                    }
                } catch (error) {
                    result = 'fail';
                    message = `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`;
                }

                return {...rule, result, message};
            });

            // Create execution result for integrations
            setExecutionResult({
                endpoint: {
                    id: 'manual-test',
                    name: 'Manual API Test',
                    method: requestData.method,
                    url: requestData.url,
                    headers: requestData.headers,
                    body: requestData.body,
                    description: `Manual test of ${requestData.method} ${requestData.url}`
                },
                status: response.ok ? 'success' : 'error',
                response: apiResponse,
                validationResults: validatedRules
            });
        } catch (error) {
            setResponse({
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                time: Date.now(),
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <Header/>

            {/* Enhanced Hero Section */}
            <div className="relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-grid-slate-100 bg-[size:20px_20px] opacity-25"/>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-indigo-600/5"/>

                <div className="relative container mx-auto px-4 py-16">
                    <div className="max-w-6xl mx-auto">
                        {/* Hero Header */}
                        <div className="text-center mb-16">
                            <div className="flex items-center justify-center mb-6">
                                <div
                                    className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mr-6 shadow-lg animate-scale-in">
                                    <Zap className="w-10 h-10 text-white"/>
                                </div>
                                <div className="text-left">
                                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                                        API Testing Platform
                                    </h1>
                                    <p className="text-lg text-gray-600 mt-2">
                                        Professional API testing made simple and powerful
                                    </p>
                                </div>
                            </div>

                            {/* Feature highlights */}
                            <div className="flex flex-wrap justify-center gap-4 mb-12">
                                <Badge variant="secondary" className="px-4 py-2 text-sm bg-white/80 shadow-sm">
                                    ⚡ Real-time Testing
                                </Badge>
                                <Badge variant="secondary" className="px-4 py-2 text-sm bg-white/80 shadow-sm">
                                    📁 Import Collections
                                </Badge>
                                <Badge variant="secondary" className="px-4 py-2 text-sm bg-white/80 shadow-sm">
                                    🔍 Advanced Validation
                                </Badge>
                                <Badge variant="secondary" className="px-4 py-2 text-sm bg-white/80 shadow-sm">
                                    📊 Detailed Reports
                                </Badge>
                            </div>
                        </div>

                        {/* Interactive Options */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                            {/* Option 1: Quick Testing */}
                            <Card
                                className={`group cursor-pointer transition-all duration-300 border-2 hover:scale-105 hover:shadow-2xl ${
                                    selectedMode === 'manual'
                                        ? 'border-blue-500 bg-blue-50 shadow-blue-100 shadow-lg'
                                        : 'border-gray-200 hover:border-blue-300 bg-white/80 backdrop-blur-sm'
                                }`}>
                                <CardContent className="p-8 text-center">
                                    <div
                                        className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-300 ${
                                            selectedMode === 'manual'
                                                ? 'bg-blue-500 text-white scale-110'
                                                : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white group-hover:scale-110'
                                        }`}>
                                        <Zap className="w-10 h-10"/>
                                    </div>
                                    <h3 className={`text-2xl font-bold mb-3 ${selectedMode === 'manual' ? 'text-blue-700' : 'text-gray-900'}`}>
                                        Quick Testing
                                    </h3>
                                    <p className={`mb-6 text-base ${selectedMode === 'manual' ? 'text-blue-600' : 'text-gray-600'}`}>
                                        Start testing immediately by building custom requests. Perfect for quick tests
                                        and debugging.
                                    </p>
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center justify-center text-sm text-gray-500">
                                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                            Instant setup
                                        </div>
                                        <div className="flex items-center justify-center text-sm text-gray-500">
                                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                            Custom headers & body
                                        </div>
                                        <div className="flex items-center justify-center text-sm text-gray-500">
                                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                            Real-time validation
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => navigate('/quick-testing')}
                                        variant="outline"
                                        className="w-full py-3 text-lg font-semibold transition-all duration-300 hover:bg-blue-500 hover:text-white hover:shadow-lg"
                                    >
                                        Start Quick Testing
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Option 2: Import Collection */}
                            <Card
                                className={`group cursor-pointer transition-all duration-300 border-2 hover:scale-105 hover:shadow-2xl ${
                                    selectedMode === 'import'
                                        ? 'border-purple-500 bg-purple-50 shadow-purple-100 shadow-lg'
                                        : 'border-gray-200 hover:border-purple-300 bg-white/80 backdrop-blur-sm'
                                }`}>
                                <CardContent className="p-8 text-center">
                                    <div
                                        className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-300 ${
                                            selectedMode === 'import'
                                                ? 'bg-purple-500 text-white scale-110'
                                                : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white group-hover:scale-110'
                                        }`}>
                                        <Package className="w-10 h-10"/>
                                    </div>
                                    <h3 className={`text-2xl font-bold mb-3 ${selectedMode === 'import' ? 'text-purple-700' : 'text-gray-900'}`}>
                                        Import Collection
                                    </h3>
                                    <p className={`mb-6 text-base ${selectedMode === 'import' ? 'text-purple-600' : 'text-gray-600'}`}>
                                        Import Postman or OpenAPI collections for comprehensive testing. Ideal for
                                        complete API suites.
                                    </p>
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center justify-center text-sm text-gray-500">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                                            Postman & OpenAPI support
                                        </div>
                                        <div className="flex items-center justify-center text-sm text-gray-500">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                                            Bulk endpoint testing
                                        </div>
                                        <div className="flex items-center justify-center text-sm text-gray-500">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                                            Automated workflows
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => navigate('/collection')}
                                        variant="outline"
                                        className="w-full py-3 text-lg font-semibold transition-all duration-300 hover:bg-purple-500 hover:text-white hover:shadow-lg"
                                    >
                                        Import Collection
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Bottom CTA */}
                        {!selectedMode && (
                            <div className="text-center mt-16 animate-fade-in">
                                <p className="text-gray-600 text-lg mb-4">
                                    Ready to test your APIs? Choose your preferred method above.
                                </p>
                                <div className="flex justify-center space-x-2 text-sm text-gray-500">
                                    {/* <span>✨Go fast. Go Smart. Go API</span> */}
                                    {/* <span>•</span>
                                    <span>🚀Start testing instantly</span>
                                    <span>•</span> */}
                                    <span>Developed by 🚀 GETS (Group Engineering Testing Services)</span>

                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedMode && (
                <main className="container mx-auto px-4 py-8 space-y-6">
                    {/* Import Collection Section - Only when import mode selected */}
                    {selectedMode === 'import' && (
                        <>
                            <Card className="border-2 border-primary/20" id="testing-interface">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center">
                                            <Package className="w-5 h-5 mr-2"/>
                                            Import API Collection
                                        </CardTitle>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedMode(null);
                                                setIsImportOpen(false);
                                                setImportedEndpoints([]);
                                                setSelectedEndpoint(null);
                                            }}
                                        >
                                            Back to Options
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <SmartImport onEndpointSelected={handleEndpointImport}/>
                                </CardContent>
                            </Card>

                            {/* Imported Endpoints Selection */}
                            {importedEndpoints.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <Package className="w-5 h-5 mr-2"/>
                                            Imported Endpoints ({importedEndpoints.length})
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {importedEndpoints.map((endpoint, index) => (
                                                <Button
                                                    key={endpoint.id || index}
                                                    variant={selectedEndpoint?.id === endpoint.id ? "default" : "outline"}
                                                    className="justify-start h-auto p-3"
                                                    onClick={() => handleEndpointSelect(endpoint)}
                                                >
                                                    <div className="flex flex-col items-start w-full">
                                                        <div className="flex items-center w-full">
                                                            <Badge
                                                                className={`mr-2 text-xs border ${getMethodColor(endpoint.method)}`}>
                                                                {endpoint.method}
                                                            </Badge>
                                                            <span className="text-sm font-medium truncate">
                                {endpoint.name || `Endpoint ${index + 1}`}
                              </span>
                                                        </div>
                                                        <span
                                                            className="text-xs text-muted-foreground mt-1 truncate w-full">
                              {endpoint.url}
                            </span>
                                                    </div>
                                                </Button>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Testing Interface for Import Mode - Only show when endpoint is selected */}
                            {selectedEndpoint && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <Card className="p-6">
                                        <h2 className="text-xl font-semibold mb-4">Test Selected Endpoint</h2>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Testing: {selectedEndpoint.name || 'Selected Endpoint'}
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
                            )}
                        </>
                    )}

                    {/* Manual Testing Section - Only when manual mode selected */}
                    {selectedMode === 'manual' && (
                        <div id="testing-interface" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold">Quick API Testing</h2>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedMode(null);
                                            setResponse(null);
                                            setSelectedEndpoint(null);
                                        }}
                                    >
                                        Back to Options
                                    </Button>
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
                    )}
                </main>
            )}
        </div>
    );
};

export default Index;