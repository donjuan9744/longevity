import { useCallback, useRef, useState } from 'react';

const TOAST_DURATION = 2500;

export function useToast() {
  const [message, setMessage] = useState('');
  const timeoutRef = useRef<number | null>(null);

  const showToast = useCallback((value: string) => {
    setMessage(value);

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setMessage('');
      timeoutRef.current = null;
    }, TOAST_DURATION);
  }, []);

  return {
    message,
    showToast
  };
}
