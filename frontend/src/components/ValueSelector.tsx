import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValueSelectorProps {
  response: any;
  field: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

interface ExtractedValue {
  value: string;
  path: string;
  type: 'string' | 'number' | 'boolean';
  count: number;
}

export const ValueSelector: React.FC<ValueSelectorProps> = ({
  response,
  field,
  value,
  onValueChange,
  placeholder = "Select value from response..."
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Extract all possible values from the response based on the field path
  const extractedValues = useMemo(() => {
    if (!response) return [];

    const values: ExtractedValue[] = [];
    const valueMap = new Map<string, ExtractedValue>();

    const extractValues = (obj: any, currentPath: string = '') => {
      if (!obj || typeof obj !== 'object') return;

      // Handle arrays
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          const arrayPath = `${currentPath}[${index}]`;
          extractValues(item, arrayPath);
        });
        return;
      }

      // Handle objects
      Object.entries(obj).forEach(([key, val]) => {
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        
        // Extract all primitive values (strings, numbers, booleans)
        if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
          const stringValue = String(val);
          const type = typeof val as 'string' | 'number' | 'boolean';
          
          if (valueMap.has(stringValue)) {
            valueMap.get(stringValue)!.count++;
          } else {
            valueMap.set(stringValue, {
              value: stringValue,
              path: newPath,
              type,
              count: 1
            });
          }
        }
        
        // Recursively extract from nested objects
        if (val && typeof val === 'object') {
          extractValues(val, newPath);
        }
      });
    };

    extractValues(response);
    const result = Array.from(valueMap.values()).sort((a, b) => {
      // Sort by type first, then by value
      const typeOrder = { string: 0, number: 1, boolean: 2 };
      const typeDiff = typeOrder[a.type] - typeOrder[b.type];
      if (typeDiff !== 0) return typeDiff;
      return a.value.localeCompare(b.value);
    });
    
    console.log('ValueSelector - Field:', field, 'Response:', response, 'Extracted values:', result);
    return result;
  }, [response, field]);

  // Filter values based on search
  const filteredValues = useMemo(() => {
    if (!searchValue) return extractedValues;
    
    return extractedValues.filter(item => 
      item.value.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.path.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [extractedValues, searchValue]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'string': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'number': return 'bg-green-100 text-green-800 border-green-200';
      case 'boolean': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'string': return '"';
      case 'number': return '#';
      case 'boolean': return '✓';
      default: return '?';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-left"
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="p-3 border-b">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search values..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="border-0 p-0 focus-visible:ring-0"
            />
          </div>
        </div>
        
        {filteredValues.length > 0 && (
          <div className="p-2 text-xs text-gray-500 border-b">
            Found {filteredValues.length} values from response
          </div>
        )}
        
        <ScrollArea className="h-[300px]">
          {filteredValues.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No values found
            </div>
          ) : (
            <div className="p-1">
              {filteredValues.map((item, index) => (
                <div
                  key={`${item.value}-${index}`}
                  onClick={() => {
                    console.log('ValueSelector - Selected:', item.value, 'from path:', item.path);
                    onValueChange(item.value);
                    setOpen(false);
                    setSearchValue('');
                  }}
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 rounded-md"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Badge className={`text-xs ${getTypeColor(item.type)}`}>
                      {getTypeIcon(item.type)}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.value}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {item.path}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {item.count > 1 && (
                      <Badge variant="outline" className="text-xs">
                        {item.count}x
                      </Badge>
                    )}
                    {value === item.value && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}; 