"use client";

import React from "react";

export function BackgroundGrid() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-white dark:bg-[#0a0a0a] transition-colors duration-500">
      {/* Subtle light-black lines - Moving back to Background */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='currentColor' stroke-width='1'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Light Dots */}
      <div 
        className="absolute inset-0 opacity-[0.05] dark:opacity-[0.1] text-black dark:text-white" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Ccircle cx='0' cy='0' r='1' fill='currentColor'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
