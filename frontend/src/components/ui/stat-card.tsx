import { LucideIcon } from "lucide-react";
import { Card } from "./card";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  colorVariant?: 'primary' | 'success' | 'warning' | 'pending';
}

export const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend,
  colorVariant = 'primary' 
}: StatCardProps) => {
  const getColorClasses = () => {
    switch (colorVariant) {
      case 'success':
        return 'text-financial-success bg-financial-success/10';
      case 'warning':
        return 'text-financial-warning bg-financial-warning/10';
      case 'pending':
        return 'text-financial-pending bg-financial-pending/10';
      default:
        return 'text-primary bg-primary/10';
    }
  };

  return (
    <Card className="p-6 bg-gradient-card shadow-card hover:shadow-elevated transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline space-x-2">
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {trend && (
              <span className={`text-xs font-medium ${
                trend.isPositive ? 'text-financial-success' : 'text-destructive'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${getColorClasses()}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
};