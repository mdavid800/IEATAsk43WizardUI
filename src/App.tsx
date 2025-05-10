import { FormWizard } from './components/FormWizard';
import { Wind } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="noise-bg" />
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-5xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="gradient-border p-2">
              <Wind className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
              IEA Task 43 Data Model Form
            </h1>
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