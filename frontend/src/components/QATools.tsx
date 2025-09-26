import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  TestTube, 
  Database, 
  Shield, 
  Zap, 
  BarChart3, 
  Bug, 
  Clock, 
  Users,
  ArrowRight,
  FileText
} from "lucide-react";
import { isFeatureEnabled } from '@/config';

const QATools = () => {
  const navigate = useNavigate();

  // If dashboard is disabled, redirect to API Tester Pro
  useEffect(() => {
    if (!isFeatureEnabled('qaToolsDashboard')) {
      navigate('/apitesterpro');
    }
  }, [navigate]);

  // If dashboard is disabled, don't render anything
  if (!isFeatureEnabled('qaToolsDashboard')) {
    return null;
  }

  // Check if Release Notes is enabled
  const showReleaseNotes = isFeatureEnabled('releaseNotes');

  const handleReleaseNotes = () => {
    navigate('/release-notes');
  };

  const tools = [
    {
      id: "api-tester",
      title: "API Tester Pro",
      description: "Comprehensive API testing with collection imports, validation, and reporting",
      icon: TestTube,
      status: "Available",
      route: "/apitesterpro",
      features: ["REST API Testing", "Collection Import", "Response Validation", "Test Reports"],
      featureFlag: "qaToolsDashboard" // This controls if the tool is visible
    },
    {
      id: "load-tester",
      title: "Load Tester",
      description: "Performance testing and load simulation for your applications",
      icon: Zap,
      status: "Coming Soon",
      route: "#",
      features: ["Performance Testing", "Load Simulation", "Stress Testing", "Metrics Analysis"],
      featureFlag: "loadTester"
    },
    {
      id: "security-scanner",
      title: "Security Scanner",
      description: "Automated security vulnerability scanning and analysis",
      icon: Shield,
      status: "Coming Soon",
      route: "#",
      features: ["Vulnerability Scanning", "Security Reports", "OWASP Testing", "Risk Assessment"],
      featureFlag: "securityScanner"
    },
    {
      id: "test-manager",
      title: "Test Case Manager",
      description: "Organize and manage your test cases, suites, and execution plans",
      icon: Database,
      status: "Coming Soon",
      route: "#",
      features: ["Test Case Management", "Test Suites", "Execution Plans", "Requirements Tracing"],
      featureFlag: "testManager"
    },
    {
      id: "analytics",
      title: "QA Analytics",
      description: "Comprehensive analytics and insights for your testing activities",
      icon: BarChart3,
      status: "Coming Soon",
      route: "#",
      features: ["Test Metrics", "Quality Reports", "Trend Analysis", "Performance Insights"],
      featureFlag: "qaAnalytics"
    },
    {
      id: "bug-tracker",
      title: "Bug Tracker",
      description: "Track, manage, and resolve bugs throughout your testing lifecycle",
      icon: Bug,
      status: "Coming Soon",
      route: "#",
      features: ["Bug Tracking", "Issue Management", "Workflow Automation", "Integration Support"],
      featureFlag: "bugTracker"
    }
  ];

  // Filter tools based on feature flags
  const visibleTools = tools.filter(tool => {
    if (tool.id === "api-tester") {
      // API Tester Pro is always visible if qaToolsDashboard is enabled
      return isFeatureEnabled('qaToolsDashboard');
    }
    // Other tools are controlled by their individual feature flags
    return isFeatureEnabled(tool.featureFlag as keyof typeof import('@/config').config.features);
  });

  const handleToolClick = (tool: typeof tools[0]) => {
    if (tool.status === "Available") {
      navigate(tool.route);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">QA Tools Suite</h1>
              <p className="text-muted-foreground">Comprehensive testing tools for quality assurance teams</p>
            </div>
            <div className="flex items-center gap-4">
              
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
              
              <Badge variant="secondary" className="text-sm">
                <Users className="w-4 h-4 mr-1" />
                QA Team Portal
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Everything You Need for Quality Assurance
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A complete suite of professional testing tools designed to streamline your QA workflow 
            and ensure the highest quality for your applications.
          </p>
        </section>

        {/* Tools Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleTools.map((tool) => {
            const IconComponent = tool.icon;
            const isAvailable = tool.status === "Available";
            
            return (
              <Card 
                key={tool.id} 
                className={`transition-all duration-200 hover:shadow-lg ${
                  isAvailable 
                    ? 'cursor-pointer hover:border-primary/50 hover:scale-105' 
                    : 'opacity-75 cursor-not-allowed'
                }`}
                onClick={() => handleToolClick(tool)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <IconComponent className="w-8 h-8 text-primary" />
                    <Badge 
                      variant={isAvailable ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {tool.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{tool.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {tool.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                    <Button 
                      className="w-full" 
                      variant={isAvailable ? "default" : "secondary"}
                      disabled={!isAvailable}
                    >
                      {isAvailable ? (
                        <>
                          Launch Tool
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      ) : (
                        "Coming Soon"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        {/* Stats Section */}
        <section className="mt-16 bg-muted/50 rounded-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <h3 className="text-3xl font-bold text-primary mb-2">{visibleTools.length}</h3>
              <p className="text-muted-foreground">Testing Tools</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-primary mb-2">
                {visibleTools.filter(t => t.status === "Available").length}
              </h3>
              <p className="text-muted-foreground">Available Now</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-primary mb-2">∞</h3>
              <p className="text-muted-foreground">Possibilities</p>
            </div>
          </div>
        </section>

        {/* Quick Access Section */}
        {visibleTools.filter(t => t.status === "Available").length > 0 && (
          <section className="mt-12 bg-primary/5 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4 text-center">
              Quick Access to Available Tools
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              {visibleTools
                .filter(t => t.status === "Available")
                .map((tool) => {
                  const IconComponent = tool.icon;
                  return (
                    <Button
                      key={tool.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleToolClick(tool)}
                      className="flex items-center gap-2"
                    >
                      <IconComponent className="w-4 h-4" />
                      {tool.title}
                    </Button>
                  );
                })}
            </div>
          </section>
        )}
      </main>

    </div>
  );
};

export default QATools; 