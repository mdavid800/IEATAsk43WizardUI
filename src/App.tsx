import { FormWizard } from './components/FormWizard';
import { Wind } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="animated-bg" />
      <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-5xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-border p-2 bg-white">
              <Wind className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">
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