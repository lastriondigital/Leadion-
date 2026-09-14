import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { LeadionProvider } from './context/LeadionContext';
import { AppShell } from './components/layout/AppShell';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <LeadionProvider>
          <AppShell />
        </LeadionProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
