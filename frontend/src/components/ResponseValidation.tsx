import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { ValidationRule } from '@/types/validation';

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  responseTime: number;
  success?: boolean; // For wrapper responses
}

interface ResponseValidationProps {
  response: ApiResponse | null;
  validationRules?: ValidationRule[];
  onRulesChange?: (rules: ValidationRule[]) => void;
}

type ValidationType = 'status' | 'value' | 'existence';
type ConditionType = 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty' | 'is_null' | 'is_not_null';

export const ResponseValidation: React.FC<ResponseValidationProps> = ({ response, validationRules = [], onRulesChange }) => {
  const [rules, setRules] = useState<ValidationRule[]>(validationRules);
  const [selectedType, setSelectedType] = useState<ValidationType | ''>('');
  const [selectedField, setSelectedField] = useState('');
  const [selectedCondition, setSelectedCondition] = useState<ConditionType>('equals');
  const [expectedValue, setExpectedValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Sync external validation rules with internal state
  useEffect(() => {
    setRules(validationRules);
  }, [validationRules]);

  // Extract all available fields from response data
  const availableFields = useMemo(() => {
    if (!response?.data) return [];
    
    const extractFields = (obj: any, prefix = ''): string[] => {
      const fields: string[] = [];
      
      if (obj && typeof obj === 'object') {
        Object.keys(obj).forEach(key => {
          const currentPath = prefix ? `${prefix}.${key}` : key;
          fields.push(currentPath);
          
          if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            fields.push(...extractFields(obj[key], currentPath));
          }
        });
      }
      
      return fields;
    };
    
    return extractFields(response.data);
  }, [response?.data]);

  // Filter fields based on search term
  const filteredFields = useMemo(() => {
    if (!searchTerm) return availableFields;
    return availableFields.filter(field => 
      field.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableFields, searchTerm]);

  const getNestedValue = (obj: any, path: string): any => {
    try {
      return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : undefined;
      }, obj);
    } catch {
      return undefined;
    }
  };

  const validateRule = useCallback((rule: ValidationRule): { result: 'pass' | 'fail'; message: string } => {
    if (!response) {
      return { result: 'fail', message: 'No response to validate' };
    }

    switch (rule.type) {
      case 'status':
        const expectedStatus = parseInt(rule.expectedValue || '200');
        // Handle wrapper response structure
        let actualStatus = response.status;
        if (response.success !== undefined && response.data !== undefined) {
          // This is a wrapper response, status is at the top level
          actualStatus = response.status;
        }
        const passed = actualStatus === expectedStatus;
        return {
          result: passed ? 'pass' : 'fail',
          message: passed 
            ? `Status ${actualStatus} matches expected ${expectedStatus}`
            : `Status ${actualStatus} does not match expected ${expectedStatus}`
        };

      case 'value':
        const actualValue = getNestedValue(response.data, rule.field);
        const expectedValue = rule.expectedValue;
        
        // Handle boolean conversion
        let convertedExpected: any = expectedValue;
        if (expectedValue === 'true') convertedExpected = true;
        if (expectedValue === 'false') convertedExpected = false;
        
        const valueMatches = actualValue == convertedExpected;
        return {
          result: valueMatches ? 'pass' : 'fail',
          message: valueMatches
            ? `${rule.field} equals ${expectedValue}`
            : `${rule.field} is ${JSON.stringify(actualValue)}, expected ${expectedValue}`
        };

      case 'existence':
        const value = getNestedValue(response.data, rule.field);
        const condition = rule.condition as ConditionType;
        
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
        
        return {
          result: exists ? 'pass' : 'fail',
          message: exists
            ? `${rule.field} ${condition.replace('_', ' ')}`
            : `${rule.field} does not ${condition.replace('_', ' ')}`
        };

      default:
        return { result: 'fail', message: 'Unknown validation type' };
    }
  }, [response]);

  // Update validation results when response changes or rules change
  useEffect(() => {
    if (response && rules.length > 0) {
      const updatedRules = rules.map(rule => {
        const validation = validateRule(rule);
        return {
          ...rule,
          result: validation.result,
          message: validation.message
        };
      });
      setRules(updatedRules);
      onRulesChange?.(updatedRules);
    } else {
      onRulesChange?.(rules);
    }
  }, [response, validateRule, onRulesChange]);

  const addRule = () => {
    if (!selectedType) return;
    if (selectedType === 'status' && !expectedValue) return;
    if (selectedType === 'value' && (!selectedField || !expectedValue)) return;
    if (selectedType === 'existence' && !selectedField) return;

    const rule: ValidationRule = {
      id: Math.random().toString(36).substr(2, 9),
      type: selectedType as ValidationRule['type'],
      field: selectedType === 'status' ? 'status' : selectedField,
      expectedValue: selectedType === 'existence' ? undefined : expectedValue,
      condition: selectedType === 'existence' ? selectedCondition : selectedCondition,
    };

    const newRules = [...rules, rule];
    
    // Immediately validate the new rule if we have a response
    if (response) {
      const validation = validateRule(rule);
      rule.result = validation.result;
      rule.message = validation.message;
    }
    
    setRules(newRules);
    onRulesChange?.(newRules);
    
    // Reset form
    setSelectedType('');
    setSelectedField('');
    setSelectedCondition('equals');
    setExpectedValue('');
    setSearchTerm('');
  };

  const removeRule = (id: string) => {
    const updatedRules = rules.filter(rule => rule.id !== id);
    setRules(updatedRules);
    onRulesChange?.(updatedRules);
  };

  const getRuleDisplayText = (rule: ValidationRule) => {
    switch (rule.type) {
      case 'status':
        return `Status Code ${rule.condition === 'not_equals' ? '!=' : '=='} ${rule.expectedValue || '200'}`;
      case 'value':
        const condition = rule.condition || 'equals';
        const conditionText = {
          'equals': '==',
          'not_equals': '!=',
          'contains': 'contains',
          'starts_with': 'starts with',
          'ends_with': 'ends with'
        }[condition] || '==';
        return `${rule.field} ${conditionText} ${rule.expectedValue}`;
      case 'existence':
        const existenceText = {
          'is_empty': 'is empty',
          'is_not_empty': 'is not empty',
          'is_null': 'is null',
          'is_not_null': 'is not null'
        }[rule.condition as ConditionType] || 'exists';
        return `${rule.field} ${existenceText}`;
      default:
        return 'Unknown rule';
    }
  };

  const passedCount = rules.filter(rule => rule.result === 'pass').length;
  const failedCount = rules.filter(rule => rule.result === 'fail').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>✅ Response Validation</span>
          {rules.length > 0 && (
            <div className="flex space-x-2">
              <Badge variant="outline" className="bg-green-50 text-green-700">
                {passedCount} passed
              </Badge>
              <Badge variant="outline" className="bg-red-50 text-red-700">
                {failedCount} failed
              </Badge>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new rule form */}
        <div className="space-y-4 p-4 bg-gray-50 rounded-md">
          {/* Validation Type Selection */}
          <div>
            <Label className="text-sm font-medium">Validation Type</Label>
            <Select value={selectedType} onValueChange={(value) => {
              setSelectedType(value as ValidationType);
              setSelectedField('');
              setSelectedCondition('equals');
              setExpectedValue('');
              setSearchTerm('');
            }}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select validation type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">Status Code</SelectItem>
                <SelectItem value="value">JSON Value Match</SelectItem>
                <SelectItem value="existence">Key Existence / Value Presence</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic Fields Based on Selection */}
          {selectedType && (
            <div className="space-y-3">
              {/* Status Code Validation */}
              {selectedType === 'status' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium">Condition</Label>
                    <Select value={selectedCondition} onValueChange={(value) => setSelectedCondition(value as ConditionType)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="not_equals">Not Equals</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Expected Status Code</Label>
                    <Input
                      type="number"
                      placeholder="200"
                      value={expectedValue}
                      onChange={(e) => setExpectedValue(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              {/* JSON Value Match Validation */}
              {selectedType === 'value' && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">JSON Field</Label>
                    <div className="relative mt-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search fields..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {filteredFields.length > 0 && (
                      <div className="mt-2 max-h-32 overflow-y-auto border rounded-md">
                        {filteredFields.map((field) => (
                          <div
                            key={field}
                            className={`px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm ${
                              selectedField === field ? 'bg-blue-50 text-blue-700' : ''
                            }`}
                            onClick={() => setSelectedField(field)}
                          >
                            {field}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium">Condition</Label>
                      <Select value={selectedCondition} onValueChange={(value) => setSelectedCondition(value as ConditionType)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">Equals</SelectItem>
                          <SelectItem value="not_equals">Not Equals</SelectItem>
                          <SelectItem value="contains">Contains</SelectItem>
                          <SelectItem value="starts_with">Starts With</SelectItem>
                          <SelectItem value="ends_with">Ends With</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Expected Value</Label>
                      <Input
                        placeholder="Enter expected value"
                        value={expectedValue}
                        onChange={(e) => setExpectedValue(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Key Existence / Value Presence Validation */}
              {selectedType === 'existence' && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">JSON Field</Label>
                    <div className="relative mt-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search fields..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {filteredFields.length > 0 && (
                      <div className="mt-2 max-h-32 overflow-y-auto border rounded-md">
                        {filteredFields.map((field) => (
                          <div
                            key={field}
                            className={`px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm ${
                              selectedField === field ? 'bg-blue-50 text-blue-700' : ''
                            }`}
                            onClick={() => setSelectedField(field)}
                          >
                            {field}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Condition</Label>
                    <Select value={selectedCondition} onValueChange={(value) => setSelectedCondition(value as ConditionType)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="is_empty">Is Empty</SelectItem>
                        <SelectItem value="is_not_empty">Is Not Empty</SelectItem>
                        <SelectItem value="is_null">Is Null</SelectItem>
                        <SelectItem value="is_not_null">Is Not Null</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add Button */}
          <Button 
            onClick={addRule} 
            disabled={
              !selectedType || 
              (selectedType === 'status' && !expectedValue) ||
              (selectedType === 'value' && (!selectedField || !expectedValue)) ||
              (selectedType === 'existence' && !selectedField)
            }
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Validation Rule
          </Button>
        </div>

        {/* Display rules */}
        {rules.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Active Validation Rules:</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRules([]);
                  onRulesChange?.([]);
                }}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-3 h-3 mr-1" />
                Reset All
              </Button>
            </div>
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-3 border rounded-md bg-white">
                <div className="flex items-center space-x-3">
                  {rule.result === 'pass' && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  {rule.result === 'fail' && (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  {!rule.result && (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                  )}
                  <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {getRuleDisplayText(rule)}
                  </code>
                </div>
                <div className="flex items-center space-x-2">
                  {rule.message && (
                    <span className="text-xs text-gray-600 max-w-xs truncate">{rule.message}</span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeRule(rule.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {rules.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <p className="text-sm">Add validation rules to check if your API responses meet expectations</p>
            <p className="text-xs mt-2">Examples: Status Code == 200, user.name == "John", data.success exists</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
