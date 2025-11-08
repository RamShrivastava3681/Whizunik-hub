import { Badge } from "./badge";

interface ApplicationStatusBadgeProps {
  status: 'in-progress' | 'submitted' | 'under-review' | 'approved' | 'rejected' | 'pending';
}

export const ApplicationStatusBadge = ({ status }: ApplicationStatusBadgeProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'approved':
        return { variant: 'default' as const, color: 'bg-financial-success text-white', label: 'Approved' };
      case 'rejected':
        return { variant: 'destructive' as const, color: 'bg-destructive text-destructive-foreground', label: 'Rejected' };
      case 'under-review':
        return { variant: 'secondary' as const, color: 'bg-financial-warning text-white', label: 'Under Review' };
      case 'submitted':
        return { variant: 'outline' as const, color: 'bg-financial-pending text-white', label: 'Submitted' };
      case 'pending':
        return { variant: 'outline' as const, color: 'bg-financial-pending/20 text-financial-pending border-financial-pending', label: 'Pending' };
      default:
        return { variant: 'secondary' as const, color: 'bg-muted text-muted-foreground', label: 'In Progress' };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge variant={config.variant} className={`${config.color} font-medium text-xs`}>
      {config.label}
    </Badge>
  );
};