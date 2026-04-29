import { toast } from 'sonner';

interface ToastOptions {
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'info';
}

export function useToast() {
  const showToast = (options: ToastOptions) => {
    const { title, description, type = 'info' } = options;

    switch (type) {
      case 'success':
        toast.success(title, { description });
        break;
      case 'error':
        toast.error(title, { description });
        break;
      case 'info':
      default:
        toast.info(title, { description });
        break;
    }
  };

  return { showToast };
}