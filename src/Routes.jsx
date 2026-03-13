import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import { RoleProvider } from "./components/ui/RoleBasedAccess";
import ProtectedRoute from "./components/ProtectedRoute";
import AuditControlsAndComplianceMonitor from "./pages/audit-controls-and-compliance-monitor";
import IntegratedEmailCommunicationCenter from "./pages/integrated-email-communication-center";
import ProposalManagementDashboard from "./pages/proposal-management-dashboard";
import PDFGenerationAndDocumentExportHub from "./pages/pdf-generation-and-document-export-hub";
import LoginAndAuthenticationPortal from "./pages/login-and-authentication-portal";
import SystemSettingsAndConfigurationHub from "./pages/system-settings-and-configuration-hub";
import ProposalTemplateManagementStudio from "./pages/proposal-template-management-studio";
import UserManagementAndAccessControl from "./pages/user-management-and-access-control";
import ClientManagementDashboard from "./pages/client-management-dashboard";
import NewProposalCreationWorkspace from "./pages/new-proposal-creation-workspace";
import MaterialLibraryManagement from "./pages/material-library-management";
import AdditionalScope from "pages/additional-scope";
import ExternalTrade from "pages/external-trade";
import ProposalVersionHistoryPanel from "./pages/proposal-version-history-panel";
import ProposalExportTemplateDesigner from "./pages/proposal-export-template-designer";

const Routes = () => {
    return (
        <BrowserRouter>
            <ErrorBoundary>
                <ScrollToTop />
                <RoleProvider>
                    <RouterRoutes>
                        {/* Define your route here */}
                        <Route path="/" element={<LoginAndAuthenticationPortal />} />
                        <Route path="/login-and-authentication-portal" element={<LoginAndAuthenticationPortal />} />
                        <Route
                            path="/audit-controls-and-compliance-monitor"
                            element={
                                <ProtectedRoute>
                                    <AuditControlsAndComplianceMonitor />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/integrated-email-communication-center"
                            element={
                                <ProtectedRoute>
                                    <IntegratedEmailCommunicationCenter />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/proposal-management-dashboard"
                            element={
                                <ProtectedRoute>
                                    <ProposalManagementDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/pdf-generation-and-document-export-hub"
                            element={
                                <ProtectedRoute>
                                    <PDFGenerationAndDocumentExportHub />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/system-settings-and-configuration-hub"
                            element={
                                <ProtectedRoute>
                                    <SystemSettingsAndConfigurationHub />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/proposal-template-management-studio"
                            element={
                                <ProtectedRoute>
                                    <ProposalTemplateManagementStudio />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/user-management-and-access-control"
                            element={
                                <ProtectedRoute>
                                    <UserManagementAndAccessControl />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/client-management-dashboard"
                            element={
                                <ProtectedRoute>
                                    <ClientManagementDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/new-proposal-creation-workspace"
                            element={
                                <ProtectedRoute>
                                    <NewProposalCreationWorkspace />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/material-library-management"
                            element={
                                <ProtectedRoute>
                                    <MaterialLibraryManagement />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="/additional-scope" element={<AdditionalScope />} />
                        <Route path="/external-trade" element={<ExternalTrade />} />
                        <Route
                            path="/proposal-version-history-panel"
                            element={
                                <ProtectedRoute>
                                    <ProposalVersionHistoryPanel />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/proposal-export-template-designer"
                            element={
                                <ProtectedRoute>
                                    <ProposalExportTemplateDesigner />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="*" element={<NotFound />} />
                    </RouterRoutes>
                </RoleProvider>
            </ErrorBoundary>
        </BrowserRouter>
    );
};

export default Routes;
