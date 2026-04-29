import { Toaster } from 'sonner';
import { toast } from 'sonner';
import type { ReactNode } from 'react';

export function ToastProvider({ children }: { children?: ReactNode }) {
  return (
    <>
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'white',
          },
          className: 'backdrop-blur-xl',
        }}
      />
      {children}
    </>
  );
}

export { toast };