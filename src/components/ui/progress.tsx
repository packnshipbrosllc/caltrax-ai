import React from 'react';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'info';
}

export function Progress({ 
  value, 
  max = 100, 
  className = '', 
  color = 'primary' 
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const colorClasses = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    accent: 'bg-accent',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    info: 'bg-info'
  };

  return (
    <div className={`w-full bg-base-200 rounded-full h-2.5 ${className}`}>
      <div 
        className={`h-2.5 rounded-full transition-all duration-300 ${colorClasses[color]}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}