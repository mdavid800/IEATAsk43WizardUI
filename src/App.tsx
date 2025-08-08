//
import { FormWizard } from './components/FormWizard';
import { LandingPage } from './components/LandingPage';
import { ArrowLeft } from 'lucide-react';
import { Button } from './components/ui/button';
import { Logo } from './components/ui/logo';
import { useAppStore } from './store/appStore';
import { ToastProvider } from './components/ui/toast';

function App() {
  const { showForm, startForm, backToLanding } = useAppStore();

  if (!showForm) {
    return (
      <ToastProvider>
        <LandingPage onStartForm={startForm} />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
        <div className="animated-bg" />
        <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
          <div className="container px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <Logo size="md" showText={true} variant="clean" />

              <Button
                onClick={backToLanding}
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
    </ToastProvider>
  );
}

export default App;