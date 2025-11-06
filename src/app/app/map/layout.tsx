"use client";

import React from 'react';
import { GlobalProvider } from '@/lib/context/GlobalContext';

// Special layout for map page that doesn't include the AppLayout navigation
export default function MapLayout({ children }: { children: React.ReactNode }) {
  return (
    <GlobalProvider>
      <div className="h-screen w-full relative z-0">
        {children}
      </div>
    </GlobalProvider>
  );
}