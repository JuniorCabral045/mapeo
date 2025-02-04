import React from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-pre-line opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {content}
        <div className="absolute top-full left-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
};