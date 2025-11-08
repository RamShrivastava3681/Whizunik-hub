import { User, LogOut } from "lucide-react";
import { Button } from "./button";
import { WhizUnikLogo } from "./WhizUnikLogo";

interface LayoutHeaderProps {
  userRole?: 'salesman' | 'evaluator' | 'admin';
  userName?: string;
  onLogout?: () => void;
}

export const LayoutHeader = ({ userRole, userName, onLogout }: LayoutHeaderProps) => {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <WhizUnikLogo size="sm" />
          </div>
          
          {userName && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-700">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">{userName}</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {userRole}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onLogout}
                className="text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};