import React, { Fragment, createContext, useContext } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { cn } from '../../utils/cn';

type AlertDialogContextValue = {
    onOpenChange?: (open: boolean) => void;
};

const AlertDialogCtx = createContext<AlertDialogContextValue>({});

export function AlertDialog({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode; }) {
    return (
        <AlertDialogCtx.Provider value={{ onOpenChange }}>
            <Transition.Root show={open} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={onOpenChange}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
                        leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/30" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            {children}
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>
        </AlertDialogCtx.Provider>
    );
}

export function AlertDialogContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <Transition.Child
            as={Fragment}
            enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
            leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
        >
            <Dialog.Panel className={cn(
                'w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all border border-border',
                className
            )}>
                {children}
            </Dialog.Panel>
        </Transition.Child>
    );
}

export function AlertDialogHeader({ children }: { children: React.ReactNode }) {
    return <div className="mb-2">{children}</div>;
}

export function AlertDialogTitle({ children }: { children: React.ReactNode }) {
    return <Dialog.Title className="text-lg font-medium text-foreground">{children}</Dialog.Title>;
}

export function AlertDialogDescription({ children }: { children: React.ReactNode }) {
    return <Dialog.Description className="mt-1 text-sm text-muted-foreground">{children}</Dialog.Description>;
}

export function AlertDialogFooter({ children }: { children: React.ReactNode }) {
    return <div className="mt-6 flex items-center justify-end gap-2">{children}</div>;
}

export function AlertDialogCancel({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
    const { onOpenChange } = useContext(AlertDialogCtx);
    const handle = () => {
        onClick?.();
        onOpenChange?.(false);
    };
    return (
        <button type="button" onClick={handle} className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
            {children}
        </button>
    );
}

export function AlertDialogAction({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
    const { onOpenChange } = useContext(AlertDialogCtx);
    const handle = () => {
        onClick?.();
        onOpenChange?.(false);
    };
    return (
        <button type="button" onClick={handle} className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            {children}
        </button>
    );
}
