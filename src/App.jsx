import React from "react";
import { AuthProvider } from './contexts/AuthContext';
import { FormulaValidationProvider } from './contexts/FormulaValidationContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Routes from "./Routes";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FormulaValidationProvider>
          <ToastProvider>
            <Routes />
          </ToastProvider>
        </FormulaValidationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
