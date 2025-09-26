
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, ArrowLeft, Home, FileText } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isFeatureEnabled } from '@/config';

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Show back button only when dashboard is enabled AND not on the main route
  const showBackButton = isFeatureEnabled('qaToolsDashboard') && location.pathname !== '/';
  
  // Check if Release Notes is enabled
  const showReleaseNotes = isFeatureEnabled('releaseNotes');
  
  const handleBackToDashboard = () => {
    navigate('/');
  };

  const handleReleaseNotes = () => {
    navigate('/release-notes');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <header className="bg-background border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {showBackButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToDashboard}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <Home className="w-4 h-4" />
                Dashboard
              </Button>
            )}
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">API Tester Pro</h1>
                <p className="text-xs text-muted-foreground">Professional API Testing Suite</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Home Button - Always visible */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoHome}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <Home className="w-4 h-4" />
              Home
            </Button>
            
            {showReleaseNotes && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReleaseNotes}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <FileText className="w-4 h-4" />
                Release Notes
              </Button>
            )}
            
            {/*<Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">*/}
            {/*  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>*/}
            {/*  Ready*/}
            {/*</Badge>*/}
          </div>
        </div>
      </div>
    </header>
  );
};
