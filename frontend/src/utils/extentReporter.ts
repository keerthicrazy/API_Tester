// Extent Reporter for Browser Environment
// Generates beautiful HTML reports without requiring a server

interface ValidationRule {
    id: string;
    type: 'status' | 'header' | 'body' | 'responseTime';
    field?: string;
    expectedValue: string;
    result?: 'pass' | 'fail';
    message?: string;
}

interface Endpoint {
    id: string;
    name: string;
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
    description?: string;
}

interface ExecutionResult {
    endpoint: Endpoint;
    status: 'success' | 'failed' | 'pending';
    response?: {
        status: number;
        data: any;
        headers: Record<string, string>;
        time: number;
    };
    error?: string;
    validationResults?: ValidationRule[];
}

interface ExtentTestResult {
    name: string;
    description: string;
    status: 'pass' | 'fail' | 'skip' | 'warning';
    startTime: number;
    endTime: number;
    duration: number;
    method: string;
    url: string;
    requestHeaders: Record<string, string>;
    requestBody?: string;
    responseStatus?: number;
    responseHeaders?: Record<string, string>;
    responseBody?: any;
    responseTime?: number;
    error?: string;
    validations: ValidationRule[];
}

export class ExtentReporter {
    private results: ExtentTestResult[] = [];

    /**
     * Generate Extent report from test execution results
     */
    async generateReport(
        results: ExecutionResult[],
        collectionName: string = 'API Test Collection'
    ): Promise<string> {
        this.results = [];

        // Process each test result
        for (const result of results) {
            const startTime = Date.now();
            const endTime = startTime + (result.response?.time || 1000);

            // Determine final status considering both API response and validation results
            let finalStatus = this.mapStatus(result.status);
            
            // If API call was successful but validations failed, mark as failed
            if (result.status === 'success' && result.validationResults && result.validationResults.length > 0) {
                const failedValidations = result.validationResults.filter(v => v.result === 'fail');
                if (failedValidations.length > 0) {
                    finalStatus = 'fail';
                }
            }

            const extentResult: ExtentTestResult = {
                name: result.endpoint.name,
                description: result.endpoint.description || `Test for ${result.endpoint.method} ${result.endpoint.url}`,
                status: finalStatus,
                startTime,
                endTime,
                duration: result.response?.time || 0,
                method: result.endpoint.method,
                url: result.endpoint.url,
                requestHeaders: result.endpoint.headers,
                requestBody: result.endpoint.body,
                responseStatus: result.response?.status,
                responseHeaders: result.response?.headers,
                responseBody: result.response?.data,
                responseTime: result.response?.time,
                error: result.error,
                validations: result.validationResults || []
            };

            this.results.push(extentResult);
        }

        // Generate HTML report
        const htmlReport = this.generateHTMLReport(collectionName);

        // Download the report
        this.downloadHTML(htmlReport, `${collectionName.replace(/[^a-zA-Z0-9]/g, '_')}_extent_report.html`);

        return 'extent-report-generated';
    }

    /**
     * Map internal status to Extent status
     */
    private mapStatus(status: string): 'pass' | 'fail' | 'skip' | 'warning' {
        switch (status) {
            case 'success':
                return 'pass';
            case 'failed':
            case 'error':
                return 'fail';
            case 'pending':
                return 'skip';
            default:
                return 'warning';
        }
    }

    /**
     * Generate beautiful HTML report
     */
    private generateHTMLReport(collectionName: string): string {
        const timestamp = new Date().toISOString();
        const totalTests = this.results.length;
        const passedTests = this.results.filter(r => r.status === 'pass').length;
        const failedTests = this.results.filter(r => r.status === 'fail').length;
        const skippedTests = this.results.filter(r => r.status === 'skip').length;
        const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Extent Report - ${collectionName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8fafc;
        }
        
        .summary-card {
            background: white;
            padding: 25px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            transition: transform 0.2s ease;
        }
        
        .summary-card:hover {
            transform: translateY(-2px);
        }
        
        .summary-card h3 {
            color: #64748b;
            font-size: 0.875rem;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 10px;
            letter-spacing: 0.5px;
        }
        
        .summary-card .value {
            font-size: 2.5rem;
            font-weight: 700;
            margin: 0;
        }
        
        .passed { color: #10b981; }
        .failed { color: #ef4444; }
        .skipped { color: #f59e0b; }
        .total { color: #3b82f6; }
        .time { color: #8b5cf6; }
        
        .results {
            padding: 30px;
        }
        
        .result-item {
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            margin-bottom: 20px;
            overflow: hidden;
            transition: box-shadow 0.2s ease;
        }
        
        .result-item:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .result-header {
            padding: 25px;
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .result-title {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .result-title h3 {
            margin: 0;
            color: #1e293b;
            font-size: 1.25rem;
        }
        
        .status-badge {
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .status-pass {
            background: #dcfce7;
            color: #166534;
        }
        
        .status-fail {
            background: #fee2e2;
            color: #dc2626;
        }
        
        .status-skip {
            background: #fef3c7;
            color: #d97706;
        }
        
        .status-warning {
            background: #fef3c7;
            color: #d97706;
        }
        
        .result-details {
            padding: 25px;
        }
        
        .detail-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .detail-item {
            display: flex;
            flex-direction: column;
        }
        
        .detail-label {
            font-weight: 600;
            color: #64748b;
            font-size: 0.875rem;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .detail-value {
            font-family: 'Monaco', 'Menlo', monospace;
            background: #f1f5f9;
            padding: 12px;
            border-radius: 6px;
            font-size: 0.875rem;
            border-left: 4px solid #3b82f6;
        }
        
        .validations {
            margin-top: 25px;
        }
        
        .validation-item {
            display: flex;
            align-items: center;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 8px;
            font-size: 0.875rem;
        }
        
        .validation-pass {
            background: #dcfce7;
            color: #166534;
            border-left: 4px solid #10b981;
        }
        
        .validation-fail {
            background: #fee2e2;
            color: #dc2626;
            border-left: 4px solid #ef4444;
        }
        
        .validation-icon {
            margin-right: 10px;
            font-weight: bold;
            font-size: 1rem;
        }
        
        .footer {
            background: #f8fafc;
            padding: 20px;
            text-align: center;
            color: #64748b;
            font-size: 0.875rem;
        }
        
        @media (max-width: 768px) {
            .header h1 {
                font-size: 2rem;
            }
            
            .summary {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .detail-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Extent Report</h1>
            <p>${collectionName} • ${new Date(timestamp).toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <h3>Total Tests</h3>
                <p class="value total">${totalTests}</p>
            </div>
            <div class="summary-card">
                <h3>Passed</h3>
                <p class="value passed">${passedTests}</p>
            </div>
            <div class="summary-card">
                <h3>Failed</h3>
                <p class="value failed">${failedTests}</p>
            </div>
            <div class="summary-card">
                <h3>Skipped</h3>
                <p class="value skipped">${skippedTests}</p>
            </div>
            <div class="summary-card">
                <h3>Duration</h3>
                <p class="value time">${totalDuration}ms</p>
            </div>
            <div class="summary-card">
                <h3>Success Rate</h3>
                <p class="value passed">${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0}%</p>
            </div>
        </div>
        
        <div class="results">
            <h2 style="margin-bottom: 20px; color: #1e293b;">Test Results</h2>
            ${this.results.map((result, index) => `
                <div class="result-item">
                    <div class="result-header">
                        <div class="result-title">
                            <h3>${index + 1}. ${result.name}</h3>
                            <span class="status-badge status-${result.status}">
                                ${result.status.toUpperCase()}
                            </span>
                        </div>
                        <p style="margin: 0; color: #64748b;">
                            ${result.method} ${result.url}
                        </p>
                    </div>
                    <div class="result-details">
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">Method</span>
                                <span class="detail-value">${result.method}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">URL</span>
                                <span class="detail-value">${result.url}</span>
                            </div>
                            ${result.responseStatus ? `
                                <div class="detail-item">
                                    <span class="detail-label">Response Status</span>
                                    <span class="detail-value">${result.responseStatus}</span>
                                </div>
                            ` : ''}
                            ${result.responseTime ? `
                                <div class="detail-item">
                                    <span class="detail-label">Response Time</span>
                                    <span class="detail-value">${result.responseTime}ms</span>
                                </div>
                            ` : ''}
                            ${result.error ? `
                                <div class="detail-item">
                                    <span class="detail-label">Error</span>
                                    <span class="detail-value" style="color: #dc2626;">${result.error}</span>
                                </div>
                            ` : ''}
                        </div>
                        
                        ${result.requestHeaders && Object.keys(result.requestHeaders).length > 0 ? `
                            <div class="detail-item" style="margin-bottom: 20px;">
                                <span class="detail-label">Request Headers</span>
                                <span class="detail-value">${JSON.stringify(result.requestHeaders, null, 2)}</span>
                            </div>
                        ` : ''}
                        
                        ${result.requestBody ? `
                            <div class="detail-item" style="margin-bottom: 20px;">
                                <span class="detail-label">Request Body</span>
                                <span class="detail-value">${result.requestBody}</span>
                            </div>
                        ` : ''}
                        
                        ${result.responseHeaders && Object.keys(result.responseHeaders).length > 0 ? `
                            <div class="detail-item" style="margin-bottom: 20px;">
                                <span class="detail-label">Response Headers</span>
                                <span class="detail-value">${JSON.stringify(result.responseHeaders, null, 2)}</span>
                            </div>
                        ` : ''}
                        
                        ${result.responseBody ? `
                            <div class="detail-item" style="margin-bottom: 20px;">
                                <span class="detail-label">Response Body</span>
                                <span class="detail-value">${JSON.stringify(result.responseBody, null, 2)}</span>
                            </div>
                        ` : ''}
                        
                        ${result.validations && result.validations.length > 0 ? `
                            <div class="validations">
                                <h4 style="margin-bottom: 15px; color: #1e293b;">Validation Results</h4>
                                ${result.validations.map(validation => `
                                    <div class="validation-item validation-${validation.result}">
                                        <span class="validation-icon">
                                            ${validation.result === 'pass' ? '✓' : '✗'}
                                        </span>
                                        <span>
                                            <strong>${validation.type}:</strong> ${validation.message || 'No message'}
                                            ${validation.field ? ` (Field: ${validation.field})` : ''}
                                        </span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="footer">
            <p>Generated by API Tester Pro • ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>`;
    }

    /**
     * Download HTML file (browser-compatible)
     */
    private downloadHTML(htmlContent: string, filename: string): void {
        const blob = new Blob([htmlContent], {type: 'text/html'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Get Extent report info
     */
    getReportInfo(): string {
        return 'Extent Reports - Beautiful HTML reports without server requirements';
    }
} 