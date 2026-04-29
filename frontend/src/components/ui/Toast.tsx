import { Toaster } from 'sonner';
import { toast } from 'sonner';

export function ToastProvider() {
  return (
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
  );
}

export { toast };