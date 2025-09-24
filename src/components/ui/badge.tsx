import React from 'react';
import clsx from 'clsx';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className,
  ...props
}) => {
  const classes = clsx(
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
    {
      'bg-primary text-primary-foreground': variant === 'default',
      'bg-secondary text-secondary-foreground': variant === 'secondary',
      'bg-destructive text-destructive-foreground': variant === 'destructive',
      'border border-input bg-background text-foreground': variant === 'outline',
    },
    className
  );

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};
