import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/AppIcon";
import { useAuth } from "../../contexts/AuthContext";

import LoginForm from "./components/LoginForm";
import SecurityIndicators from "./components/SecurityIndicators";
import SystemHealthStatus from "./components/SystemHealthStatus";
import SessionOptions from "./components/SessionOptions";
import ForgotPasswordModal from "./components/ForgotPasswordModal";

const LoginAndAuthenticationPortal = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    // Redirect if already logged in
    React.useEffect(() => {
        if (user) {
            navigate("/proposal-management-dashboard");
        }
    }, [user, navigate]);

    const handleSSOLogin = (provider) => {
        console.log(`SSO login with ${provider}`);
        setTimeout(() => {
            navigate("/proposal-management-dashboard");
        }, 1500);
    };

    const handleForgotPassword = () => {
        setShowForgotPassword(true);
    };

    return (
        <div className="min-h-screen lg:h-screen bg-background flex flex-col lg:flex-row lg:overflow-hidden">
            <div className="flex-1 flex items-center justify-center p-4 md:p-6 lg:p-8 lg:overflow-hidden">
                <div className="w-full max-w-md space-y-6 md:space-y-8">
                    <div className="text-center">
                        <div
                            className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-xl mb-4 md:mb-6 shadow-brand-lg"
                            style={{
                                background:
                                    "linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
                            }}
                        >
                            <Icon name="Briefcase" size={32} color="#FFFFFF" className="md:w-10 md:h-10" />
                        </div>
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-2">
                            NeXSYS CORE<sup className="text-xs">™</sup>
                        </h1>
                        <p className="text-sm md:text-base text-muted-foreground font-caption">
                            Enterprise Proposal Management System
                        </p>
                    </div>

                    <div className="bg-card rounded-xl shadow-brand-lg border border-border p-6 md:p-8">
                        <div className="mb-6">
                            <h2 className="text-xl md:text-2xl font-heading font-semibold text-foreground mb-2">
                                Welcome Back
                            </h2>
                            <p className="text-sm text-muted-foreground font-caption">
                                Sign in to access your proposal management dashboard
                            </p>
                        </div>

                        <LoginForm onSSOLogin={handleSSOLogin} onForgotPassword={handleForgotPassword} />
                    </div>

                    <div className="text-center">
                        <p className="text-xs text-muted-foreground font-caption">
                            Protected by enterprise-grade security. By signing in, you agree to our Terms of Service and
                            Privacy Policy.
                        </p>
                    </div>
                </div>
            </div>
            <div className="lg:w-[480px] xl:w-[560px] bg-muted p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 lg:overflow-y-auto">
                <div className="space-y-4 md:space-y-6">
                    <div className="bg-card rounded-xl shadow-brand border border-border p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Icon name="Info" size={24} className="text-primary" />
                            </div>
                            <div>
                                <h3 className="text-base md:text-lg font-heading font-semibold text-foreground">
                                    Demo Credentials
                                </h3>
                                <p className="text-xs text-muted-foreground font-caption">
                                    Use these credentials to explore
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-background rounded-lg border border-border/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon name="UserCog" size={16} className="text-primary" />
                                    <span className="text-xs font-caption font-semibold text-foreground">
                                        Administrator
                                    </span>
                                </div>
                                <div className="space-y-1 text-xs font-caption text-muted-foreground">
                                    <p>Email: admin@nexsyscore.com</p>
                                    <p>Password: Admin@2026</p>
                                </div>
                            </div>

                            <div className="p-4 bg-background rounded-lg border border-border/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon name="User" size={16} className="text-secondary" />
                                    <span className="text-xs font-caption font-semibold text-foreground">Manager</span>
                                </div>
                                <div className="space-y-1 text-xs font-caption text-muted-foreground">
                                    <p>Email: manager@nexsyscore.com</p>
                                    <p>Password: Manager@2026</p>
                                </div>
                            </div>

                            <div className="p-4 bg-background rounded-lg border border-border/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon name="Users" size={16} className="text-accent" />
                                    <span className="text-xs font-caption font-semibold text-foreground">
                                        Standard User
                                    </span>
                                </div>
                                <div className="space-y-1 text-xs font-caption text-muted-foreground">
                                    <p>Email: user@nexsyscore.com</p>
                                    <p>Password: User@2026</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <SecurityIndicators />
                    <SystemHealthStatus />
                    <SessionOptions />

                    <div className="bg-card rounded-lg border border-border shadow-brand p-4 md:p-5 lg:p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Icon name="HelpCircle" size={20} className="text-primary" />
                            <h3 className="text-sm md:text-base font-heading font-semibold text-foreground">
                                Need Help?
                            </h3>
                        </div>
                        <div className="space-y-3">
                            <a
                                href="#"
                                className="flex items-center justify-between p-3 bg-muted rounded-lg transition-smooth hover:bg-muted/80"
                            >
                                <span className="text-sm font-caption text-foreground">Contact IT Support</span>
                                <Icon name="ExternalLink" size={16} className="text-muted-foreground" />
                            </a>
                            <a
                                href="#"
                                className="flex items-center justify-between p-3 bg-muted rounded-lg transition-smooth hover:bg-muted/80"
                            >
                                <span className="text-sm font-caption text-foreground">System Documentation</span>
                                <Icon name="ExternalLink" size={16} className="text-muted-foreground" />
                            </a>
                            <a
                                href="#"
                                className="flex items-center justify-between p-3 bg-muted rounded-lg transition-smooth hover:bg-muted/80"
                            >
                                <span className="text-sm font-caption text-foreground">Report Security Issue</span>
                                <Icon name="ExternalLink" size={16} className="text-muted-foreground" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="text-center pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground font-caption">
                        © {new Date()?.getFullYear()} NeXSYS CORE<sup className="text-[0.6rem]">™</sup>. All rights
                        reserved.
                    </p>
                </div>
            </div>
            <ForgotPasswordModal isOpen={showForgotPassword} onClose={() => setShowForgotPassword(false)} />
        </div>
    );
};

export default LoginAndAuthenticationPortal;
