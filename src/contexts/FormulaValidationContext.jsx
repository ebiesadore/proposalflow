// Formula Validation Context - REMOVED
// This file has been deprecated and removed from the application

export const FormulaValidationProvider = ({ children }) => children;
export const useFormulaValidation = () => ({
  validateFormulas: () => {},
  validateFieldChange: () => {},
  dismissAlert: () => {},
  clearAlerts: () => {},
  getActiveAlerts: () => [],
  validationState: null
});