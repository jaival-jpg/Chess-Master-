import React from 'react';

export const CoinIcon = ({ className = "w-6 h-6" }: { className?: string }) => {
  return (
    <svg className={`drop-shadow-lg ${className}`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="url(#gold-gradient-bg)" stroke="#B8860B" strokeWidth="2"/>
      <circle cx="50" cy="50" r="40" fill="none" stroke="#DAA520" strokeWidth="4" strokeDasharray="6 6"/>
      <circle cx="50" cy="50" r="34" fill="url(#gold-gradient-inner)" stroke="#FFD700" strokeWidth="1"/>
      <text x="50" y="70" fontSize="56" fontFamily="sans-serif" fontWeight="900" fill="#996515" textAnchor="middle" style={{ textShadow: '2px 2px 0px rgba(255,255,255,0.7), -1px -1px 0px rgba(0,0,0,0.2)' }}>
        ₹
      </text>
      
      {/* 3D Sheen overlay */}
      <path d="M 50 2 A 48 48 0 0 1 98 50 A 48 48 0 0 0 2 50 A 48 48 0 0 1 50 2 Z" fill="white" fillOpacity="0.2" />

      <defs>
        <linearGradient id="gold-gradient-bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF8DC"/>
          <stop offset="30%" stopColor="#FFD700"/>
          <stop offset="70%" stopColor="#FDB813"/>
          <stop offset="100%" stopColor="#8B6508"/>
        </linearGradient>
        <linearGradient id="gold-gradient-inner" x1="100" y1="100" x2="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFD700"/>
          <stop offset="50%" stopColor="#FDB813"/>
          <stop offset="100%" stopColor="#FFF8DC"/>
        </linearGradient>
      </defs>
    </svg>
  );
};
