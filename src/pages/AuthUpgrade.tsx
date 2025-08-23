import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Shield } from 'lucide-react';

const AuthUpgrade: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    passwordConfirm: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement email upgrade logic when email auth is re-enabled
    console.log('Auth upgrade not yet implemented');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Shield className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-2xl font-bold">Upgrade Your Account</h1>
          <p className="text-muted-foreground">
            Add email authentication for better security
          </p>
        </div>

        {/* Coming Soon Notice */}
        <Alert>
          <Mail className="h-4 w-4" />
          <AlertDescription>
            Email authentication will be available after the beta period. 
            Your account will continue to work with your current username and password.
          </AlertDescription>
        </Alert>

        {/* Form Card (Disabled for now) */}
        <Card className="shadow-soft border-border/50 opacity-50">
          <CardHeader>
            <CardTitle>Add Email Address</CardTitle>
            <CardDescription>
              Secure your account with email verification (coming soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your.email@example.com"
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordConfirm">Confirm Password</Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  value={formData.passwordConfirm}
                  onChange={(e) => setFormData(prev => ({ ...prev, passwordConfirm: e.target.value }))}
                  placeholder="Enter your current password"
                  disabled
                />
              </div>

              <Button type="submit" className="w-full" disabled>
                Add Email (Coming Soon)
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Back Link */}
        <div className="text-center">
          <Button variant="ghost" onClick={() => window.history.back()}>
            ← Back to Profile
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AuthUpgrade;