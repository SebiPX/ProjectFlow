import React from 'react';

interface IconProps {
  path: string;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ path, className = 'w-6 h-6' }) => {
  const isSvgPath = path.includes('M') || path.includes('C'); // basic check for SVG commands
  
  if (!isSvgPath) {
    return <span className={`material-icons-round ${className}`}>{path}</span>;
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
  );
};
