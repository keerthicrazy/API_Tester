export interface ValidationRule {
  id: string;
  type: 'status' | 'value' | 'existence';
  field?: string;
  expectedValue?: string;
  condition?: 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty' | 'is_null' | 'is_not_null';
  result?: 'pass' | 'fail';
  message?: string;
}

export interface Endpoint {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  description?: string;
  customizableFields?: Set<string>;
  endpointName?: string;  // Custom endpoint name for BDD generation
  errorSchema?: {
    enabled: boolean;
    statusCode: string;
    errorStructure: string;
  };
}

export interface ExecutionResult {
  endpoint: Endpoint;
  status: 'success' | 'error' | 'pending';
  response?: {
    status: number;
    data: any;
    headers: Record<string, string>;
    responseTime: number;
  };
  error?: string;
  validationResults?: ValidationRule[];
}