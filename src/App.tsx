import { useState } from 'react';
import { FormWizard } from './components/FormWizard';
import { LandingPage } from './components/LandingPage';
import { ArrowLeft } from 'lucide-react';
import { Button } from './components/ui/button';
import { Logo } from './components/ui/logo';

function App() {
  const [showForm, setShowForm] = useState(false);



  const handleStartForm = () => {
    setShowForm(true);
  };

  const handleBackToLanding = () => {
    setShowForm(false);
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
      </header>
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="form-container">
          <FormWizard />
        </div>
      </main>
    </div>
  );
}

export default App;