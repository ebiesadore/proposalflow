import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import { Checkbox } from "../../../components/ui/Checkbox";
import Icon from "../../../components/AppIcon";
import { useAuth } from "../../../contexts/AuthContext";

const LoginForm = ({ onSSOLogin, onForgotPassword }) => {
    const navigate = useNavigate();
    const { signIn } = useAuth();
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        rememberMe: false,
        twoFactorCode: "",
    });
    const [errors, setErrors] = useState({});
    const [showTwoFactor, setShowTwoFactor] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);

    const validateForm = () => {
        const newErrors = {};

        if (!formData?.username?.trim()) {
            newErrors.username = "Username or email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/?.test(formData?.username)) {
            newErrors.username = "Please enter a valid email address";
        }

        if (!formData?.password) {
            newErrors.password = "Password is required";
        } else if (formData?.password?.length < 8) {
            newErrors.password = "Password must be at least 8 characters";
        }

        if (showTwoFactor && !formData?.twoFactorCode) {
            newErrors.twoFactorCode = "2FA code is required";
        } else if (showTwoFactor && formData?.twoFactorCode?.length !== 6) {
            newErrors.twoFactorCode = "2FA code must be 6 digits";
        }

        setErrors(newErrors);
        return Object.keys(newErrors)?.length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e?.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
        if (errors?.[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const handleSubmit = async (e) => {
        e?.preventDefault();

        if (isLocked) {
            setErrors({
                general:
                    "Account locked due to multiple failed attempts. Please try again in 15 minutes or contact support.",
            });
            return;
        }

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            await signIn(formData?.username, formData?.password);
            navigate("/proposal-management-dashboard");
        } catch (error) {
            const newAttempts = loginAttempts + 1;
            setLoginAttempts(newAttempts);

            if (newAttempts >= 3) {
                setIsLocked(true);
                setErrors({
                    general:
                        "Account locked due to multiple failed attempts. Please contact support or try again in 15 minutes.",
                });
            } else {
                setErrors({
                    general: error?.message || `Invalid credentials. ${3 - newAttempts} attempt(s) remaining.`,
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5 lg:space-y-6">
            {errors?.general && (
                <div className="p-3 md:p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                    <Icon name="AlertCircle" size={20} className="text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive font-caption">{errors?.general}</p>
                </div>
            )}
            {!showTwoFactor ? (
                <>
                    <Input
                        label="Username or Email"
                        type="email"
                        name="username"
                        placeholder="Enter your email address"
                        value={formData?.username}
                        onChange={handleInputChange}
                        error={errors?.username}
                        required
                        disabled={isLocked}
                    />

                    <Input
                        label="Password"
                        type="password"
                        name="password"
                        placeholder="Enter your password"
                        value={formData?.password}
                        onChange={handleInputChange}
                        error={errors?.password}
                        required
                        disabled={isLocked}
                    />

                    <div className="flex items-center justify-between">
                        <Checkbox
                            label="Remember me"
                            name="rememberMe"
                            checked={formData?.rememberMe}
                            onChange={handleInputChange}
                            disabled={isLocked}
                        />
                        <button
                            type="button"
                            onClick={onForgotPassword}
                            className="text-sm font-caption font-medium text-primary hover:text-primary/80 transition-smooth"
                            disabled={isLocked}
                        >
                            Forgot password?
                        </button>
                    </div>
                </>
            ) : (
                <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <Icon name="Shield" size={20} className="text-primary" />
                            </div>
                            <div>
                                <h4 className="text-sm font-caption font-semibold text-foreground">
                                    Two-Factor Authentication
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    Enter the 6-digit code from your authenticator app
                                </p>
                            </div>
                        </div>
                    </div>

                    <Input
                        label="2FA Code"
                        type="text"
                        name="twoFactorCode"
                        placeholder="Enter 6-digit code"
                        value={formData?.twoFactorCode}
                        onChange={handleInputChange}
                        error={errors?.twoFactorCode}
                        maxLength={6}
                        required
                    />

                    <button
                        type="button"
                        onClick={() => setShowTwoFactor(false)}
                        className="text-sm font-caption font-medium text-muted-foreground hover:text-foreground transition-smooth"
                    >
                        ← Back to login
                    </button>
                </div>
            )}
            <Button
                type="submit"
                variant="default"
                fullWidth
                loading={isLoading}
                disabled={isLocked}
                iconName={showTwoFactor ? "Shield" : "LogIn"}
                iconPosition="right"
            >
                {showTwoFactor ? "Verify & Sign In" : "Sign In"}
            </Button>
            {!showTwoFactor && (
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-card text-muted-foreground font-caption">Or continue with</span>
                    </div>
                </div>
            )}
            {!showTwoFactor && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onSSOLogin("microsoft")}
                        iconName="Building"
                        iconPosition="left"
                        disabled={isLocked}
                    >
                        Microsoft SSO
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onSSOLogin("google")}
                        iconName="Mail"
                        iconPosition="left"
                        disabled={isLocked}
                    >
                        Google SSO
                    </Button>
                </div>
            )}
        </form>
    );
};

export default LoginForm;
