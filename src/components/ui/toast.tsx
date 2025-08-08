import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { cn } from '../../utils/cn';

export type Toast = { id: number; title?: string; description?: string; };

type ToastContextValue = {
    showToast: (toast: Omit<Toast, 'id'>) => void;
};

const ToastCtx = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const showToast = useCallback((t: Omit<Toast, 'id'>) => {
        const id = Date.now() + Math.floor(Math.random() * 1000);
        setToasts((prev) => [...prev, { id, ...t }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((x) => x.id !== id));
        }, 2500);
    }, []);

    const value = useMemo(() => ({ showToast }), [showToast]);

    return (
        <ToastCtx.Provider value={value}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map((t) => (
                    <div key={t.id} className={cn('rounded-md border border-border bg-white shadow p-3 w-72')}>
                        {t.title && <div className="text-sm font-medium">{t.title}</div>}
                        {t.description && <div className="text-xs text-muted-foreground">{t.description}</div>}
                    </div>
                ))}
            </div>
        </ToastCtx.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastCtx);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}
