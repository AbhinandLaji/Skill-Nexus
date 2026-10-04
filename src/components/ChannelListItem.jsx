import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function ChannelListItem({ channel, colorClass, to }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `group flex items-center justify-between px-4 py-2 rounded-lg transition-all duration-300 ${
          isActive 
            ? 'bg-surface-variant text-on-surface ring-1 ring-white/[0.08]' 
            : 'text-on-surface-variant hover:bg-surface-variant'
        }`
      }
    >
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${colorClass || 'bg-outline-variant'}`}></div>
        <span className="truncate max-w-[120px]">{channel.name}</span>
      </div>
      {channel.unreadCount > 0 && (
        <span className="bg-secondary-container text-on-secondary-container font-mono-sm px-1.5 rounded">
          {channel.unreadCount}
        </span>
      )}
    </NavLink>
  );
}
