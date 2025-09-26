import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, Shield, CheckCircle, AlertCircle, Search } from 'lucide-react';

import { ValidationRule, Endpoint } from '@/types/validation';

type ValidationType = 'status' | 'value' | 'existence';
type ConditionType = 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty' | 'is_null' | 'is_not_null';

interface EndpointValidationModalProps {
  endpoint: Endpoint;
  existingRules: ValidationRule[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (rules: ValidationRule[]) => void;
}

export const EndpointValidationModal: React.FC<EndpointValidationModalProps> = ({
  endpoint,
  existingRules,
  isOpen,
  onClose,
  onSave
}) => {
  const [rules, setRules] = useState<ValidationRule[]>(existingRules);
  const [selectedType, setSelectedType] = useState<ValidationType | ''>('');
  const [selectedField, setSelectedField] = useState('');
  const [selectedCondition, setSelectedCondition] = useState<ConditionType>('equals');
  const [expectedValue, setExpectedValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Extract all available fields from response data (placeholder for now)
  const availableFields = useMemo(() => {
    // For now, return common fields. In a real implementation, 
    // this would extract fields from a sample response
    return [
      'status',
      'data',
      'data.success',
      'data.result',
      'data.result.status',
      'data.result.tokenOperateReqId',
      'data.result.endToEndId',
      'data.result.unsignedTransaction'
    ];
  }, []);

  useEffect(() => {
    setRules(existingRules);
  }, [existingRules]);

  const addRule = () => {
    if (!selectedType) return;

    const rule: ValidationRule = {
      id: Math.random().toString(36).substr(2, 9),
      type: selectedType,
      field: selectedType === 'status' ? 'status' : selectedField,
      expectedValue: selectedType === 'existence' ? undefined : expectedValue,
      condition: selectedType === 'existence' ? selectedCondition : selectedCondition,
    };

    setRules([...rules, rule]);
    setSelectedType('');
    setSelectedField('');
    setSelectedCondition('equals');
    setExpectedValue('');
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(rule => rule.id !== id));
  };

  const handleSave = () => {
    onSave(rules);
    onClose();
  };

  const getRuleDisplayText = (rule: ValidationRule) => {
    switch (rule.type) {
      case 'status':
        return `Status Code: ${rule.expectedValue || '200'}`;
      case 'value':
        return `${rule.field} ${rule.condition || 'equals'} ${rule.expectedValue}`;
      case 'existence':
        return `${rule.field} ${rule.condition || 'is_not_empty'}`;
      default:
        return 'Unknown rule';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <Badge variant="outline" className="font-mono">
              {endpoint.method}
            </Badge>
            <span>Validation Rules</span>
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Configure validation rules for {endpoint.name}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Endpoint Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Endpoint Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="font-mono">
                    {endpoint.method}
                  </Badge>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {endpoint.url}
                  </code>
                </div>
                {endpoint.description && (
                  <p className="text-sm text-gray-600">{endpoint.description}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Add New Rule Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Add Validation Rule</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {rules.length} rule{rules.length !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Validation Type Selection */}
                <div className="space-y-2">
                  <Label>Validation Type</Label>
                  <Select value={selectedType} onValueChange={(value: ValidationType) => setSelectedType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select validation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="status">Status Code</SelectItem>
                      <SelectItem value="value">JSON Value Match</SelectItem>
                      <SelectItem value="existence">Key Existence / Value Presence</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Field Selection - only show for value and existence types */}
                {(selectedType === 'value' || selectedType === 'existence') && (
                  <div className="space-y-2">
                    <Label>JSON Field</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search fields..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={selectedField} onValueChange={setSelectedField}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {searchTerm ? (
                          // Show filtered fields
                          availableFields.filter(field => 
                            field.toLowerCase().includes(searchTerm.toLowerCase())
                          ).map(field => (
                            <SelectItem key={field} value={field}>
                              {field}
                            </SelectItem>
                          ))
                        ) : (
                          // Show all available fields
                          availableFields.map(field => (
                            <SelectItem key={field} value={field}>
                              {field}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Condition Selection - only show for existence type */}
                {selectedType === 'existence' && selectedField && (
                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <Select value={selectedCondition} onValueChange={(value: ConditionType) => setSelectedCondition(value)}>
                      <SelectTrigger>
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
                )}

                {/* Expected Value - only show for status and value types */}
                {(selectedType === 'status' || selectedType === 'value') && (
                  <div className="space-y-2">
                    <Label>Expected Value</Label>
                    <Input
                      placeholder={selectedType === 'status' ? '200' : 'Expected value'}
                      value={expectedValue}
                      onChange={(e) => setExpectedValue(e.target.value)}
                    />
                  </div>
                )}

                {/* Add Rule Button */}
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
            </CardContent>
          </Card>

          {/* Existing Rules */}
          {rules.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Configured Validation Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {rules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-3 border rounded-md bg-white">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {getRuleDisplayText(rule)}
                        </code>
                        <Badge variant="outline" className="text-xs">
                          {rule.type}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeRule(rule.id)}
                        className="flex items-center"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {rules.length === 0 && (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm mb-2">No validation rules configured</p>
              <p className="text-xs">Add rules above to validate API responses automatically</p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Rules ({rules.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
