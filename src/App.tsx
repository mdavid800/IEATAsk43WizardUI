import { useState } from 'react';
import { FormWizard } from './components/FormWizard';
import { SchemaFormWizard } from './components/SchemaFormWizard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingPage } from './components/LandingPage';
import { ArrowLeft, Settings } from 'lucide-react';
import { Button } from './components/ui/button';
import { Logo } from './components/ui/logo';

function App() {
  const [showForm, setShowForm] = useState(false);
  const [useSchemaForm, setUseSchemaForm] = useState(true); // Default to new schema form

  const handleStartForm = () => {
    setShowForm(true);
  };

  const handleBackToLanding = () => {
    setShowForm(false);
  };

  const toggleFormType = () => {
    setUseSchemaForm(prev => !prev);
  };

  if (!showForm) {
    return <LandingPage onStartForm={handleStartForm} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="animated-bg" />
      <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Logo size="md" showText={true} variant="clean" />

            <div className="flex items-center gap-2">
              <Button
                onClick={toggleFormType}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-border hover:border-primary/50"
              >
                <Settings className="w-4 h-4" />
                {useSchemaForm ? 'Use Legacy Form' : 'Use Schema Form'}
              </Button>
              
              <Button
                onClick={handleBackToLanding}
                variant="outline"
                className="flex items-center gap-2 border-border hover:border-primary/50"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="form-container">
          {useSchemaForm ? (
            <ErrorBoundary>
              <SchemaFormWizard 
                onExport={(data) => {
                  console.log('Exported data:', data);
                  // Custom export handling can be added here
                }}
              />
            </ErrorBoundary>
          ) : (
            <FormWizard />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;