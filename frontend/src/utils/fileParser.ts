import * as yaml from 'js-yaml';
import {getProxyBase} from '@/config/proxy';

export interface ParsedEndpoint {
    id: string;
    name: string;
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
    description?: string;
}

// Postman Collection interfaces
interface PostmanRequest {
    method: string;
    header?: Array<{ key: string; value: string; disabled?: boolean }>;
    url: string | { raw: string; host?: string[]; path?: string[] };
    body?: {
        mode: string;
        raw?: string;
        formdata?: Array<{ key: string; value: string }>;
    };
}

interface PostmanItem {
    name: string;
    request: PostmanRequest;
    item?: PostmanItem[];
}

interface PostmanVariable {
    key: string;
    value: string;
    type?: string;
}

interface PostmanCollection {
    info: { name: string };
    item: PostmanItem[];
    variable?: PostmanVariable[];
    auth?: {
        type: string;
        [key: string]: any;
    };
}

// OpenAPI/Swagger interfaces
interface OpenAPIOperation {
    summary?: string;
    description?: string;
    parameters?: Array<{
        name: string;
        in: string;
        required?: boolean;
        schema?: any;
    }>;
    requestBody?: {
        content: {
            [mediaType: string]: {
                schema?: any;
                example?: any;
            };
        };
    };
}

interface OpenAPISpec {
    openapi?: string;
    swagger?: string;
    info: { title: string };
    servers?: Array<{ url: string }>;
    host?: string;
    basePath?: string;
    schemes?: string[];
    paths: {
        [path: string]: {
            [method: string]: OpenAPIOperation;
        };
    };
    components?: {
        securitySchemes?: {
            [name: string]: {
                type: string;
                [key: string]: any;
            };
        };
    };
    security?: Array<{ [name: string]: string[] }>;
}

export async function parseImportedFile(content: string, filename: string): Promise<ParsedEndpoint[]> {
    try {
        // Try to determine file type
        const isYaml = filename.toLowerCase().endsWith('.yaml') || filename.toLowerCase().endsWith('.yml');

        let data: any;
        if (isYaml) {
            data = yaml.load(content);
        } else {
            data = JSON.parse(content);
        }

        // Determine the type of file and parse accordingly
        if (data.info && (data.openapi || data.swagger)) {
            // This is an OpenAPI/Swagger spec
            return parseOpenAPISpec(data);
        } else if (data.info && data.item) {
            // This is a Postman collection
            return parsePostmanCollection(data);
        } else {
            throw new Error('Unsupported file format. Please provide a valid Swagger/OpenAPI spec or Postman collection.');
        }
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to parse file: ${error.message}`);
        }
        throw new Error('Failed to parse the imported file. Please check the file format.');
    }
}

export async function parseSwaggerFromURL(url: string): Promise<ParsedEndpoint[]> {
    try {
        // Use environment-aware proxy URL
        const proxyUrl = getProxyBase().replace('/api/wrapper', '/api/wrapper');

        console.log(`🔄 Fetching Swagger spec via proxy: ${url}`);
        console.log(`🛡️ Using proxy: ${proxyUrl}`);

        // Prepare wrapper payload for POST request
        const wrapperPayload = {
            url: url,
            method: 'GET',
            headers: {
                'Accept': 'application/json, application/yaml, text/yaml, */*',
                'User-Agent': 'API-Tester-Pro/1.0'
            }
        };

        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(wrapperPayload),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch Swagger spec from ${url}. Status: ${response.status}`);
        }

        // Parse the proxy response
        const proxyResponse = await response.json();

        if (!proxyResponse.success) {
            throw new Error(`Proxy request failed: ${proxyResponse.message || 'Unknown error'}`);
        }

        // Extract the actual content from the proxy response
        const content = typeof proxyResponse.data === 'string'
            ? proxyResponse.data
            : JSON.stringify(proxyResponse.data);

        const filename = url.includes('.yaml') || url.includes('.yml') ? 'swagger.yaml' : 'swagger.json';

        console.log(`✅ Successfully fetched Swagger spec via proxy`);

        return await parseImportedFile(content, filename);
    } catch (error) {
        console.error('Swagger URL import error:', error);

        if (error instanceof Error) {
            // Check if it's a proxy-related error
            if (error.message.includes('proxy') ||
                error.message.includes('Failed to fetch') ||
                error.message.includes('NetworkError')) {
                throw new Error(`Failed to import Swagger from URL via proxy. Please ensure the backend proxy server is running. Error: ${error.message}`);
            }
            throw new Error(`Failed to import Swagger from URL: ${error.message}`);
        }
        throw new Error('Failed to import Swagger from URL. Please check the URL and try again.');
    }
}

function resolvePostmanVariables(text: string, variables: PostmanVariable[]): string {
    if (!text || !variables) return text;

    let resolvedText = text;

    // Replace all {{variableName}} patterns
    const variablePattern = /\{\{([^}]+)\}\}/g;
    resolvedText = resolvedText.replace(variablePattern, (match, variableName) => {
        const variable = variables.find(v => v.key === variableName.trim());
        return variable ? variable.value : match; // Keep original if variable not found
    });

    return resolvedText;
}

function extractGlobalHeaders(collection: PostmanCollection): Record<string, string> {
    const globalHeaders: Record<string, string> = {};

    // Extract auth headers if present
    if (collection.auth) {
        switch (collection.auth.type) {
            case 'bearer':
                globalHeaders['Authorization'] = 'Bearer {{token}}';
                break;
            case 'apikey':
                if (collection.auth.keyIn === 'header') {
                    globalHeaders[collection.auth.key] = '{{apiKey}}';
                }
                break;
            case 'basic':
                globalHeaders['Authorization'] = 'Basic {{base64_encoded_credentials}}';
                break;
        }
    }

    return globalHeaders;
}

function parsePostmanCollection(collection: PostmanCollection): ParsedEndpoint[] {
    const endpoints: ParsedEndpoint[] = [];
    const variables = collection.variable || [];
    const globalHeaders = extractGlobalHeaders(collection);

    function extractItemsRecursively(items: PostmanItem[], folderName = ''): void {
        for (const item of items) {
            if (item.request) {
                // This is an actual request
                let url = typeof item.request.url === 'string'
                    ? item.request.url
                    : item.request.url.raw || '';

                // Resolve variables in URL
                url = resolvePostmanVariables(url, variables);

                // Start with global headers
                const headers: Record<string, string> = {...globalHeaders};

                // Add request-specific headers
                if (item.request.header) {
                    item.request.header.forEach(h => {
                        if (!h.disabled && h.key && h.value) {
                            // Resolve variables in header values
                            const resolvedValue = resolvePostmanVariables(h.value, variables);
                            headers[h.key] = resolvedValue;
                        }
                    });
                }

                let body: string | undefined;
                if (item.request.body) {
                    if (item.request.body.mode === 'raw' && item.request.body.raw) {
                        // Resolve variables in request body
                        body = resolvePostmanVariables(item.request.body.raw, variables);
                    } else if (item.request.body.mode === 'formdata' && item.request.body.formdata) {
                        // Convert form data to JSON for simplicity and resolve variables
                        const formObj: Record<string, string> = {};
                        item.request.body.formdata.forEach(field => {
                            const resolvedValue = resolvePostmanVariables(field.value, variables);
                            formObj[field.key] = resolvedValue;
                        });
                        body = JSON.stringify(formObj, null, 2);
                    }
                }

                const endpointName = folderName ? `${folderName} / ${item.name}` : item.name;

                endpoints.push({
                    id: `postman-${endpoints.length}`,
                    name: endpointName,
                    method: item.request.method.toUpperCase(),
                    url,
                    headers,
                    body,
                });
            } else if (item.item) {
                // This is a folder, recurse into it
                extractItemsRecursively(item.item, item.name);
            }
        }
    }

    extractItemsRecursively(collection.item);
    return endpoints;
}

function extractGlobalHeadersFromOpenAPI(spec: OpenAPISpec): Record<string, string> {
    const globalHeaders: Record<string, string> = {};

    // Extract security schemes as global headers
    if (spec.components?.securitySchemes) {
        Object.entries(spec.components.securitySchemes).forEach(([name, scheme]) => {
            switch (scheme.type) {
                case 'http':
                    if (scheme.scheme === 'bearer') {
                        globalHeaders['Authorization'] = 'Bearer {{bearer_token}}';
                    } else if (scheme.scheme === 'basic') {
                        globalHeaders['Authorization'] = 'Basic {{basic_auth}}';
                    }
                    break;
                case 'apiKey':
                    if (scheme.in === 'header') {
                        globalHeaders[scheme.name] = `{{${name}_key}}`;
                    }
                    break;
            }
        });
    }

    return globalHeaders;
}

function parseOpenAPISpec(spec: OpenAPISpec): ParsedEndpoint[] {
    const endpoints: ParsedEndpoint[] = [];
    const globalHeaders = extractGlobalHeadersFromOpenAPI(spec);

    // Determine base URL
    let baseUrl = '';
    if (spec.servers && spec.servers.length > 0) {
        baseUrl = spec.servers[0].url;
    } else if (spec.host) {
        const scheme = spec.schemes?.[0] || 'https';
        const basePath = spec.basePath || '';
        baseUrl = `${scheme}://${spec.host}${basePath}`;
    }

    // Parse paths
    for (const [path, pathItem] of Object.entries(spec.paths)) {
        for (const [method, operation] of Object.entries(pathItem)) {
            if (['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(method.toLowerCase())) {
                const op = operation as OpenAPIOperation;

                // Start with global headers
                const headers: Record<string, string> = {...globalHeaders};

                // Add operation-specific headers
                if (op.parameters) {
                    op.parameters.forEach(param => {
                        if (param.in === 'header') {
                            headers[param.name] = param.required ? `{${param.name}}` : `{${param.name}}`;
                        }
                    });
                }

                // Build request body
                let body: string | undefined;
                if (op.requestBody) {
                    const content = op.requestBody.content;
                    const jsonContent = content['application/json'];
                    if (jsonContent) {
                        if (jsonContent.example) {
                            body = JSON.stringify(jsonContent.example, null, 2);
                        } else if (jsonContent.schema) {
                            // Generate example from schema
                            body = JSON.stringify(generateExampleFromSchema(jsonContent.schema), null, 2);
                        }
                    }
                }

                const fullUrl = baseUrl + path;
                const name = op.summary || `${method.toUpperCase()} ${path}`;

                endpoints.push({
                    id: `openapi-${endpoints.length}`,
                    name,
                    method: method.toUpperCase(),
                    url: fullUrl,
                    headers,
                    body,
                    description: op.description,
                });
            }
        }
    }

    return endpoints;
}

function generateExampleFromSchema(schema: any): any {
    if (!schema || typeof schema !== 'object') {
        return {};
    }

    if (schema.example !== undefined) {
        return schema.example;
    }

    if (schema.type === 'object' && schema.properties) {
        const example: any = {};
        for (const [key, prop] of Object.entries(schema.properties)) {
            example[key] = generateExampleFromSchema(prop);
        }
        return example;
    }

    if (schema.type === 'array' && schema.items) {
        return [generateExampleFromSchema(schema.items)];
    }

    // Generate basic examples based on type
    switch (schema.type) {
        case 'string':
            return schema.format === 'email' ? 'user@example.com' : 'string';
        case 'number':
        case 'integer':
            return 0;
        case 'boolean':
            return true;
        default:
            return null;
    }
}
