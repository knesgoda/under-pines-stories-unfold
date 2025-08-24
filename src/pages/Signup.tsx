import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Check } from 'lucide-react';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters' };
    }
    
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (!hasLetter || !hasNumber) {
      return { isValid: false, error: 'Password must contain both letters and numbers' };
    }
    
    return { isValid: true };
  };

  const handleEmailChange = (value: string) => {
    setFormData(prev => ({ ...prev, email: value }));
    
    // Clear previous error
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }

    // Validate email
    if (!validateEmail(value) && value.length > 0) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setFormData(prev => ({ ...prev, password: value }));
    
    // Clear previous error
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: '' }));
    }

    // Validate password
    const validation = validatePassword(value);
    if (!validation.isValid && value.length > 0) {
      setErrors(prev => ({ ...prev, password: validation.error || '' }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setFormData(prev => ({ ...prev, confirmPassword: value }));
    
    // Clear previous error
    if (errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
    }

    // Validate password match
    if (value !== formData.password && value.length > 0) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: Record<string, string> = {};
    
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.error || 'Invalid password';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const success = await register({
        email: formData.email,
        password: formData.password,
      });

      if (success) {
        navigate('/');
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = 
    formData.email && 
    formData.password && 
    formData.confirmPassword &&
    formData.password === formData.confirmPassword &&
    validateEmail(formData.email) &&
    Object.keys(errors).length === 0;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Join Under Pines
          </h1>
          <p className="text-muted-foreground">
            Create your account and start connecting
          </p>
        </div>

        {/* Form Card */}
        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>
              Enter your email and password to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="Enter your email address"
                    className={errors.email ? 'border-destructive' : ''}
                    autoComplete="email"
                  />
                  {formData.email && !errors.email && validateEmail(formData.email) && (
                    <Check className="absolute right-3 top-3 h-4 w-4 text-primary" />
                  )}
                </div>
                {errors.email && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.email}
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="Create a strong password"
                  className={errors.password ? 'border-destructive' : ''}
                  autoComplete="new-password"
                />
                {errors.password && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.password}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  At least 8 characters with letters and numbers
                </p>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  placeholder="Confirm your password"
                  className={errors.confirmPassword ? 'border-destructive' : ''}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.confirmPassword}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  className="font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Beta Notice */}
        <div className="text-center text-xs text-muted-foreground">
          <p>
            Beta version - Email confirmation disabled during testing.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;