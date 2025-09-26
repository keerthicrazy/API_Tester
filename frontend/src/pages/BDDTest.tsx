import React from 'react';
import { BDDCodeGenerator } from '@/components/BDDCodeGenerator';
import { sampleEndpoints } from '@/utils/sampleEndpoints';
import { Header } from '@/components/Header';

const BDDTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              OCBC BDD Framework Code Generation
            </h1>
            <p className="text-gray-600">
              Generate OCBC test framework code for your API endpoints. This feature creates:
            </p>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
              <li>Feature files with Gherkin syntax and OCBC tags</li>
              <li>Step definitions in Java (OCBC standard)</li>
              <li>Service classes with embedded POJO models</li>
              <li>Enterprise-grade test structure aligned with OCBC standards</li>
            </ul>
          </div>

          <BDDCodeGenerator endpoints={sampleEndpoints} />
        </div>
      </main>
    </div>
  );
};

export default BDDTest; 