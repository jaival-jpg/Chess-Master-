import React from 'react';

export const CoinIcon = ({ className = "w-6 h-6" }: { className?: string }) => {
  return (
    <svg className={`drop-shadow-md ${className}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="11" fill="url(#gold-gradient-bg)" stroke="#B8860B" strokeWidth="0.5"/>
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="#DAA520" strokeWidth="1" strokeDasharray="1.5 1.5"/>
      <text x="12" y="16.5" fontSize="12" fontFamily="serif" fontWeight="900" fill="#996515" textAnchor="middle" style={{ textShadow: '0px 1px 1px rgba(255,255,255,0.5)' }}>
        ₹
      </text>
      <defs>
        <linearGradient id="gold-gradient-bg" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF8DC"/>
          <stop offset="25%" stopColor="#FFD700"/>
          <stop offset="50%" stopColor="#FDB813"/>
          <stop offset="80%" stopColor="#DAA520"/>
          <stop offset="100%" stopColor="#8B6508"/>
        </linearGradient>
      </defs>
    </svg>
  );
};
