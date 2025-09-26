import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Sparkles } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description?: string;
  featureName?: string;
  variant?: 'default' | 'compact';
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ 
  title, 
  description = "This feature is coming soon!", 
  featureName,
  variant = 'default'
}) => {
  if (variant === 'compact') {
    return (
      <div className="flex items-center justify-center p-3 border border-dashed border-gray-200 rounded-md bg-gray-50/30">
        <div className="text-center">
          <Clock className="w-4 h-4 text-gray-400 mx-auto mb-1" />
          <h3 className="text-xs font-medium text-gray-600 mb-0.5">{title}</h3>
          <p className="text-xs text-gray-500">{description}</p>
          {featureName && (
            <Badge variant="outline" className="mt-1 text-xs px-1 py-0">
              {featureName}
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100/50">
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center mb-3">
          <div className="relative">
            <Clock className="w-8 h-8 text-gray-400" />
            <Sparkles className="w-4 h-4 text-blue-400 absolute -top-1 -right-1" />
          </div>
        </div>
        <CardTitle className="text-lg text-gray-700">{title}</CardTitle>
        {featureName && (
          <Badge variant="outline" className="mt-2">
            {featureName}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <span>In Development</span>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
        </div>
      </CardContent>
    </Card>
  );
}; 