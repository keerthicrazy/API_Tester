import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, Mail, User, HelpCircle, FileText, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const changelog = [
  {
    version: 'v1.0.0',
    date: '2024-01-15',
    title: 'Initial Release',
    changes: [
      'BDD Framework Code Generation for OCBC test framework',
      'Request Body Field Configuration with parameterized vs. default fields',
      'Collection Testing with bulk execution and validation',
      'Postman and Swagger/OpenAPI import capabilities',
      'Custom validation rules for API responses',
      'Quick API testing with real-time validation',
      'Jira and Bitbucket integrations',
      'Comprehensive test reporting'
    ]
  },
  {
    version: 'v2.0.0',
    date: '2024-Q2',
    title: 'Future Release',
    changes: [
      'AI-Powered Test Generation',
      'Performance Testing Integration with JMeter',
      'Advanced Test Reporting with charts and trends',
      'CI/CD Pipeline Integration (Jenkins, GitHub Actions)',
      'Multi-Framework Support (Karate, RestAssured)',
      'Test Data Management with data factories'
    ]
  }
];

export const ReleaseNotes: React.FC = () => {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate('/');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">API Tester Pro - Release Notes</h1>
        <p className="text-gray-600">Version history and future plans</p>
      </div>

      <div className="space-y-6">
        {changelog.map((release) => (
          <div key={release.version} className="border rounded p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-medium">Version {release.version}</h3>
                <p className="text-gray-600">{release.date}</p>
              </div>
              <span className="text-sm text-gray-500">{release.title}</span>
            </div>
            <ul className="space-y-1">
              {release.changes.map((change, index) => (
                <li key={index} className="text-gray-700">• {change}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Contact Section */}
      <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
        <h3 className="text-2xl font-bold mb-6 text-center text-gray-800 flex items-center justify-center gap-2">
          <MessageCircle className="w-6 h-6 text-blue-600" />
          Contact & Support
        </h3>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Developer Contact */}
          <div className="bg-white p-6 rounded-lg border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-full">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-800 text-lg">Developer</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">Name:</span>
                <span className="text-gray-800">Lugendra</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">Email:</span>
                <a 
                  href="mailto:lugendra@com" 
                  className="text-blue-600 hover:text-blue-800 underline font-medium flex items-center gap-1 hover:scale-105 transition-transform"
                >
                  <Mail className="w-4 h-4" />
                  lugendra@com
                </a>
              </div>
            </div>
          </div>

          {/* Support & Resources */}
          <div className="bg-white p-6 rounded-lg border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-full">
                <HelpCircle className="w-5 h-5 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-800 text-lg">Support & Resources</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">Report Issues:</span>
                <a 
                  href="https://your-company.atlassian.net/wiki/spaces/DEV/pages/123456789/API+Tester+Pro+Support" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-800 underline font-medium flex items-center gap-1 hover:scale-105 transition-transform"
                >
                  <FileText className="w-4 h-4" />
                  Confluence
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Need help? Contact the development team or check our documentation for quick solutions.
          </p>
        </div>
      </div>

      <div className="text-center mt-8">
        <Button
          variant="outline"
          onClick={handleBackToDashboard}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <Home className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};
