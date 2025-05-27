import React from 'react';

const Tooltip = ({ children, text }) => {
  return (
    <div className="relative flex items-center group">
      {children}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full mb-2 w-auto p-2 bg-slate-700 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 whitespace-nowrap">
        {text}
      </div>
    </div>
  );
};

export default Tooltip; 