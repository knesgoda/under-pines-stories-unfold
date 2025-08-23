import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const Logout: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const performLogout = async () => {
      await logout();
      // Small delay for user feedback
      setTimeout(() => {
        navigate('/login');
      }, 1000);
    };

    performLogout();
  }, [logout, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <h2 className="text-xl font-semibold">Signing Out</h2>
          <p className="text-muted-foreground text-center">
            You're being logged out. Thanks for using Under Pines!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Logout;