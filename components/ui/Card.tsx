
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      className={`bg-card text-card-foreground border border-border rounded-xl shadow-sm p-4 sm:p-6 transition-colors ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
