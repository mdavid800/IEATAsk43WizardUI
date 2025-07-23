import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Schema Form Error:', error, errorInfo);
    this.setState({
      error,
      errorInfo: errorInfo.componentStack
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} reset={this.handleReset} />;
      }

      return (
        <Card className="max-w-2xl mx-auto mt-8 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              Schema Form Error
            </CardTitle>
            <CardDescription className="text-red-700">
              An error occurred while rendering the schema-driven form.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-100 p-3 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Error Details:</h4>
              <p className="text-sm text-red-700 font-mono">
                {this.state.error?.message || 'Unknown error'}
              </p>
            </div>
            
            {this.state.error?.stack && (
              <details className="text-sm">
                <summary className="font-medium text-red-800 cursor-pointer mb-2">
                  Stack Trace
                </summary>
                <pre className="bg-red-100 p-2 rounded text-xs overflow-auto text-red-700">
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={this.handleReset}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Try Again
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700"
              >
                Reload Page
              </Button>
            </div>

            <div className="text-xs text-red-600 mt-4">
              <p>If this error persists, please:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Check the browser console for more details</li>
                <li>Verify the IEA schema file is properly loaded</li>
                <li>Try using the legacy form (toggle in header)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}