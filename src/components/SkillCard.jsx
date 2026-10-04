import React from 'react';
import { motion } from 'framer-motion';

export default function SkillCard({ id, name, icon, isSelected, onClick }) {
  return (
    <motion.button
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(id)}
      className={`group relative flex flex-col items-center justify-center h-[120px] rounded-xl border bg-surface transition-all duration-300 overflow-hidden ${
        isSelected
          ? 'border-cyan-400 shadow-[0_0_10px_rgba(72,255,213,0.2)]'
          : 'border-white/10'
      }`}
    >
      <div 
        className={`absolute top-3 right-3 transition-opacity duration-300 ${
          isSelected ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span className="material-symbols-outlined text-cyan-400 text-[20px]">check_circle</span>
      </div>
      <div 
        className={`absolute inset-0 transition-colors duration-300 ${
          isSelected ? 'bg-cyan-400/10' : 'bg-transparent'
        }`}
      ></div>
      <div className="relative z-10 flex flex-col items-center gap-2">
        <span 
          className={`material-symbols-outlined text-[32px] transition-colors duration-300 ${
            isSelected ? 'text-cyan-400' : 'text-surface-variant group-hover:text-cyan-400/50'
          }`}
        >
          {icon}
        </span>
        <span 
          className={`font-mono-label text-mono-label transition-colors duration-300 ${
            isSelected ? 'text-on-background' : 'text-on-background/60'
          }`}
        >
          {name}
        </span>
      </div>
    </motion.button>
  );
}
