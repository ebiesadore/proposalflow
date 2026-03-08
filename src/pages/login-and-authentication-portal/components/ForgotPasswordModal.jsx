import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleEmailSubmit = (e) => {
    e?.preventDefault();
    if (!email) {
      setErrors({ email: 'Email is required' });
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setStep(2);
      setIsLoading(false);
      setErrors({});
    }, 1000);
  };

  const handleSecuritySubmit = (e) => {
    e?.preventDefault();
    if (!securityAnswer) {
      setErrors({ securityAnswer: 'Security answer is required' });
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setStep(3);
      setIsLoading(false);
      setErrors({});
    }, 1000);
  };

  const handleCodeSubmit = (e) => {
    e?.preventDefault();
    if (!verificationCode || verificationCode?.length !== 6) {
      setErrors({ verificationCode: 'Please enter the 6-digit code sent to your email' });
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setStep(4);
      setIsLoading(false);
      setErrors({});
    }, 1000);
  };

  const handlePasswordReset = (e) => {
    e?.preventDefault();
    const newErrors = {};

    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword?.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors)?.length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setStep(5);
      setIsLoading(false);
    }, 1500);
  };

  const handleClose = () => {
    setStep(1);
    setEmail('');
    setSecurityAnswer('');
    setVerificationCode('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card rounded-xl shadow-brand-2xl border border-border w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-heading font-semibold text-foreground">
            Reset Password
          </h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-smooth"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="p-6">
          {step === 1 && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon name="Mail" size={32} className="text-primary" />
                </div>
                <p className="text-sm text-muted-foreground font-caption">
                  Enter your email address and we'll send you instructions to reset your password.
                </p>
              </div>

              <Input
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e?.target?.value)}
                error={errors?.email}
                required
              />

              <Button
                type="submit"
                variant="default"
                fullWidth
                loading={isLoading}
                iconName="ArrowRight"
                iconPosition="right"
              >
                Continue
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSecuritySubmit} className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon name="HelpCircle" size={32} className="text-primary" />
                </div>
                <p className="text-sm text-muted-foreground font-caption">
                  Answer your security question to verify your identity.
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg mb-4">
                <p className="text-sm font-caption font-medium text-foreground">
                  What was the name of your first pet?
                </p>
              </div>

              <Input
                label="Security Answer"
                type="text"
                placeholder="Enter your answer"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e?.target?.value)}
                error={errors?.securityAnswer}
                required
              />

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  fullWidth
                  loading={isLoading}
                  iconName="ArrowRight"
                  iconPosition="right"
                >
                  Verify
                </Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-success/10 rounded-full flex items-center justify-center">
                  <Icon name="ShieldCheck" size={32} className="text-success" />
                </div>
                <p className="text-sm text-muted-foreground font-caption">
                  We've sent a 6-digit verification code to {email}
                </p>
              </div>

              <Input
                label="Verification Code"
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e?.target?.value)}
                error={errors?.verificationCode}
                maxLength={6}
                required
              />

              <button
                type="button"
                className="text-sm font-caption font-medium text-primary hover:text-primary/80 transition-smooth"
              >
                Resend code
              </button>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={() => setStep(2)}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  fullWidth
                  loading={isLoading}
                  iconName="ArrowRight"
                  iconPosition="right"
                >
                  Verify Code
                </Button>
              </div>
            </form>
          )}

          {step === 4 && (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon name="Lock" size={32} className="text-primary" />
                </div>
                <p className="text-sm text-muted-foreground font-caption">
                  Create a strong password with at least 8 characters.
                </p>
              </div>

              <Input
                label="New Password"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e?.target?.value)}
                error={errors?.newPassword}
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e?.target?.value)}
                error={errors?.confirmPassword}
                required
              />

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground font-caption mb-2">Password requirements:</p>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2 text-xs text-muted-foreground font-caption">
                    <Icon name="Check" size={14} className="text-success" />
                    At least 8 characters
                  </li>
                  <li className="flex items-center gap-2 text-xs text-muted-foreground font-caption">
                    <Icon name="Check" size={14} className="text-success" />
                    Mix of uppercase and lowercase
                  </li>
                  <li className="flex items-center gap-2 text-xs text-muted-foreground font-caption">
                    <Icon name="Check" size={14} className="text-success" />
                    At least one number
                  </li>
                </ul>
              </div>

              <Button
                type="submit"
                variant="default"
                fullWidth
                loading={isLoading}
                iconName="Check"
                iconPosition="right"
              >
                Reset Password
              </Button>
            </form>
          )}

          {step === 5 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-success/10 rounded-full flex items-center justify-center">
                <Icon name="CheckCircle" size={32} className="text-success" />
              </div>
              <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
                Password Reset Successful
              </h3>
              <p className="text-sm text-muted-foreground font-caption mb-6">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <Button
                variant="default"
                fullWidth
                onClick={handleClose}
                iconName="LogIn"
                iconPosition="right"
              >
                Return to Login
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;