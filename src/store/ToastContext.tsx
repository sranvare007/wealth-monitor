import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

export type ToastType = 'info' | 'success' | 'error';

export type ToastEntry = {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
};

type ToastContextValue = {
  current: ToastEntry | null;
  show: (message: string, type?: ToastType, duration?: number) => void;
  dismiss: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let _id = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<ToastEntry | null>(null);
  const queueRef = useRef<ToastEntry[]>([]);
  const activeRef = useRef(false);

  const showNext = useCallback(() => {
    const next = queueRef.current.shift();
    if (!next) { activeRef.current = false; return; }
    activeRef.current = true;
    setCurrent(next);
  }, []);

  const dismiss = useCallback(() => {
    setCurrent(null);
    showNext();
  }, [showNext]);

  const show = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const entry: ToastEntry = { id: ++_id, message, type, duration };
    if (activeRef.current) {
      queueRef.current.push(entry);
    } else {
      activeRef.current = true;
      setCurrent(entry);
    }
  }, []);

  return (
    <ToastContext.Provider value={{ current, show, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): (message: string, type?: ToastType, duration?: number) => void {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx.show;
}

export function useToastContext(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToastContext must be used inside ToastProvider');
  return ctx;
}
