import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  textColor?: string;
}

export const WhizUnikLogo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md', 
  textColor = 'text-blue-600' 
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src="/logo-vertical-light.svg" 
        alt="WhizUnik Logo" 
        className={sizeClasses[size]}
      />
      <span className={`ml-2 text-xl font-bold ${textColor}`}>WhizUnik</span>
    </div>
  );
};

export default WhizUnikLogo;