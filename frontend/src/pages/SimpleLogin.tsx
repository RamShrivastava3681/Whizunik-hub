import { useState } from "react";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SimpleLoginProps {
  onLogin: (username: string, role: 'salesman' | 'evaluator') => void;
}

export default function SimpleLogin({ onLogin }: SimpleLoginProps) {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'salesman' | 'evaluator'>('salesman');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim(), role);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img 
              src="/logo-vertical-light.svg" 
              alt="Whizunik Logo" 
              className="w-10 h-10"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Whizunik Hub</h1>
              <p className="text-sm text-gray-600">Trade Finance Platform</p>
            </div>
          </div>
          <p className="text-gray-600">
            Demo Mode - No authentication required
          </p>
        </div>

        {/* Simple Demo Form */}
        <Card className="p-6 bg-gray-50 backdrop-blur-sm shadow-lg border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Enter Your Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="username"
                  placeholder="Enter your name"
                  className="pl-10"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Select Your Role</Label>
              <Tabs 
                value={role} 
                onValueChange={(value) => setRole(value as 'salesman' | 'evaluator')}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="salesman">Sales Team</TabsTrigger>
                  <TabsTrigger value="evaluator">Evaluator</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <Button
              type="submit"
              variant="financial"
              className="w-full"
              disabled={!username.trim()}
            >
              Enter Demo
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Card className="p-4 bg-primary/10 border-primary/20">
              <p className="text-xs text-primary-foreground/90 mb-2">
                <strong>Demo Mode:</strong> Experience the platform without signup
              </p>
              <p className="text-xs text-primary-foreground/70">
                • Salesman: Create and manage applications<br/>
                • Evaluator: Review and evaluate applications
              </p>
            </Card>
          </div>
        </Card>
      </div>
    </div>
  );
}
