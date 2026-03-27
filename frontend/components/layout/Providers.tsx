"use client";

import { ToastProvider } from "@/context/ToastContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}
